import { GitHubIssueSyncAdapter } from './GitHubIssueSyncAdapter';
import { createTestInstallation } from '../../../test/helpers';

const API_URL = 'https://api.github.test';
const TOKEN = 'test-token';
const FIELD_NAME = 'Principles';

function createAdapter(fieldName: string = FIELD_NAME): GitHubIssueSyncAdapter {
  return new GitHubIssueSyncAdapter(API_URL, TOKEN, fieldName);
}

function githubInstallation() {
  return createTestInstallation({ platform: 'github', owner: 'my-org', repo: 'my-repo' });
}

function option(id: number, name: string, priority: number) {
  return { id, name, description: null, color: 'blue', priority };
}

function issueFieldListResponse(fields: unknown[]): Response {
  return new Response(JSON.stringify(fields), { status: 200 });
}

function principleField(options: ReturnType<typeof option>[], dataType = 'multi_select') {
  return { id: 7, name: FIELD_NAME, data_type: dataType, options };
}

function searchResponse(numbers: number[], incomplete = false): Response {
  return new Response(
    JSON.stringify({
      total_count: numbers.length,
      incomplete_results: incomplete,
      items: numbers.map(number => ({ number })),
    }),
    { status: 200 },
  );
}

/** The decoded `q` of the search request recorded at `callIndex`. */
function searchQuery(callIndex = 0): string {
  const url: string = (fetch as jest.Mock).mock.calls[callIndex][0];
  return new URL(url).searchParams.get('q') ?? '';
}

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── platform property ───────────────────────────────────────────────────

describe('GitHubIssueSyncAdapter - platform', () => {
  it('Given a new adapter instance, When platform is read, Then it equals "github"', () => {
    expect(createAdapter().platform).toBe('github');
  });
});

// ─── repository path resolution ──────────────────────────────────────────

describe('GitHubIssueSyncAdapter - repository path', () => {
  it('Given an installation with owner and repo, When a repository request is made, Then owner and repo are separate path segments', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 }), { status: 201 }));
    const adapter = createAdapter();

    await adapter.addComment(githubInstallation(), '42', 'body');

    const url: string = (fetch as jest.Mock).mock.calls[0][0];
    expect(url).toContain('/repos/my-org/my-repo/issues/42/comments');
    expect(url).not.toContain('my-org%2Fmy-repo');
  });

  it('Given an installation without owner whose repo holds "owner/repo", When a repository request is made, Then the full path is used unchanged', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 }), { status: 201 }));
    const adapter = createAdapter();

    await adapter.addComment(
      createTestInstallation({ platform: 'github', owner: '', repo: 'env-org/env-repo' }),
      '42',
      'body',
    );

    const url: string = (fetch as jest.Mock).mock.calls[0][0];
    expect(url).toContain('/repos/env-org/env-repo/issues/42/comments');
  });

  it('Given an owner containing a character that needs escaping, When a repository request is made, Then the segment is URL encoded', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 }), { status: 201 }));
    const adapter = createAdapter();

    await adapter.addComment(
      createTestInstallation({ platform: 'github', owner: 'my org', repo: 'my-repo' }),
      '42',
      'body',
    );

    const url: string = (fetch as jest.Mock).mock.calls[0][0];
    expect(url).toContain('/repos/my%20org/my-repo/issues/42/comments');
  });
});

// ─── ensureLabels: creating the issue field ──────────────────────────────

