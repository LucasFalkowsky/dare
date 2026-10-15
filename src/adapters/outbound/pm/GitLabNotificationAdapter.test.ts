import { GitLabNotificationAdapter } from './GitLabNotificationAdapter';
import { createTestInstallation } from '../../../test/helpers';

const API_URL = 'https://gitlab.example.com';
const TOKEN = 'test-token';
const DEFAULT_BRANCH = 'develop';

function createAdapter(): GitLabNotificationAdapter {
  return new GitLabNotificationAdapter(API_URL, TOKEN);
}

function gitlabInstallation() {
  return createTestInstallation({ platform: 'gitlab', owner: 'my-group', repo: 'my-project' });
}

function mockProjectResponse(branch = DEFAULT_BRANCH): Response {
  return new Response(JSON.stringify({ default_branch: branch }), { status: 200 });
}

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GitLabNotificationAdapter', () => {
  describe('pinReminder', () => {
    it('POSTs a note to the correct issue endpoint', async () => {
      const adapter = createAdapter();
      const installation = gitlabInstallation();

      await adapter.pinReminder(installation, '7', 'Please review this.');

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/v4/projects/my-group%2Fmy-project/issues/7/notes`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'PRIVATE-TOKEN': TOKEN,
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ body: 'Please review this.' }),
        }),
      );
    });

    it('throws on non-ok response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce(new Response(null, { status: 403, statusText: 'Forbidden' }));
      const adapter = createAdapter();

      await expect(adapter.pinReminder(gitlabInstallation(), '7', 'msg'))
        .rejects.toThrow('GitLab API error');
    });
  });

  describe('frameworkSetupExists', () => {
    it('returns true when HEAD responds with 200', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce(mockProjectResponse())    // GET project → default_branch
        .mockResolvedValueOnce(new Response(null, { status: 200 })); // HEAD file → exists

      const adapter = createAdapter();

      const result = await adapter.frameworkSetupExists(gitlabInstallation(), 'dare.yml');

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/v4/projects/my-group%2Fmy-project/repository/files/dare.yml?ref=${DEFAULT_BRANCH}`,
        expect.objectContaining({
          method: 'HEAD',
          headers: expect.objectContaining({ 'PRIVATE-TOKEN': TOKEN }),
        }),
      );
    });

    it('returns false when HEAD responds with 404', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce(mockProjectResponse())
        .mockResolvedValueOnce(new Response(null, { status: 404 }));

      const adapter = createAdapter();

      const result = await adapter.frameworkSetupExists(gitlabInstallation(), 'dare.yml');

      expect(result).toBe(false);
    });

    it('throws on unexpected status codes (401, 403, 500)', async () => {
      for (const status of [401, 403, 500]) {
        (fetch as jest.Mock)
          .mockResolvedValueOnce(mockProjectResponse())
          .mockResolvedValueOnce(new Response(null, { status, statusText: 'Error' }));

        const adapter = createAdapter();

        await expect(adapter.frameworkSetupExists(gitlabInstallation(), 'dare.yml'))
          .rejects.toThrow('GitLab API error');
      }
    });
  });

  describe('persistFrameworkSetup', () => {
    it('POSTs to create a new file when it does not exist', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce(mockProjectResponse())                // GET project (persistFrameworkSetup)
        .mockResolvedValueOnce(mockProjectResponse())                // GET project (frameworkSetupExists)
        .mockResolvedValueOnce(new Response(null, { status: 404 }))  // HEAD check → not found
        .mockResolvedValueOnce(new Response(null, { status: 201 })); // POST create → success

      const adapter = createAdapter();

      await adapter.persistFrameworkSetup(gitlabInstallation(), 'dare.yml', 'content: true');

      const createCall = (fetch as jest.Mock).mock.calls[3];
      expect(createCall[0]).toBe(
        `${API_URL}/api/v4/projects/my-group%2Fmy-project/repository/files/dare.yml`,
      );
      expect(createCall[1].method).toBe('POST');
      expect(JSON.parse(createCall[1].body)).toEqual({
        branch: DEFAULT_BRANCH,
        content: 'content: true',
        commit_message: 'Create dare.yml',
      });
    });

    it('PUTs to update an existing file', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce(mockProjectResponse())                // GET project (persistFrameworkSetup)
        .mockResolvedValueOnce(mockProjectResponse())                // GET project (frameworkSetupExists)
        .mockResolvedValueOnce(new Response(null, { status: 200 }))  // HEAD check → exists
        .mockResolvedValueOnce(new Response(null, { status: 200 })); // PUT update → success

      const adapter = createAdapter();

      await adapter.persistFrameworkSetup(gitlabInstallation(), 'dare.yml', 'updated');

      const updateCall = (fetch as jest.Mock).mock.calls[3];
      expect(updateCall[1].method).toBe('PUT');
      expect(JSON.parse(updateCall[1].body)).toEqual({
        branch: DEFAULT_BRANCH,
        content: 'updated',
        commit_message: 'Update dare.yml',
      });
    });

    it('uses the project default branch from the API', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce(mockProjectResponse('staging'))       // GET project → staging
        .mockResolvedValueOnce(mockProjectResponse('staging'))       // GET project (frameworkSetupExists)
        .mockResolvedValueOnce(new Response(null, { status: 404 }))  // HEAD check → not found
        .mockResolvedValueOnce(new Response(null, { status: 201 })); // POST create → success

      const adapter = createAdapter();

      await adapter.persistFrameworkSetup(gitlabInstallation(), 'dare.yml', 'content: true');

      const createCall = (fetch as jest.Mock).mock.calls[3];
      expect(JSON.parse(createCall[1].body).branch).toBe('staging');
    });

    it('throws when the file write fails', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce(mockProjectResponse())                // GET project
        .mockResolvedValueOnce(mockProjectResponse())                // GET project (frameworkSetupExists)
        .mockResolvedValueOnce(new Response(null, { status: 404 }))  // HEAD → not found
        .mockResolvedValueOnce(new Response(null, { status: 500, statusText: 'Internal Server Error' }));

      const adapter = createAdapter();

      await expect(adapter.persistFrameworkSetup(gitlabInstallation(), 'dare.yml', 'x'))
        .rejects.toThrow('GitLab API error');
    });

    it('throws when the project lookup fails', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce(new Response(null, { status: 404, statusText: 'Not Found' }));

      const adapter = createAdapter();

      await expect(adapter.persistFrameworkSetup(gitlabInstallation(), 'dare.yml', 'x'))
        .rejects.toThrow('GitLab API error');
    });
  });
});
