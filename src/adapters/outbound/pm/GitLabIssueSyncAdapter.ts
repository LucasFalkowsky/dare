import { Inject, Injectable } from '@nestjs/common';
import { IWorkItemCommentPort } from '../../../domain/ports/outbound/IWorkItemCommentPort';
import { Installation } from '../../../domain/model/Installation';
import { GITLAB_API_URL, GITLAB_ACCESS_TOKEN } from './gitlab.config';

@Injectable()
export class GitLabIssueSyncAdapter implements IWorkItemCommentPort {
  readonly platform = 'gitlab';

  constructor(
    @Inject(GITLAB_API_URL) private readonly apiUrl: string,
    @Inject(GITLAB_ACCESS_TOKEN) private readonly accessToken: string,
  ) {}

  private projectId(installation: Installation): string {
    return installation.owner
      ? encodeURIComponent(`${installation.owner}/${installation.repo}`)
      : installation.repo;
  }

  async ensureLabels(installation: Installation, labelNames: string[]): Promise<void> {
    const projectPath = this.projectId(installation);
    const listUrl = `${this.apiUrl}/api/v4/projects/${projectPath}/labels?per_page=100`;

    const listResponse = await fetch(listUrl, {
      headers: { 'PRIVATE-TOKEN': this.accessToken },
    });

    if (!listResponse.ok) {
      throw new Error(
        `GitLab API error: GET ${listUrl} responded with ${listResponse.status} ${listResponse.statusText}`,
      );
    }

    const existing = await listResponse.json() as { name: string }[];
    const existingNames = new Set(existing.map(l => l.name));

    const createUrl = `${this.apiUrl}/api/v4/projects/${projectPath}/labels`;
    for (const name of labelNames) {
      if (existingNames.has(name)) continue;

      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'PRIVATE-TOKEN': this.accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, color: '#428BCA' }),
      });

      if (!createResponse.ok) {
        throw new Error(
          `GitLab API error: POST ${createUrl} responded with ${createResponse.status} ${createResponse.statusText}`,
        );
      }
    }
  }

  /**
   * On GitLab the principle vocabulary is the issue's label list. Read from the
   * API rather than from a webhook payload, so the result is also correct when
   * the caller was triggered by something other than a label change.
   */
  async getPrinciples(installation: Installation, workItemId: string): Promise<string[]> {
    const projectPath = this.projectId(installation);
    const url = `${this.apiUrl}/api/v4/projects/${projectPath}/issues/${workItemId}`;

    const response = await fetch(url, {
      headers: { 'PRIVATE-TOKEN': this.accessToken },
    });

    if (!response.ok) {
      throw new Error(
        `GitLab API error: GET ${url} responded with ${response.status} ${response.statusText}`,
      );
    }

    const issue = await response.json() as { labels?: string[] | null };
    return issue.labels ?? [];
  }

  async addComment(installation: Installation, workItemId: string, body: string): Promise<string> {
    const projectPath = this.projectId(installation);
    const url = `${this.apiUrl}/api/v4/projects/${projectPath}/issues/${workItemId}/notes`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': this.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    });

    if (!response.ok) {
      throw new Error(
        `GitLab API error: POST ${url} responded with ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json() as { id: number };
    return data.id.toString();
  }

  async updateComment(
    installation: Installation,
    workItemId: string,
    commentId: string,
    body: string,
  ): Promise<void> {
    const projectPath = this.projectId(installation);
    const url = `${this.apiUrl}/api/v4/projects/${projectPath}/issues/${workItemId}/notes/${commentId}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'PRIVATE-TOKEN': this.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    });

    if (!response.ok) {
      throw new Error(
        `GitLab API error: PUT ${url} responded with ${response.status} ${response.statusText}`,
      );
    }
  }

  async deleteComment(
    installation: Installation,
    workItemId: string,
    commentId: string,
  ): Promise<void> {
    const projectPath = this.projectId(installation);
    const url = `${this.apiUrl}/api/v4/projects/${projectPath}/issues/${workItemId}/notes/${commentId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'PRIVATE-TOKEN': this.accessToken },
    });

    if (!response.ok) {
      throw new Error(
        `GitLab API error: DELETE ${url} responded with ${response.status} ${response.statusText}`,
      );
    }
  }

  async commentExists(
    installation: Installation,
    workItemId: string,
    commentId: string,
  ): Promise<boolean> {
    const projectPath = this.projectId(installation);
    const url = `${this.apiUrl}/api/v4/projects/${projectPath}/issues/${workItemId}/notes/${commentId}`;

    const response = await fetch(url, {
      headers: { 'PRIVATE-TOKEN': this.accessToken },
    });

    if (response.status === 404) return false;
    if (!response.ok) {
      throw new Error(
        `GitLab API error: GET ${url} responded with ${response.status} ${response.statusText}`,
      );
    }
    return true;
  }

  async findWorkItemsByLabel(installation: Installation, label: string): Promise<string[]> {
    const projectPath = this.projectId(installation);
    const url = `${this.apiUrl}/api/v4/projects/${projectPath}/issues?labels=${encodeURIComponent(label)}&state=opened&per_page=100`;

    const response = await fetch(url, {
      headers: { 'PRIVATE-TOKEN': this.accessToken },
    });

    if (!response.ok) {
      throw new Error(
        `GitLab API error: GET ${url} responded with ${response.status} ${response.statusText}`,
      );
    }

    const issues = await response.json() as { iid: number }[];
    return issues.map(i => i.iid.toString());
  }
}