describe('GitHubIssueSyncAdapter - ensureLabels (field does not exist yet)', () => {
  it('Given the organization has no matching issue field, When ensureLabels is called, Then a multi_select field is created with the principles as options', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(issueFieldListResponse([]))
      .mockResolvedValueOnce(new Response(JSON.stringify(principleField([])), { status: 200 }));
    const adapter = createAdapter();

    await adapter.ensureLabels(githubInstallation(), ['Autonomy', 'Privacy']);

    expect(fetch).toHaveBeenCalledTimes(2);
    const [url, init] = (fetch as jest.Mock).mock.calls[1];
    expect(url).toBe(`${API_URL}/orgs/my-org/issue-fields`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toMatchObject({
      name: FIELD_NAME,
      data_type: 'multi_select',
      visibility: 'all',
      options: [
        { name: 'Autonomy', color: 'blue', priority: 0 },
        { name: 'Privacy', color: 'blue', priority: 1 },
      ],
    });
  });

  it('Given no field exists and an empty principle list is passed, When ensureLabels is called, Then no field is created', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(issueFieldListResponse([]));
    const adapter = createAdapter();

    await adapter.ensureLabels(githubInstallation(), []);

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('Given the organization has unrelated issue fields only, When ensureLabels is called, Then the principle field is still created', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(issueFieldListResponse([
        { id: 1, name: 'Priority', data_type: 'single_select', options: [] },
      ]))
      .mockResolvedValueOnce(new Response(JSON.stringify(principleField([])), { status: 200 }));
    const adapter = createAdapter();

    await adapter.ensureLabels(githubInstallation(), ['Autonomy']);

    expect((fetch as jest.Mock).mock.calls[1][1].method).toBe('POST');
  });

  it('Given the POST creating the field fails with 403, When ensureLabels is called, Then a GitHub API error is thrown', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(issueFieldListResponse([]))
      .mockResolvedValueOnce(new Response(null, { status: 403, statusText: 'Forbidden' }));
    const adapter = createAdapter();

    await expect(adapter.ensureLabels(githubInstallation(), ['Autonomy']))
      .rejects.toThrow('GitHub API error');
  });

  it('Given the GET listing organization issue fields fails with 401, When ensureLabels is called, Then a GitHub API error is thrown and nothing is created', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(null, { status: 401, statusText: 'Unauthorized' }));
    const adapter = createAdapter();

    await expect(adapter.ensureLabels(githubInstallation(), ['Autonomy']))
      .rejects.toThrow('GitHub API error');

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('Given a request is made, When ensureLabels is called, Then the bearer token and GitHub API version headers are sent', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(issueFieldListResponse([]));
    const adapter = createAdapter();

    await adapter.ensureLabels(githubInstallation(), []);

    expect((fetch as jest.Mock).mock.calls[0][1].headers).toMatchObject({
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    });
  });
});

// ─── ensureLabels: extending an existing issue field ─────────────────────

