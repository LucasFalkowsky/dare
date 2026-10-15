import { GitLabIssueSyncAdapter } from './GitLabIssueSyncAdapter';
import { createTestInstallation } from '../../../test/helpers';

const API_URL = 'https://gitlab.example.com';
const TOKEN = 'test-token';

function createAdapter(): GitLabIssueSyncAdapter {
  return new GitLabIssueSyncAdapter(API_URL, TOKEN);
}

function gitlabInstallation() {
  return createTestInstallation({ platform: 'gitlab', owner: 'my-group', repo: 'my-project' });
}

function labelListResponse(names: string[]): Response {
  return new Response(JSON.stringify(names.map(name => ({ name }))), { status: 200 });
}

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── platform property ───────────────────────────────────────────────────

describe('GitLabIssueSyncAdapter - platform', () => {
  it('Given a new adapter instance, When platform is read, Then it equals "gitlab"', () => {
    const adapter = createAdapter();
    expect(adapter.platform).toBe('gitlab');
  });
});

// ─── ensureLabels ─────────────────────────────────────────────────────────

describe('GitLabIssueSyncAdapter - ensureLabels', () => {
  it('Given all requested labels already exist in the project, When ensureLabels is called, Then only one GET is made and no label is created', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(labelListResponse(['Autonomy', 'Privacy']));
    const adapter = createAdapter();

    await adapter.ensureLabels(gitlabInstallation(), ['Autonomy', 'Privacy']);

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('Given one label is missing, When ensureLabels is called, Then a POST is made to create exactly that label', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(labelListResponse(['Autonomy']))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 }), { status: 201 }));
    const adapter = createAdapter();

    await adapter.ensureLabels(gitlabInstallation(), ['Autonomy', 'Privacy']);

    expect(fetch).toHaveBeenCalledTimes(2);
    const createCall = (fetch as jest.Mock).mock.calls[1];
    expect(createCall[1].method).toBe('POST');
    expect(JSON.parse(createCall[1].body)).toMatchObject({ name: 'Privacy' });
  });

  it('Given three labels are all missing, When ensureLabels is called, Then three separate POST requests are made', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(labelListResponse([]))
      .mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 201 }));
    const adapter = createAdapter();

    await adapter.ensureLabels(gitlabInstallation(), ['Autonomy', 'Privacy', 'Justice']);

    expect(fetch).toHaveBeenCalledTimes(4); // 1 GET + 3 POSTs
  });

  it('Given an empty label list is passed, When ensureLabels is called, Then only the GET is made and no labels are created', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(labelListResponse([]));
    const adapter = createAdapter();

    await adapter.ensureLabels(gitlabInstallation(), []);

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('Given the GET request for existing labels fails with 401, When ensureLabels is called, Then a GitLab API error is thrown', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(null, { status: 401, statusText: 'Unauthorized' }));
    const adapter = createAdapter();

    await expect(adapter.ensureLabels(gitlabInstallation(), ['Autonomy']))
      .rejects.toThrow('GitLab API error');
  });

  it('Given the GET request fails with 403, When ensureLabels is called, Then a GitLab API error is thrown and no POST is attempted', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(null, { status: 403, statusText: 'Forbidden' }));
    const adapter = createAdapter();

    await expect(adapter.ensureLabels(gitlabInstallation(), ['Autonomy']))
      .rejects.toThrow('GitLab API error');

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('Given the POST to create a missing label fails, When ensureLabels is called, Then a GitLab API error is thrown', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(labelListResponse([]))
      .mockResolvedValueOnce(new Response(null, { status: 422, statusText: 'Unprocessable Entity' }));
    const adapter = createAdapter();

    await expect(adapter.ensureLabels(gitlabInstallation(), ['Autonomy']))
      .rejects.toThrow('GitLab API error');
  });

  it('Given a project path with slashes, When ensureLabels is called, Then the URL encodes the project path correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(labelListResponse([]));
    const adapter = createAdapter();

    await adapter.ensureLabels(gitlabInstallation(), []);

    const url: string = (fetch as jest.Mock).mock.calls[0][0];
    expect(url).toContain('my-group%2Fmy-project');
    expect(url).toContain('/labels');
  });

  it('Given a missing label, When a POST creates it, Then the label is created with the correct name and color #428BCA', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(labelListResponse([]))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 5 }), { status: 201 }));
    const adapter = createAdapter();

    await adapter.ensureLabels(gitlabInstallation(), ['NewLabel']);

    const body = JSON.parse((fetch as jest.Mock).mock.calls[1][1].body);
    expect(body).toEqual({ name: 'NewLabel', color: '#428BCA' });
  });

  it('Given a label already exists with exact casing, When ensureLabels is called, Then no POST is made for that label', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(labelListResponse(['Autonomy']));
    const adapter = createAdapter();

    await adapter.ensureLabels(gitlabInstallation(), ['Autonomy']);

    // Only GET, no POST
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('Given the request includes the PRIVATE-TOKEN header, When ensureLabels is called, Then the correct auth token is sent', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(labelListResponse([]));
    const adapter = createAdapter();

    await adapter.ensureLabels(gitlabInstallation(), []);

    expect((fetch as jest.Mock).mock.calls[0][1].headers).toMatchObject({
      'PRIVATE-TOKEN': TOKEN,
    });
  });
});

