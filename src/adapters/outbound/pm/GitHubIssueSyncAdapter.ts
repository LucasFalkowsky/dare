import { Inject, Injectable } from '@nestjs/common';
import { IWorkItemCommentPort } from '../../../domain/ports/outbound/IWorkItemCommentPort';
import { IPrincipleInheritancePort } from '../../../domain/ports/outbound/IPrincipleInheritancePort';
import { Installation } from '../../../domain/model/Installation';
import {
  GITHUB_API_URL,
  GITHUB_ACCESS_TOKEN,
  GITHUB_ISSUE_FIELD_NAME,
} from './github.config';

/**
 * GitHub's issue-field option colors are a fixed enum, not hex values.
 * 'blue' is the closest match to the '#428BCA' used for GitLab labels.
 */
const OPTION_COLOR = 'blue';

/** Organization-wide limit on options per issue field. */
const MAX_OPTIONS_PER_FIELD = 100;

/** GitHub's maximum page size for list endpoints. */
const PER_PAGE_MAX = 100;

interface IssueFieldOption {
  id: number;
  name: string;
  description: string | null;
  color: string;
  priority: number;
}

interface IssueField {
  id: number;
  name: string;
  data_type: string;
  options: IssueFieldOption[] | null;
}

/**
 * Implements the principle vocabulary on top of GitHub's organization-level
 * "issue fields" (public preview since 2026-05-21) rather than labels: a single
 * `multi_select` field holds every principle as an option, so one issue can
 * carry several principles the same way GitLab issues carry several labels.
 *
 * Consequences of that choice:
 * - Fields are defined per organization, not per repository. `ensureLabels`
 *   therefore writes org-wide and needs a token with `admin:org`, where the
 *   GitLab adapter only needs project-level access.
 * - Repositories under a personal account have no issue fields at all.
 * - `findWorkItemsByLabel` has to go through the search API, because the
 *   repository issue list cannot filter by field value.
 */
@Injectable()
export class GitHubIssueSyncAdapter implements IWorkItemCommentPort, IPrincipleInheritancePort {
  readonly platform = 'github';

  /** GitHub has both the issue field and the sub-issue hierarchy. */
  readonly supported = true;

  constructor(
    @Inject(GITHUB_API_URL) private readonly apiUrl: string,
    @Inject(GITHUB_ACCESS_TOKEN) private readonly accessToken: string,
    @Inject(GITHUB_ISSUE_FIELD_NAME) private readonly fieldName: string,
  ) {}

  /**
   * The raw `owner/repo`. Installations resolved from the environment carry the
   * full path in `repo` and leave `owner` empty.
   */
  private repoFullName(installation: Installation): string {
    return installation.owner
      ? `${installation.owner}/${installation.repo}`
      : installation.repo;
  }

  /**
   * GitHub addresses a repository as two path segments (`/repos/:owner/:repo`),
   * so each segment is encoded on its own and the slash stays a separator.
   */
  private repoPath(installation: Installation): string {
    return this.repoFullName(installation).split('/').map(encodeURIComponent).join('/');
  }

  /** The organization that owns the repository — issue fields live here. */
  private org(installation: Installation): string {
    const org = this.repoFullName(installation).split('/')[0];
    if (!org) {
      throw new Error(
        `GitHub issue fields require an organization, but installation "${installation.installationId}" resolved to no owner.`,
      );
    }
    return org;
  }