describe('GitHubIssueSyncAdapter - ensureLabels (field already exists)', () => {
  it('Given the field already holds every principle, When ensureLabels is called, Then no PATCH is made', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(issueFieldListResponse([
      principleField([option(1, 'Autonomy', 0), option(2, 'Privacy', 1)]),
    ]));
    const adapter = createAdapter();

    await adapter.ensureLabels(githubInstallation(), ['Autonomy', 'Privacy']);

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('Given one principle is missing, When ensureLabels is called, Then a PATCH resends the existing options with their ids and appends the missing one', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(issueFieldListResponse([principleField([option(1, 'Autonomy', 0)])]))
      .mockResolvedValueOnce(new Response(JSON.stringify(principleField([])), { status: 200 }));
    const adapter = createAdapter();

    await adapter.ensureLabels(githubInstallation(), ['Autonomy', 'Privacy']);

    const [url, init] = (fetch as jest.Mock).mock.calls[1];
    expect(url).toBe(`${API_URL}/orgs/my-org/issue-fields/7`);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body).options).toEqual([
      { id: 1, name: 'Autonomy', description: null, color: 'blue', priority: 0 },
      { name: 'Privacy', color: 'blue', priority: 1 },
    ]);
  });

  it('Given existing options with non-contiguous priorities, When a principle is added, Then its priority continues after the highest existing one', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(issueFieldListResponse([
        principleField([option(1, 'Autonomy', 3), option(2, 'Privacy', 9)]),
      ]))
      .mockResolvedValueOnce(new Response(JSON.stringify(principleField([])), { status: 200 }));
    const adapter = createAdapter();

    await adapter.ensureLabels(githubInstallation(), ['Justice']);

    const options = JSON.parse((fetch as jest.Mock).mock.calls[1][1].body).options;
    expect(options[options.length - 1]).toEqual({ name: 'Justice', color: 'blue', priority: 10 });
  });

  it('Given two principles are missing, When ensureLabels is called, Then both are appended in a single PATCH', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(issueFieldListResponse([principleField([option(1, 'Autonomy', 0)])]))
      .mockResolvedValueOnce(new Response(JSON.stringify(principleField([])), { status: 200 }));
    const adapter = createAdapter();

    await adapter.ensureLabels(githubInstallation(), ['Privacy', 'Justice']);

    expect(fetch).toHaveBeenCalledTimes(2);
    const options = JSON.parse((fetch as jest.Mock).mock.calls[1][1].body).options;
    expect(options.map((o: { name: string }) => o.name)).toEqual(['Autonomy', 'Privacy', 'Justice']);
  });

  it('Given the field is reported with a null option list, When a principle is added, Then the PATCH contains only the new option', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(issueFieldListResponse([
        { id: 7, name: FIELD_NAME, data_type: 'multi_select', options: null },
      ]))
      .mockResolvedValueOnce(new Response(JSON.stringify(principleField([])), { status: 200 }));
    const adapter = createAdapter();

    await adapter.ensureLabels(githubInstallation(), ['Autonomy']);

    expect(JSON.parse((fetch as jest.Mock).mock.calls[1][1].body).options).toEqual([
      { name: 'Autonomy', color: 'blue', priority: 0 },
    ]);
  });

  it('Given the field name differs only in casing, When ensureLabels is called, Then the existing field is reused instead of creating a second one', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(issueFieldListResponse([
      { id: 7, name: 'principles', data_type: 'multi_select', options: [option(1, 'Autonomy', 0)] },
    ]));
    const adapter = createAdapter();

    await adapter.ensureLabels(githubInstallation(), ['Autonomy']);

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('Given a field of that name exists but is not multi_select, When ensureLabels is called, Then a descriptive error is thrown and nothing is written', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(issueFieldListResponse([
      principleField([option(1, 'Autonomy', 0)], 'single_select'),
    ]));
    const adapter = createAdapter();

    await expect(adapter.ensureLabels(githubInstallation(), ['Privacy']))
      .rejects.toThrow('multi_select');

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('Given the field already holds 100 options, When another principle is added, Then the option limit error is thrown and no PATCH is made', async () => {
    const full = Array.from({ length: 100 }, (_, i) => option(i + 1, `P${i}`, i));
    (fetch as jest.Mock).mockResolvedValueOnce(issueFieldListResponse([principleField(full)]));
    const adapter = createAdapter();

    await expect(adapter.ensureLabels(githubInstallation(), ['OneTooMany']))
      .rejects.toThrow('exceeding the limit of 100');

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('Given the PATCH adding an option fails with 422, When ensureLabels is called, Then a GitHub API error is thrown', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(issueFieldListResponse([principleField([option(1, 'Autonomy', 0)])]))
      .mockResolvedValueOnce(new Response(null, { status: 422, statusText: 'Unprocessable Entity' }));
    const adapter = createAdapter();

    await expect(adapter.ensureLabels(githubInstallation(), ['Privacy']))
      .rejects.toThrow('GitHub API error');
  });

  it('Given a configured field name other than the default, When ensureLabels is called, Then that name is used to look the field up and to create it', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(issueFieldListResponse([principleField([option(1, 'Autonomy', 0)])]))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    const adapter = createAdapter('DARE Grundsätze');

    await adapter.ensureLabels(githubInstallation(), ['Autonomy']);

    // The existing 'Principles' field must not match, so a new field is created.
    expect(JSON.parse((fetch as jest.Mock).mock.calls[1][1].body)).toMatchObject({
      name: 'DARE Grundsätze',
      data_type: 'multi_select',
    });
  });
});

// ─── ensureLabels: organization resolution ───────────────────────────────

