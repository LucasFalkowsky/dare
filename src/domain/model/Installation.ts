export interface Installation {
  installationId: string;
  owner: string;
  repo: string;
  platform: 'github' | 'gitlab' | 'jira';
}
