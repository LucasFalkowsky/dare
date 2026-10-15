import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createHmac } from 'crypto';
import { GitHubWebhookAdapter } from './GitHubWebhookAdapter';
import { IWorkflowEventPort } from '../../../domain/ports/inbound/IWorkflowEventPort';
import { WORKFLOW_EVENT_PORT } from '../../../domain/ports/injection-tokens';
import { GITHUB_WEBHOOK_SECRET } from '../../outbound/pm/github.config';

const SECRET = 'webhook-secret';

const REPOSITORY = {
  full_name: 'my-org/my-repo',
  name: 'my-repo',
  owner: { login: 'my-org' },
};

const issueBody = (action: string, labels: unknown[] = []) => ({
  action,
  issue: { number: 42, labels },
  repository: REPOSITORY,
});

describe('GitHubWebhookAdapter', () => {
  let app: INestApplication;
  let workflowEventPort: jest.Mocked<IWorkflowEventPort>;

  const buildApp = async (webhookSecret = '') => {
    workflowEventPort = {
      onFrameworkActivated: jest.fn().mockResolvedValue(undefined),
      onWorkItemOpened: jest.fn().mockResolvedValue(undefined),
      onSubWorkItemAttached: jest.fn().mockResolvedValue(undefined),
      onWorkItemPrinciplesChanged: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GitHubWebhookAdapter],
      providers: [
        { provide: WORKFLOW_EVENT_PORT, useValue: workflowEventPort },
        { provide: GITHUB_WEBHOOK_SECRET, useValue: webhookSecret },
      ],
    }).compile();

    app = module.createNestApplication({ rawBody: true });
    await app.init();
  };

  afterEach(async () => {
    await app.close();
  });

  const sign = (body: unknown) =>
    'sha256=' + createHmac('sha256', SECRET).update(JSON.stringify(body)).digest('hex');

  const post = (event: string, body: unknown, signature?: string) => {
    const req = request(app.getHttpServer())
      .post('/webhooks/github')
      .set('x-github-event', event)
      .set('Content-Type', 'application/json');
    if (signature !== undefined) req.set('x-hub-signature-256', signature);
    return req.send(JSON.stringify(body));
  };

  // ─── sub-issue attachment ──────────────────────────────────────────────

  describe('sub_issues events', () => {
    beforeEach(() => buildApp());

    it('calls onSubWorkItemAttached for sub_issue_added', async () => {
      const body = {
        action: 'sub_issue_added',
        parent_issue: { number: 1 },
        sub_issue: { number: 2 },
        repository: REPOSITORY,
      };

      const res = await post('sub_issues', body);

      expect(res.status).toBe(200);
      expect(workflowEventPort.onSubWorkItemAttached).toHaveBeenCalledWith(
        expect.objectContaining({ owner: 'my-org', repo: 'my-repo', platform: 'github' }),
        '1',
        '2',
      );
    });

    it('calls onSubWorkItemAttached for parent_issue_added, which describes the same new edge', async () => {
      const body = {
        action: 'parent_issue_added',
        parent_issue: { number: 7 },
        sub_issue: { number: 9 },
        repository: REPOSITORY,
      };

      await post('sub_issues', body);

      expect(workflowEventPort.onSubWorkItemAttached).toHaveBeenCalledWith(
        expect.anything(),
        '7',
        '9',
      );
    });

    it('ignores sub_issue_removed', async () => {
      const body = {
        action: 'sub_issue_removed',
        parent_issue: { number: 1 },
        sub_issue: { number: 2 },
        repository: REPOSITORY,
      };

      const res = await post('sub_issues', body);

      expect(res.status).toBe(200);
      expect(workflowEventPort.onSubWorkItemAttached).not.toHaveBeenCalled();
    });

    it('ignores a payload missing the parent issue', async () => {
      const body = { action: 'sub_issue_added', sub_issue: { number: 2 }, repository: REPOSITORY };

      const res = await post('sub_issues', body);

      expect(res.status).toBe(200);
      expect(workflowEventPort.onSubWorkItemAttached).not.toHaveBeenCalled();
    });

    it('derives the installation id from the repository full name', async () => {
      const body = {
        action: 'sub_issue_added',
        parent_issue: { number: 1 },
        sub_issue: { number: 2 },
        repository: REPOSITORY,
      };

      await post('sub_issues', body);

      expect(workflowEventPort.onSubWorkItemAttached).toHaveBeenCalledWith(
        expect.objectContaining({ installationId: 'my-org/my-repo' }),
        '1',
        '2',
      );
    });
  });

  // ─── field changes ─────────────────────────────────────────────────────

  describe('issues field events', () => {
    beforeEach(() => buildApp());

    it('calls onWorkItemPrinciplesChanged for field_added', async () => {
      const body = { action: 'field_added', issue: { number: 42 }, repository: REPOSITORY };

      const res = await post('issues', body);

      expect(res.status).toBe(200);
      expect(workflowEventPort.onWorkItemPrinciplesChanged).toHaveBeenCalledWith(
        expect.objectContaining({ platform: 'github' }),
        '42',
      );
    });

    it('calls onWorkItemPrinciplesChanged for field_removed so the snapshot stays current', async () => {
      const body = { action: 'field_removed', issue: { number: 42 }, repository: REPOSITORY };

      await post('issues', body);

      expect(workflowEventPort.onWorkItemPrinciplesChanged).toHaveBeenCalledWith(
        expect.anything(),
        '42',
      );
    });

    it('ignores other issue actions', async () => {
      const body = { action: 'assigned', issue: { number: 42 }, repository: REPOSITORY };

      const res = await post('issues', body);

      expect(res.status).toBe(200);
      expect(workflowEventPort.onWorkItemPrinciplesChanged).not.toHaveBeenCalled();
    });

    it('ignores a payload without an issue number', async () => {
      const body = { action: 'field_added', repository: REPOSITORY };

      const res = await post('issues', body);

      expect(res.status).toBe(200);
      expect(workflowEventPort.onWorkItemPrinciplesChanged).not.toHaveBeenCalled();
    });
  });

  // ─── unrelated events ──────────────────────────────────────────────────

  describe('unrelated events', () => {
    beforeEach(() => buildApp());

    it('acknowledges an unknown event without dispatching anything', async () => {
      const res = await post('push', { repository: REPOSITORY });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
      expect(workflowEventPort.onSubWorkItemAttached).not.toHaveBeenCalled();
      expect(workflowEventPort.onWorkItemPrinciplesChanged).not.toHaveBeenCalled();
    });

    it('answers 200 even when a handler rejects, so GitHub does not retry', async () => {
      workflowEventPort.onWorkItemPrinciplesChanged.mockRejectedValue(new Error('boom'));
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const res = await post('issues', {
        action: 'field_added',
        issue: { number: 42 },
        repository: REPOSITORY,
      });

      expect(res.status).toBe(200);
    });
  });

  // ─── signature verification ────────────────────────────────────────────

  describe('signature verification', () => {
    it('accepts a request with a valid signature', async () => {
      await buildApp(SECRET);
      const body = {
        action: 'sub_issue_added',
        parent_issue: { number: 1 },
        sub_issue: { number: 2 },
        repository: REPOSITORY,
      };

      const res = await post('sub_issues', body, sign(body));

      expect(res.status).toBe(200);
      expect(workflowEventPort.onSubWorkItemAttached).toHaveBeenCalled();
    });

    it('rejects a request with a wrong signature', async () => {
      await buildApp(SECRET);
      const body = { action: 'field_added', issue: { number: 42 }, repository: REPOSITORY };

      const res = await post('issues', body, 'sha256=' + '0'.repeat(64));

      expect(res.status).toBe(403);
      expect(workflowEventPort.onWorkItemPrinciplesChanged).not.toHaveBeenCalled();
    });

    it('rejects a request with no signature header when a secret is configured', async () => {
      await buildApp(SECRET);
      const body = { action: 'field_added', issue: { number: 42 }, repository: REPOSITORY };

      const res = await post('issues', body);

      expect(res.status).toBe(403);
    });

    it('rejects a signature of the right form computed with the wrong secret', async () => {
      await buildApp(SECRET);
      const body = { action: 'field_added', issue: { number: 42 }, repository: REPOSITORY };
      const forged = 'sha256=' + createHmac('sha256', 'other-secret').update(JSON.stringify(body)).digest('hex');

      const res = await post('issues', body, forged);

      expect(res.status).toBe(403);
    });

    it('rejects a signature that is valid for a different body', async () => {
      await buildApp(SECRET);
      const signedBody = { action: 'field_added', issue: { number: 1 }, repository: REPOSITORY };
      const sentBody = { action: 'field_added', issue: { number: 42 }, repository: REPOSITORY };

      const res = await post('issues', sentBody, sign(signedBody));

      expect(res.status).toBe(403);
    });

    it('rejects a truncated signature without throwing on the length mismatch', async () => {
      await buildApp(SECRET);
      const body = { action: 'field_added', issue: { number: 42 }, repository: REPOSITORY };

      const res = await post('issues', body, 'sha256=abc');

      expect(res.status).toBe(403);
    });

    it('skips verification entirely when no secret is configured', async () => {
      await buildApp('');
      const body = { action: 'field_added', issue: { number: 42 }, repository: REPOSITORY };

      const res = await post('issues', body, 'sha256=garbage');

      expect(res.status).toBe(200);
      expect(workflowEventPort.onWorkItemPrinciplesChanged).toHaveBeenCalled();
    });
  });

  // ─── issue opened / label changes (from the GitHub adapter branch) ─────

  describe('opened issues', () => {
    beforeEach(() => buildApp());

    it('calls onWorkItemOpened with the installation and the issue number', async () => {
      const res = await post('issues', issueBody('opened', [{ name: 'Autonomy' }, { name: 'bug' }]));

      expect(res.status).toBe(200);
      expect(workflowEventPort.onWorkItemOpened).toHaveBeenCalledWith(
        expect.objectContaining({ owner: 'my-org', repo: 'my-repo', platform: 'github' }),
        '42',
      );
    });

    it('passes no vocabulary along: a new issue may already carry field values, which are read back through the adapter', async () => {
      await post('issues', issueBody('opened'));

      expect(workflowEventPort.onWorkItemOpened).toHaveBeenCalledWith(expect.anything(), '42');
    });
  });

  describe('label changes', () => {
    beforeEach(() => buildApp());

    // On GitHub the principle vocabulary is the organization's issue field, so a
    // label is just a label — unlike on GitLab, where labels carry principles.
    it.each(['labeled', 'unlabeled'])(
      'ignores the %s action, because GitHub labels are not the principle vocabulary',
      async (action) => {
        const res = await post('issues', issueBody(action, [{ name: 'Privacy' }]));

        expect(res.status).toBe(200);
        expect(workflowEventPort.onWorkItemPrinciplesChanged).not.toHaveBeenCalled();
        expect(workflowEventPort.onWorkItemOpened).not.toHaveBeenCalled();
      },
    );
  });

  // ─── the two routings must not bleed into each other ──────────────────

  describe('routing separation', () => {
    beforeEach(() => buildApp());

    it('routes a field change to the vocabulary event and not to the opened flow', async () => {
      await post('issues', issueBody('field_added'));

      expect(workflowEventPort.onWorkItemPrinciplesChanged).toHaveBeenCalled();
      expect(workflowEventPort.onWorkItemOpened).not.toHaveBeenCalled();
    });

    it('routes an opened issue to the opened flow and not to the vocabulary event', async () => {
      await post('issues', issueBody('opened'));

      expect(workflowEventPort.onWorkItemOpened).toHaveBeenCalled();
      expect(workflowEventPort.onWorkItemPrinciplesChanged).not.toHaveBeenCalled();
    });

    it('ignores issue actions that are neither', async () => {
      const res = await post('issues', issueBody('assigned', [{ name: 'Privacy' }]));

      expect(res.status).toBe(200);
      expect(workflowEventPort.onWorkItemOpened).not.toHaveBeenCalled();
      expect(workflowEventPort.onWorkItemPrinciplesChanged).not.toHaveBeenCalled();
    });
  });
});