describe('GitHubIssueSyncAdapter - ensureLabels (organization resolution)', () => {
  it('Given an installation without owner whose repo holds "org/repo", When ensureLabels is called, Then the first segment is used as the organization', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(issueFieldListResponse([]));
    const adapter = createAdapter();

    await adapter.ensureLabels(
      createTestInstallation({ platform: 'github', owner: '', repo: 'env-org/env-repo' }),
      [],
    );

    expect((fetch as jest.Mock).mock.calls[0][0]).toBe(`${API_URL}/orgs/env-org/issue-fields`);
  });

  it('Given an installation that resolves to no owner at all, When ensureLabels is called, Then a descriptive error is thrown and no request is made', async () => {
    const adapter = createAdapter();

    await expect(adapter.ensureLabels(
      createTestInstallation({ platform: 'github', owner: '', repo: '' }),
      ['Autonomy'],
    )).rejects.toThrow('require an organization');

    expect(fetch).not.toHaveBeenCalled();
  });
});

// ─── findWorkItemsByLabel ────────────────────────────────────────────────

describe('GitHubIssueSyncAdapter - findWorkItemsByLabel', () => {
  it('Given a principle, When findWorkItemsByLabel is called, Then the search query scopes to the repository, open issues and the field value', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(searchResponse([]));
    const adapter = createAdapter();

    await adapter.findWorkItemsByLabel(githubInstallation(), 'Autonomy');

    expect((fetch as jest.Mock).mock.calls[0][0]).toContain(`${API_URL}/search/issues?q=`);
    expect(searchQuery()).toBe('repo:my-org/my-repo is:issue state:open field."Principles":"Autonomy"');
  });

  it('Given matching open issues, When findWorkItemsByLabel is called, Then their issue numbers are returned as strings', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(searchResponse([1, 17]));
    const adapter = createAdapter();

    const ids = await adapter.findWorkItemsByLabel(githubInstallation(), 'Autonomy');

    expect(ids).toEqual(['1', '17']);
  });

  it('Given a principle name containing spaces, When findWorkItemsByLabel is called, Then it is quoted inside the field qualifier', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(searchResponse([]));
    const adapter = createAdapter();

    await adapter.findWorkItemsByLabel(githubInstallation(), 'Human Oversight');

    expect(searchQuery()).toContain('field."Principles":"Human Oversight"');
  });

  it('Given a configured field name with a space, When findWorkItemsByLabel is called, Then the field name is quoted in the query', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(searchResponse([]));
    const adapter = createAdapter('DARE Principles');

    await adapter.findWorkItemsByLabel(githubInstallation(), 'Autonomy');

    expect(searchQuery()).toContain('field."DARE Principles":"Autonomy"');
  });

  it('Given no issue carries the principle, When findWorkItemsByLabel is called, Then an empty list is returned', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(searchResponse([]));
    const adapter = createAdapter();

    await expect(adapter.findWorkItemsByLabel(githubInstallation(), 'Autonomy')).resolves.toEqual([]);
  });

  it('Given a response without an items array, When findWorkItemsByLabel is called, Then an empty list is returned', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    const adapter = createAdapter();

    await expect(adapter.findWorkItemsByLabel(githubInstallation(), 'Autonomy')).resolves.toEqual([]);
  });

  it('Given the search timed out server-side, When findWorkItemsByLabel is called, Then the partial result is returned and a warning is logged', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (fetch as jest.Mock).mockResolvedValueOnce(searchResponse([3], true));
    const adapter = createAdapter();

    const ids = await adapter.findWorkItemsByLabel(githubInstallation(), 'Autonomy');

    expect(ids).toEqual(['3']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('incomplete'));
  });

  it('Given the search API answers 403 (rate limit exceeded), When findWorkItemsByLabel is called, Then a GitHub API error is thrown', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(null, { status: 403, statusText: 'Forbidden' }),
    );
    const adapter = createAdapter();

    await expect(adapter.findWorkItemsByLabel(githubInstallation(), 'Autonomy'))
      .rejects.toThrow('GitHub API error');
  });

  it('Given the search API answers 422 (unsupported qualifier), When findWorkItemsByLabel is called, Then a GitHub API error is thrown', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(null, { status: 422, statusText: 'Unprocessable Entity' }),
    );
    const adapter = createAdapter();

    await expect(adapter.findWorkItemsByLabel(githubInstallation(), 'Autonomy'))
      .rejects.toThrow('GitHub API error');
  });
});

// ─── addComment ─────────────────────────────────────────────────────────