// ─── getPrinciples ────────────────────────────────────────────────────────

describe('GitLabIssueSyncAdapter - getPrinciples', () => {
  it('Given an issue carrying labels, When getPrinciples is called, Then the label names are returned from the issue endpoint', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ labels: ['Autonomy', 'bug'] }), { status: 200 }),
    );
    const adapter = createAdapter();

    const principles = await adapter.getPrinciples(gitlabInstallation(), '42');

    expect(principles).toEqual(['Autonomy', 'bug']);
    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/v4/projects/my-group%2Fmy-project/issues/42`,
      { headers: { 'PRIVATE-TOKEN': TOKEN } },
    );
  });

  it.each([
    ['labels is an empty array', { labels: [] }],
    ['labels is null', { labels: null }],
    ['the field is missing entirely', {}],
  ])('Given %s, When getPrinciples is called, Then an empty list is returned', async (_case, body) => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(JSON.stringify(body), { status: 200 }));
    const adapter = createAdapter();

    await expect(adapter.getPrinciples(gitlabInstallation(), '42')).resolves.toEqual([]);
  });

  it('Given GitLab answers with an error status, When getPrinciples is called, Then it rejects naming method and URL', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(null, { status: 404, statusText: 'Not Found' }));
    const adapter = createAdapter();

    await expect(adapter.getPrinciples(gitlabInstallation(), '7')).rejects.toThrow(
      /GET .*\/issues\/7 responded with 404 Not Found/,
    );
  });
});

// ─── addComment ─────────────────────────────────────────────────────────

describe('GitLabIssueSyncAdapter - addComment', () => {
  it('Given a valid installation, work item ID, and body, When addComment is called, Then a POST is made to the notes endpoint with the correct body', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 99 }), { status: 201 }),
    );
    const adapter = createAdapter();

    await adapter.addComment(gitlabInstallation(), '42', 'DARE principle reminder');

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/v4/projects/my-group%2Fmy-project/issues/42/notes`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'PRIVATE-TOKEN': TOKEN,
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ body: 'DARE principle reminder' }),
      }),
    );
  });

  it('Given a successful POST, When addComment is called, Then the returned commentId matches the note ID from the GitLab response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 12345 }), { status: 201 }),
    );
    const adapter = createAdapter();

    const commentId = await adapter.addComment(gitlabInstallation(), '42', 'body');

    expect(commentId).toBe('12345');
  });

  it('Given a 403 response from GitLab, When addComment is called, Then a GitLab API error is thrown', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(null, { status: 403, statusText: 'Forbidden' }),
    );
    const adapter = createAdapter();

    await expect(adapter.addComment(gitlabInstallation(), '42', 'msg'))
      .rejects.toThrow('GitLab API error');
  });

  it('Given a 500 server error, When addComment is called, Then a GitLab API error is thrown', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(null, { status: 500, statusText: 'Internal Server Error' }),
    );
    const adapter = createAdapter();

    await expect(adapter.addComment(gitlabInstallation(), '7', 'msg'))
      .rejects.toThrow('GitLab API error');
  });
});

// ─── updateComment ───────────────────────────────────────────────────

describe('GitLabIssueSyncAdapter - updateComment', () => {
  it('Given a valid installation, work item ID, comment ID, and body, When updateComment is called, Then a PUT is made to the correct notes endpoint', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(null, { status: 200 }));
    const adapter = createAdapter();

    await adapter.updateComment(gitlabInstallation(), '42', 'note-7', 'Updated principle content');

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/v4/projects/my-group%2Fmy-project/issues/42/notes/note-7`,
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'PRIVATE-TOKEN': TOKEN,
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ body: 'Updated principle content' }),
      }),
    );
  });

  it('Given a 403 response, When updateComment is called, Then a GitLab API error is thrown', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(null, { status: 403, statusText: 'Forbidden' }),
    );
    const adapter = createAdapter();

    await expect(adapter.updateComment(gitlabInstallation(), '42', 'note-7', 'body'))
      .rejects.toThrow('GitLab API error');
  });

  it('Given a 404 response (comment was deleted), When updateComment is called, Then a GitLab API error is thrown', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(null, { status: 404, statusText: 'Not Found' }),
    );
    const adapter = createAdapter();

    await expect(adapter.updateComment(gitlabInstallation(), '42', 'note-deleted', 'body'))
      .rejects.toThrow('GitLab API error');
  });
});
