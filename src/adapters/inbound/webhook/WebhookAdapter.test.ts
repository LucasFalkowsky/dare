import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { WebhookAdapter } from './WebhookAdapter';
import { IWorkflowEventPort } from '../../../domain/ports/inbound/IWorkflowEventPort';
import { WORKFLOW_EVENT_PORT } from '../../../domain/ports/injection-tokens';

describe('WebhookAdapter', () => {
  const createMockWorkflowPort = (): jest.Mocked<IWorkflowEventPort> => ({
    onFrameworkActivated: jest.fn().mockResolvedValue(undefined),
    onWorkItemOpened: jest.fn().mockResolvedValue(undefined),
      onSubWorkItemAttached: jest.fn().mockResolvedValue(undefined),
      onWorkItemPrinciplesChanged: jest.fn().mockResolvedValue(undefined),
  });

  let app: INestApplication;
  let port: jest.Mocked<IWorkflowEventPort>;

  beforeEach(async () => {
    port = createMockWorkflowPort();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookAdapter],
      providers: [
        {
          provide: WORKFLOW_EVENT_PORT,
          useValue: port,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('routes framework.activated to onFrameworkActivated', async () => {
    const res = await request(app.getHttpServer())
      .post('/webhooks')
      .set('x-event-type', 'framework.activated')
      .send({
        installation: { id: 'inst-1' },
        repository: { owner: 'acme', name: 'repo' },
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
    expect(port.onFrameworkActivated).toHaveBeenCalledWith({
      installationId: 'inst-1',
      owner: 'acme',
      repo: 'repo',
      platform: 'github',
    });
  });

  it('routes workitem.opened to onWorkItemOpened with the installation and the work-item id', async () => {
    const res = await request(app.getHttpServer())
      .post('/webhooks')
      .set('x-event-type', 'workitem.opened')
      .send({
        installation: { id: 'inst-2' },
        repository: { owner: 'acme', name: 'repo' },
        workItem: { id: 'WI-7' },
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
    expect(port.onWorkItemOpened).toHaveBeenCalledWith(
      {
        installationId: 'inst-2',
        owner: 'acme',
        repo: 'repo',
        platform: 'github',
      },
      'WI-7',
    );
  });

  // The principle vocabulary is no longer taken from a payload: GitLab keeps it
  // in labels, GitHub in an issue field, so only the adapter can read it. The
  // generic endpoint therefore passes the work item on and nothing else.
  it.each([
    ['a flat string array', { labels: ['Autonomy', 'Privacy'] }],
    ['objects with a title field', { labels: [{ title: 'Privacy' }] }],
    ['the GitLab object_attributes path', { object_attributes: { labels: [{ title: 'Solidarity' }] } }],
  ])('Given labels in the payload as %s, When workitem.opened is received, Then they are ignored', async (_shape, extra) => {
    await request(app.getHttpServer())
      .post('/webhooks')
      .set('x-event-type', 'workitem.opened')
      .send({
        installation: { id: 'inst-3' },
        repository: { owner: 'acme', name: 'repo' },
        workItem: { id: '10' },
        ...extra,
      });

    expect(port.onWorkItemOpened).toHaveBeenCalledWith(expect.any(Object), '10');
  });

  it('returns 200 for unknown events without error', async () => {
    const res = await request(app.getHttpServer())
      .post('/webhooks')
      .set('x-event-type', 'some.unknown.event')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
    expect(port.onFrameworkActivated).not.toHaveBeenCalled();
    expect(port.onWorkItemOpened).not.toHaveBeenCalled();
  });
});