  private headers(withBody = false): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (withBody) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  private async request(method: string, url: string, body?: unknown): Promise<Response> {
    const response = await fetch(url, {
      method,
      headers: this.headers(body !== undefined),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${method} ${url} responded with ${response.status} ${response.statusText}`,
      );
    }

    return response;
  }

  // ─── principle vocabulary (issue field) ──────────────────────────────────

  private async findIssueField(org: string): Promise<IssueField | null> {
    const url = `${this.apiUrl}/orgs/${encodeURIComponent(org)}/issue-fields`;
    const response = await this.request('GET', url);

    const fields = await response.json() as IssueField[];
    const wanted = this.fieldName.toLowerCase();

    return fields.find(f => f.name.toLowerCase() === wanted) ?? null;
  }

  private async createIssueField(org: string, optionNames: string[]): Promise<void> {
    const url = `${this.apiUrl}/orgs/${encodeURIComponent(org)}/issue-fields`;

    await this.request('POST', url, {
      name: this.fieldName,
      description: 'DARE principles related to this issue',
      data_type: 'multi_select',
      visibility: 'all',
      options: optionNames.map((name, index) => ({
        name,
        color: OPTION_COLOR,
        priority: index,
      })),
    });
  }

  /**
   * GitHub replaces the whole option set on PATCH, so every existing option has
   * to be sent back with its `id` — omitting one deletes it in every repository
   * of the organization.
   */
  private async addIssueFieldOptions(
    org: string,
    field: IssueField,
    existingOptions: IssueFieldOption[],
    newNames: string[],
  ): Promise<void> {
    const total = existingOptions.length + newNames.length;
    if (total > MAX_OPTIONS_PER_FIELD) {
      throw new Error(
        `GitHub issue field "${field.name}" would hold ${total} options, exceeding the limit of ${MAX_OPTIONS_PER_FIELD}.`,
      );
    }

    const maxPriority = existingOptions.reduce((max, o) => Math.max(max, o.priority), -1);
    const url = `${this.apiUrl}/orgs/${encodeURIComponent(org)}/issue-fields/${field.id}`;

    await this.request('PATCH', url, {
      options: [
        ...existingOptions.map(o => ({
          id: o.id,
          name: o.name,
          description: o.description,
          color: o.color,
          priority: o.priority,
        })),
        ...newNames.map((name, index) => ({
          name,
          color: OPTION_COLOR,
          priority: maxPriority + 1 + index,
        })),
      ],
    });
  }

  /**
   * Ensures the organization's issue field carries every principle as an
   * option. Named after the port contract, which predates this adapter — on
   * GitHub the vocabulary is an issue field, not a set of labels.
   */
  async ensureLabels(installation: Installation, labelNames: string[]): Promise<void> {
    const org = this.org(installation);
    const field = await this.findIssueField(org);

    if (!field) {
      // Nothing to put in the field yet, so there is no field to create either.
      if (labelNames.length === 0) return;

      await this.createIssueField(org, labelNames);
      return;
    }

    if (field.data_type !== 'multi_select') {
      throw new Error(
        `GitHub issue field "${field.name}" in organization "${org}" has data_type "${field.data_type}", but "multi_select" is required to hold several principles per issue.`,
      );
    }

    const existingOptions = field.options ?? [];
    const existingNames = new Set(existingOptions.map(o => o.name));
    const missing = labelNames.filter(name => !existingNames.has(name));

    if (missing.length === 0) return;

    await this.addIssueFieldOptions(org, field, existingOptions, missing);
  }

  async findWorkItemsByLabel(installation: Installation, label: string): Promise<string[]> {
    // The repository issue list cannot filter by field value, so this goes
    // through the search API (30 requests/minute, index is eventually
    // consistent — a value set seconds ago may not be found yet).
    const query = [
      `repo:${this.repoFullName(installation)}`,
      'is:issue',
      'state:open',
      `field."${this.fieldName}":"${label}"`,
    ].join(' ');

    const url = `${this.apiUrl}/search/issues?q=${encodeURIComponent(query)}&per_page=100`;
    const response = await this.request('GET', url);

    const result = await response.json() as {
      incomplete_results?: boolean;
      items?: { number: number }[];
    };

    if (result.incomplete_results) {
      console.warn(
        `[GitHubIssueSyncAdapter] search for "${label}" timed out server-side; result may be incomplete`,
      );
    }

    return (result.items ?? []).map(i => i.number.toString());
  }

  // ─── comments ────────────────────────────────────────────────────────────

  async addComment(installation: Installation, workItemId: string, body: string): Promise<string> {
    const url = `${this.apiUrl}/repos/${this.repoPath(installation)}/issues/${workItemId}/comments`;
    const response = await this.request('POST', url, { body });

    const data = await response.json() as { id: number };
    return data.id.toString();
  }

  /**
   * GitHub scopes issue comments to the repository rather than to the issue
   * (`/repos/:owner/:repo/issues/comments/:comment_id`), so `workItemId` is not
   * part of the URL for update/delete/exists.
   */
  private commentUrl(installation: Installation, commentId: string): string {
    return `${this.apiUrl}/repos/${this.repoPath(installation)}/issues/comments/${commentId}`;
  }

  async updateComment(
    installation: Installation,
    _workItemId: string,
    commentId: string,
    body: string,
  ): Promise<void> {
    await this.request('PATCH', this.commentUrl(installation, commentId), { body });
  }

  async deleteComment(
    installation: Installation,
    _workItemId: string,
    commentId: string,
  ): Promise<void> {
    await this.request('DELETE', this.commentUrl(installation, commentId));
  }

  async commentExists(
    installation: Installation,
    _workItemId: string,
    commentId: string,
  ): Promise<boolean> {
    const url = this.commentUrl(installation, commentId);

    const response = await fetch(url, {
      headers: this.headers(),
    });

    if (response.status === 404) return false;
    if (!response.ok) {
      throw new Error(
        `GitHub API error: GET ${url} responded with ${response.status} ${response.statusText}`,
      );
    }
    return true;
  }

  // ─── principle inheritance ───────────────────────────────────────────────

  async getPrinciples(installation: Installation, workItemId: string): Promise<string[]> {
    const url = `${this.apiUrl}/repos/${this.repoPath(installation)}/issues/${workItemId}/issue-field-values`;
    const response = await this.request('GET', url);

    const values = await response.json() as {
      issue_field_name?: string;
      multi_select_options?: { name: string }[] | null;
    }[];

    const wanted = this.fieldName.toLowerCase();
    const field = values.find(v => (v.issue_field_name ?? '').toLowerCase() === wanted);

    return (field?.multi_select_options ?? []).map(o => o.name);
  }

  async addPrinciples(
    installation: Installation,
    workItemId: string,
    principleNames: string[],
  ): Promise<void> {
    if (principleNames.length === 0) return;

    const field = await this.findIssueField(this.org(installation));
    if (!field) {
      throw new Error(
        `GitHub issue field "${this.fieldName}" does not exist in organization "${this.org(installation)}" — run ensureLabels first.`,
      );
    }

    // The docs describe POST as "add without replacing" but leave open whether
    // that unions a multi_select field or overwrites its value. Sending the
    // full target set is correct under either reading.
    const existing = await this.getPrinciples(installation, workItemId);
    const target = [...existing, ...principleNames.filter(name => !existing.includes(name))];

    const url = `${this.apiUrl}/repos/${this.repoPath(installation)}/issues/${workItemId}/issue-field-values`;
    await this.request('POST', url, {
      issue_field_values: [{ field_id: field.id, value: target }],
    });
  }

  async findChildWorkItems(installation: Installation, workItemId: string): Promise<string[]> {
    const url = `${this.apiUrl}/repos/${this.repoPath(installation)}/issues/${workItemId}/sub_issues?per_page=100`;
    const response = await this.request('GET', url);

    const subIssues = await response.json() as { number: number }[];

    if (subIssues.length === PER_PAGE_MAX) {
      console.warn(
        `[GitHubIssueSyncAdapter] #${workItemId} has at least ${PER_PAGE_MAX} sub-issues; only the first page is followed`,
      );
    }

    return subIssues.map(i => i.number.toString());
  }
}
