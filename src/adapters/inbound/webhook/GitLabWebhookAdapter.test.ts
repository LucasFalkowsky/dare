import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GitLabWebhookAdapter } from './GitLabWebhookAdapter';
import { IWorkflowEventPort } from '../../../domain/ports/inbound/IWorkflowEventPort';
import { WORKFLOW_EVENT_PORT } from '../../../domain/ports/injection-tokens';
import { GITLAB_PROJECT_PATH, GITLAB_WEBHOOK_SECRET } from '../../outbound/pm/gitlab.config';

describe('GitLabWebhookAdapter', () => {
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
      controllers: [GitLabWebhookAdapter],
      providers: [
        { provide: WORKFLOW_EVENT_PORT, useValue: workflowEventPort },
        { provide: GITLAB_PROJECT_PATH, useValue: 'default-owner/default-repo' },
        { provide: GITLAB_WEBHOOK_SECRET, useValue: webhookSecret },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  };

  afterEach(async () => {
    await app.close();
  });

  describe('label events', () => {
    beforeEach(() => buildApp());

    it('calls onWorkItemPrinciplesChanged when an Issue Hook is received', async () => {
      const res = await request(app.getHttpServer())
        .post('/webhooks/gitlab')
        .set('x-gitlab-event', 'Issue Hook')
        .send({
          object_attributes: { iid: 42 },
          labels: [{ title: 'Autonomy' }, { title: 'Privacy' }],
          project: { path_with_namespace: 'acme/my-project' },
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });

      // fire-and-forget — wait a tick for the promise to resolve
      await new Promise((r) => setTimeout(r, 50));

      expect(workflowEventPort.onWorkItemPrinciplesChanged).toHaveBeenCalledWith(
        {
          installationId: 'acme/my-project',
          owner: 'acme',
          repo: 'my-project',
          platform: 'gitlab',
        },
        '42',
      );
    });

    it('handles nested project paths (groups/subgroups)', async () => {
      await request(app.getHttpServer())
        .post('/webhooks/gitlab')
        .set('x-gitlab-event', 'Issue Hook')
        .send({
          object_attributes: { iid: 7 },
          labels: [{ title: 'Justice' }],
          project: { path_with_namespace: 'org/group/repo' },
        });

      await new Promise((r) => setTimeout(r, 50));

      expect(workflowEventPort.onWorkItemPrinciplesChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          installationId: 'org/group/repo',
          owner: 'org',
          repo: 'group/repo',
        }),
        '7',
      );
    });

    it('falls back to configured GITLAB_PROJECT_PATH when project is missing from payload', async () => {
      await request(app.getHttpServer())
        .post('/webhooks/gitlab')
        .set('x-gitlab-event', 'Issue Hook')
        .send({
          object_attributes: { iid: 99 },
          labels: [{ title: 'Solidarity' }],
        });

      await new Promise((r) => setTimeout(r, 50));

      expect(workflowEventPort.onWorkItemPrinciplesChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          installationId: 'default-owner/default-repo',
          owner: 'default-owner',
          repo: 'default-repo',
        }),
        '99',
      );
    });

    it('emits the vocabulary event even when the payload carries no labels', async () => {
      await request(app.getHttpServer())
        .post('/webhooks/gitlab')
        .set('x-gitlab-event', 'Issue Hook')
        .send({
          object_attributes: { iid: 1 },
          labels: [],
          project: { path_with_namespace: 'acme/repo' },
        });

      await new Promise((r) => setTimeout(r, 50));

      expect(workflowEventPort.onWorkItemPrinciplesChanged).toHaveBeenCalledWith(
        expect.any(Object),
        '1',
      );
    });

    it('emits the vocabulary event even when the labels field is missing', async () => {
      await request(app.getHttpServer())
        .post('/webhooks/gitlab')
        .set('x-gitlab-event', 'Issue Hook')
        .send({
          object_attributes: { iid: 1 },
          project: { path_with_namespace: 'acme/repo' },
        });

      await new Promise((r) => setTimeout(r, 50));

      expect(workflowEventPort.onWorkItemPrinciplesChanged).toHaveBeenCalledWith(
        expect.any(Object),
        '1',
      );
    });
  });

  describe('ignored events', () => {
    beforeEach(() => buildApp());

    it('ignores non-Issue Hook events', async () => {
      const res = await request(app.getHttpServer())
        .post('/webhooks/gitlab')
        .set('x-gitlab-event', 'Push Hook')
        .send({ ref: 'refs/heads/main' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
      expect(workflowEventPort.onWorkItemPrinciplesChanged).not.toHaveBeenCalled();
    });

    it('ignores Issue Hook events without an iid', async () => {
      const res = await request(app.getHttpServer())
        .post('/webhooks/gitlab')
        .set('x-gitlab-event', 'Issue Hook')
        .send({ object_attributes: {}, labels: [{ title: 'Autonomy' }] });

      expect(res.status).toBe(200);
      expect(workflowEventPort.onWorkItemPrinciplesChanged).not.toHaveBeenCalled();
    });
  });

  describe('webhook secret verification', () => {
    it('rejects requests with an invalid token when a secret is configured', async () => {
      await buildApp('my-secret');

      const res = await request(app.getHttpServer())
        .post('/webhooks/gitlab')
        .set('x-gitlab-event', 'Issue Hook')
        .set('x-gitlab-token', 'wrong-secret')
        .send({
          object_attributes: { iid: 1 },
          labels: [{ title: 'Autonomy' }],
        });

      expect(res.status).toBe(403);
      expect(workflowEventPort.onWorkItemPrinciplesChanged).not.toHaveBeenCalled();
    });

    it('rejects requests with no token when a secret is configured', async () => {
      await buildApp('my-secret');

      const res = await request(app.getHttpServer())
        .post('/webhooks/gitlab')
        .set('x-gitlab-event', 'Issue Hook')
        .send({
          object_attributes: { iid: 1 },
          labels: [{ title: 'Autonomy' }],
        });

      expect(res.status).toBe(403);
    });

    it('accepts requests with a valid token when a secret is configured', async () => {
      await buildApp('my-secret');

      const res = await request(app.getHttpServer())
        .post('/webhooks/gitlab')
        .set('x-gitlab-event', 'Issue Hook')
        .set('x-gitlab-token', 'my-secret')
        .send({
          object_attributes: { iid: 5 },
          labels: [{ title: 'Privacy' }],
          project: { path_with_namespace: 'acme/repo' },
        });

      expect(res.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));
      expect(workflowEventPort.onWorkItemPrinciplesChanged).toHaveBeenCalled();
    });

    it('allows all requests when no secret is configured', async () => {
      await buildApp('');

      const res = await request(app.getHttpServer())
        .post('/webhooks/gitlab')
        .set('x-gitlab-event', 'Issue Hook')
        .send({
          object_attributes: { iid: 10 },
          labels: [{ title: 'Autonomy' }],
          project: { path_with_namespace: 'acme/repo' },
        });

      expect(res.status).toBe(200);

      await new Promise((r) => setTimeout(r, 50));
      expect(workflowEventPort.onWorkItemPrinciplesChanged).toHaveBeenCalled();
    });
  });
});