describe('GitHubIssueSyncAdapter - addComment', () => {
  it('Given a valid installation, work item ID, and body, When addComment is called, Then a POST is made to the comments endpoint with the correct body', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 99 }), { status: 201 }),
    );
    const adapter = createAdapter();

    await adapter.addComment(githubInstallation(), '42', 'DARE principle reminder');

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/repos/my-org/my-repo/issues/42/comments`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ body: 'DARE principle reminder' }),
      }),
    );
  });

  it('Given a successful POST, When addComment is called, Then the returned commentId matches the comment ID from the GitHub response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 12345 }), { status: 201 }),
    );
    const adapter = createAdapter();

    await expect(adapter.addComment(githubInstallation(), '42', 'body')).resolves.toBe('12345');
  });

  it('Given a 403 response from GitHub, When addComment is called, Then a GitHub API error is thrown', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(null, { status: 403, statusText: 'Forbidden' }),
    );
    const adapter = createAdapter();

    await expect(adapter.addComment(githubInstallation(), '42', 'msg'))
      .rejects.toThrow('GitHub API error');
  });

  it('Given a 500 server error, When addComment is called, Then a GitHub API error is thrown', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(null, { status: 500, statusText: 'Internal Server Error' }),
    );
    const adapter = createAdapter();

    await expect(adapter.addComment(githubInstallation(), '7', 'msg'))
      .rejects.toThrow('GitHub API error');
  });
});

// ─── updateComment ───────────────────────────────────────────────────

describe('GitHubIssueSyncAdapter - updateComment', () => {
  it('Given a valid installation, comment ID, and body, When updateComment is called, Then a PATCH is made to the repository-scoped comment endpoint', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(null, { status: 200 }));
    const adapter = createAdapter();

    await adapter.updateComment(githubInstallation(), '42', '7', 'Updated principle content');

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/repos/my-org/my-repo/issues/comments/7`,
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ body: 'Updated principle content' }),
      }),
    );
  });

  it('Given a work item ID is passed, When updateComment is called, Then the issue number is not part of the comment URL', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(null, { status: 200 }));
    const adapter = createAdapter();

    await adapter.updateComment(githubInstallation(), '42', '7', 'body');

    expect((fetch as jest.Mock).mock.calls[0][0]).not.toContain('/issues/42');
  });

  it('Given a 403 response, When updateComment is called, Then a GitHub API error is thrown', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(null, { status: 403, statusText: 'Forbidden' }),
    );
    const adapter = createAdapter();

    await expect(adapter.updateComment(githubInstallation(), '42', '7', 'body'))
      .rejects.toThrow('GitHub API error');
  });

  it('Given a 404 response (comment was deleted), When updateComment is called, Then a GitHub API error is thrown', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(null, { status: 404, statusText: 'Not Found' }),
    );
    const adapter = createAdapter();

    await expect(adapter.updateComment(githubInstallation(), '42', 'deleted', 'body'))
      .rejects.toThrow('GitHub API error');
  });
});

// ─── deleteComment ───────────────────────────────────────────────────

