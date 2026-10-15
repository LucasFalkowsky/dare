import { Inject, Injectable } from '@nestjs/common';
import { ITeamNotificationPort } from '../../../domain/ports/outbound/ITeamNotificationPort';
import { Installation } from '../../../domain/model/Installation';
import { GITLAB_API_URL, GITLAB_ACCESS_TOKEN } from './gitlab.config';

@Injectable()
export class GitLabNotificationAdapter implements ITeamNotificationPort {
  constructor(
    @Inject(GITLAB_API_URL) private readonly apiUrl: string,
    @Inject(GITLAB_ACCESS_TOKEN) private readonly accessToken: string,
  ) {}

  async pinReminder(installation: Installation, workItemId: string, message: string): Promise<void> {
    const projectPath = encodeURIComponent(`${installation.owner}/${installation.repo}`);
    const url = `${this.apiUrl}/api/v4/projects/${projectPath}/issues/${workItemId}/notes`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': this.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body: message }),
    });

    if (!response.ok) {
      throw new Error(
        `GitLab API error: POST ${url} responded with ${response.status} ${response.statusText}`,
      );
    }
  }

  async persistFrameworkSetup(installation: Installation, identifier: string, content: string): Promise<void> {
    const projectPath = encodeURIComponent(`${installation.owner}/${installation.repo}`);
    const encodedPath = encodeURIComponent(identifier);
    const url = `${this.apiUrl}/api/v4/projects/${projectPath}/repository/files/${encodedPath}`;

    const defaultBranch = await this.getDefaultBranch(projectPath);
    const exists = await this.frameworkSetupExists(installation, identifier);
    const method = exists ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'PRIVATE-TOKEN': this.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branch: defaultBranch,
        content,
        commit_message: exists
          ? `Update ${identifier}`
          : `Create ${identifier}`,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `GitLab API error: ${method} ${url} responded with ${response.status} ${response.statusText}`,
      );
    }
  }

  async frameworkSetupExists(installation: Installation, identifier: string): Promise<boolean> {
    const projectPath = encodeURIComponent(`${installation.owner}/${installation.repo}`);
    const encodedPath = encodeURIComponent(identifier);
    const defaultBranch = await this.getDefaultBranch(projectPath);
    const url = `${this.apiUrl}/api/v4/projects/${projectPath}/repository/files/${encodedPath}?ref=${defaultBranch}`;

    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'PRIVATE-TOKEN': this.accessToken,
      },
    });

    if (response.status === 200) return true;
    if (response.status === 404) return false;

    throw new Error(
      `GitLab API error: HEAD ${url} responded with ${response.status} ${response.statusText}`,
    );
  }

  private async getDefaultBranch(projectPath: string): Promise<string> {
    const url = `${this.apiUrl}/api/v4/projects/${projectPath}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'PRIVATE-TOKEN': this.accessToken,
      },
    });

    if (!response.ok) {
      throw new Error(
        `GitLab API error: GET ${url} responded with ${response.status} ${response.statusText}`,
      );
    }

    const project = await response.json() as { default_branch: string };
    return project.default_branch;
  }
}