describe('GitHubIssueSyncAdapter - deleteComment', () => {
  it('Given a valid installation and comment ID, When deleteComment is called, Then a DELETE is made to the repository-scoped comment endpoint', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(null, { status: 204 }));
    const adapter = createAdapter();

    await adapter.deleteComment(githubInstallation(), '42', '7');

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/repos/my-org/my-repo/issues/comments/7`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('Given a 403 response, When deleteComment is called, Then a GitHub API error is thrown', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(null, { status: 403, statusText: 'Forbidden' }),
    );
    const adapter = createAdapter();

    await expect(adapter.deleteComment(githubInstallation(), '42', '7'))
      .rejects.toThrow('GitHub API error');
  });
});

// ─── commentExists ───────────────────────────────────────────────────

describe('GitHubIssueSyncAdapter - commentExists', () => {
  it('Given GitHub returns 200 for the comment, When commentExists is called, Then true is returned', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 7 }), { status: 200 }),
    );
    const adapter = createAdapter();

    await expect(adapter.commentExists(githubInstallation(), '42', '7')).resolves.toBe(true);
  });

  it('Given GitHub returns 404 for the comment, When commentExists is called, Then false is returned', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(null, { status: 404, statusText: 'Not Found' }),
    );
    const adapter = createAdapter();

    await expect(adapter.commentExists(githubInstallation(), '42', '7')).resolves.toBe(false);
  });

  it('Given GitHub returns 500, When commentExists is called, Then a GitHub API error is thrown', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(null, { status: 500, statusText: 'Internal Server Error' }),
    );
    const adapter = createAdapter();

    await expect(adapter.commentExists(githubInstallation(), '42', '7'))
      .rejects.toThrow('GitHub API error');
  });
});

// ─── getPrinciples ───────────────────────────────────────────────────────

function fieldValuesResponse(entries: unknown[]): Response {
  return new Response(JSON.stringify(entries), { status: 200 });
}

describe('GitHubIssueSyncAdapter - getPrinciples', () => {
  it('Given the issue carries the principle field, When getPrinciples is called, Then the multi-select option names are returned', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(fieldValuesResponse([
      {
        issue_field_name: FIELD_NAME,
        data_type: 'multi_select',
        multi_select_options: [{ name: 'Autonomy' }, { name: 'Privacy' }],
      },
    ]));
    const adapter = createAdapter();

    const names = await adapter.getPrinciples(githubInstallation(), '42');

    expect(names).toEqual(['Autonomy', 'Privacy']);
    expect((fetch as jest.Mock).mock.calls[0][0]).toBe(
      `${API_URL}/repos/my-org/my-repo/issues/42/issue-field-values`,
    );
  });

  it('Given the issue carries other fields too, When getPrinciples is called, Then only the principle field is read', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(fieldValuesResponse([
      { issue_field_name: 'Priority', data_type: 'single_select', multi_select_options: null },
      { issue_field_name: FIELD_NAME, data_type: 'multi_select', multi_select_options: [{ name: 'Justice' }] },
    ]));
    const adapter = createAdapter();

    await expect(adapter.getPrinciples(githubInstallation(), '42')).resolves.toEqual(['Justice']);
  });

  it('Given the field name differs only in casing, When getPrinciples is called, Then it is still matched', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(fieldValuesResponse([
      { issue_field_name: 'principles', multi_select_options: [{ name: 'Autonomy' }] },
    ]));
    const adapter = createAdapter();

    await expect(adapter.getPrinciples(githubInstallation(), '42')).resolves.toEqual(['Autonomy']);
  });

  it('Given the issue has no value for the principle field, When getPrinciples is called, Then an empty list is returned', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(fieldValuesResponse([
      { issue_field_name: 'Priority', multi_select_options: null },
    ]));
    const adapter = createAdapter();

    await expect(adapter.getPrinciples(githubInstallation(), '42')).resolves.toEqual([]);
  });

  it('Given the principle field is present but empty, When getPrinciples is called, Then an empty list is returned', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(fieldValuesResponse([
      { issue_field_name: FIELD_NAME, multi_select_options: null },
    ]));
    const adapter = createAdapter();

    await expect(adapter.getPrinciples(githubInstallation(), '42')).resolves.toEqual([]);
  });

  it('Given GitHub answers 404, When getPrinciples is called, Then a GitHub API error is thrown', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(null, { status: 404, statusText: 'Not Found' }),
    );
    const adapter = createAdapter();

    await expect(adapter.getPrinciples(githubInstallation(), '42'))
      .rejects.toThrow('GitHub API error');
  });
});

// ─── addPrinciples ───────────────────────────────────────────────────────

describe('GitHubIssueSyncAdapter - addPrinciples', () => {
  it('Given principles to add, When addPrinciples is called, Then the full target set is posted with the resolved field id', async () => {
    (fetch as jest.Mock)
      // resolve the org field
      .mockResolvedValueOnce(issueFieldListResponse([principleField([option(1, 'Autonomy', 0)])]))
      // current values on the issue
      .mockResolvedValueOnce(fieldValuesResponse([
        { issue_field_name: FIELD_NAME, multi_select_options: [{ name: 'Autonomy' }] },
      ]))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
    const adapter = createAdapter();

    await adapter.addPrinciples(githubInstallation(), '42', ['Privacy']);

    const [url, init] = (fetch as jest.Mock).mock.calls[2];
    expect(url).toBe(`${API_URL}/repos/my-org/my-repo/issues/42/issue-field-values`);
    expect(init.method).toBe('POST');
    // Existing ∪ new, not just the new one.
    expect(JSON.parse(init.body)).toEqual({
      issue_field_values: [{ field_id: 7, value: ['Autonomy', 'Privacy'] }],
    });
  });

  it('Given a principle the issue already carries, When addPrinciples is called, Then it is not duplicated', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(issueFieldListResponse([principleField([option(1, 'Autonomy', 0)])]))
      .mockResolvedValueOnce(fieldValuesResponse([
        { issue_field_name: FIELD_NAME, multi_select_options: [{ name: 'Autonomy' }] },
      ]))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
    const adapter = createAdapter();

    await adapter.addPrinciples(githubInstallation(), '42', ['Autonomy']);

    expect(JSON.parse((fetch as jest.Mock).mock.calls[2][1].body).issue_field_values[0].value)
      .toEqual(['Autonomy']);
  });

  it('Given an empty principle list, When addPrinciples is called, Then no request is made at all', async () => {
    const adapter = createAdapter();

    await adapter.addPrinciples(githubInstallation(), '42', []);

    expect(fetch).not.toHaveBeenCalled();
  });

  it('Given the organization has no principle field yet, When addPrinciples is called, Then a descriptive error is thrown', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(issueFieldListResponse([]));
    const adapter = createAdapter();

    await expect(adapter.addPrinciples(githubInstallation(), '42', ['Autonomy']))
      .rejects.toThrow('does not exist in organization');
  });

  it('Given the POST fails with 403, When addPrinciples is called, Then a GitHub API error is thrown', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(issueFieldListResponse([principleField([option(1, 'Autonomy', 0)])]))
      .mockResolvedValueOnce(fieldValuesResponse([]))
      .mockResolvedValueOnce(new Response(null, { status: 403, statusText: 'Forbidden' }));
    const adapter = createAdapter();

    await expect(adapter.addPrinciples(githubInstallation(), '42', ['Autonomy']))
      .rejects.toThrow('GitHub API error');
  });
});

// ─── findChildWorkItems ──────────────────────────────────────────────────

describe('GitHubIssueSyncAdapter - findChildWorkItems', () => {
  it('Given the issue has sub-issues, When findChildWorkItems is called, Then their numbers are returned as strings', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify([{ number: 7 }, { number: 9 }]), { status: 200 }),
    );
    const adapter = createAdapter();

    const children = await adapter.findChildWorkItems(githubInstallation(), '42');

    expect(children).toEqual(['7', '9']);
    expect((fetch as jest.Mock).mock.calls[0][0]).toBe(
      `${API_URL}/repos/my-org/my-repo/issues/42/sub_issues?per_page=100`,
    );
  });

  it('Given the issue has no sub-issues, When findChildWorkItems is called, Then an empty list is returned', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
    const adapter = createAdapter();

    await expect(adapter.findChildWorkItems(githubInstallation(), '42')).resolves.toEqual([]);
  });

  it('Given a full page of sub-issues, When findChildWorkItems is called, Then the possible truncation is logged', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const page = Array.from({ length: 100 }, (_, i) => ({ number: i + 1 }));
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(JSON.stringify(page), { status: 200 }));
    const adapter = createAdapter();

    const children = await adapter.findChildWorkItems(githubInstallation(), '42');

    expect(children).toHaveLength(100);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('only the first page'));
  });

  it('Given GitHub answers 404, When findChildWorkItems is called, Then a GitHub API error is thrown', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(null, { status: 404, statusText: 'Not Found' }),
    );
    const adapter = createAdapter();

    await expect(adapter.findChildWorkItems(githubInstallation(), '42'))
      .rejects.toThrow('GitHub API error');
  });
});

// ─── inheritance capability ──────────────────────────────────────────────

describe('GitHubIssueSyncAdapter - inheritance capability', () => {
  it('Given a new adapter instance, When supported is read, Then inheritance is reported as available', () => {
    expect(createAdapter().supported).toBe(true);
  });
});
