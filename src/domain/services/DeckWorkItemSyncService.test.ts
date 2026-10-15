import { DeckWorkItemSyncService } from './DeckWorkItemSyncService';
import { IDeckRepository } from '../ports/outbound/IDeckRepository';
import { IInstallationRepository } from '../ports/outbound/IInstallationRepository';
import { IPrincipleWorkItemMappingRepository } from '../ports/outbound/IPrincipleWorkItemMappingRepository';
import { IWorkItemCommentPort } from '../ports/outbound/IWorkItemCommentPort';
import { PrincipleWorkItemMapping } from '../model/PrincipleWorkItemMapping';
import {
  createTestInstallation,
  createMockWorkItemCommentPort,
  createMockPrincipleWorkItemMappingRepository,
  createMockDeckRepository,
} from '../../test/helpers';

function createMockInstallationRepository(): jest.Mocked<IInstallationRepository> {
  return {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn().mockResolvedValue([]),
  };
}

function createService(
  deckRepo: jest.Mocked<IDeckRepository>,
  installationRepo: jest.Mocked<IInstallationRepository>,
  mappingRepo: jest.Mocked<IPrincipleWorkItemMappingRepository>,
  commentPort: jest.Mocked<IWorkItemCommentPort>,
  projectPath = '',
): DeckWorkItemSyncService {
  return new DeckWorkItemSyncService(deckRepo, installationRepo, mappingRepo, commentPort, projectPath);
}

const installation = createTestInstallation({ installationId: 'inst-1', owner: 'acme', repo: 'project', platform: 'gitlab' });

const aMapping = (principleId: string, workItemId?: string): PrincipleWorkItemMapping => ({
  principleId,
  installationId: 'inst-1',
  workItemId: workItemId ?? `issue-${principleId}`,
  commentId: `note-${principleId}`,
});

// ─── Feature: skip sync when no matching installation ─────────────────────

describe('Feature: Skip sync when no installation matches the platform', () => {
  let deckRepo: jest.Mocked<IDeckRepository>;
  let installationRepo: jest.Mocked<IInstallationRepository>;
  let mappingRepo: jest.Mocked<IPrincipleWorkItemMappingRepository>;
  let commentPort: jest.Mocked<IWorkItemCommentPort>;
  let service: DeckWorkItemSyncService;

  beforeEach(() => {
    deckRepo = createMockDeckRepository();
    installationRepo = createMockInstallationRepository();
    mappingRepo = createMockPrincipleWorkItemMappingRepository();
    commentPort = createMockWorkItemCommentPort();
    service = createService(deckRepo, installationRepo, mappingRepo, commentPort);
  });

  it('Given no installations are registered, When syncDeckToWorkItems is called, Then no calls are made and the call resolves without error', async () => {
    installationRepo.findAll.mockResolvedValue([]);

    await service.syncDeckToWorkItems('deck-1');

    expect(commentPort.ensureLabels).not.toHaveBeenCalled();
    expect(commentPort.updateComment).not.toHaveBeenCalled();
    expect(deckRepo.findPrinciplesByDeckId).not.toHaveBeenCalled();
  });

  it('Given only a GitHub installation exists but the comment port platform is "gitlab", When syncDeckToWorkItems is called, Then no sync occurs', async () => {
    installationRepo.findAll.mockResolvedValue([
      createTestInstallation({ installationId: 'gh-1', platform: 'github' }),
    ]);

    await service.syncDeckToWorkItems('deck-1');

    expect(commentPort.ensureLabels).not.toHaveBeenCalled();
    expect(deckRepo.findPrinciplesByDeckId).not.toHaveBeenCalled();
  });
});

// ─── Feature: installation from the environment ───────────────────────────

// The port declares `platform` readonly, so a variant is built instead of assigned.
function commentPortOn(platform: string): jest.Mocked<IWorkItemCommentPort> {
  return { ...createMockWorkItemCommentPort(), platform };
}

describe('Feature: Fall back to the project configured in the environment', () => {
  let deckRepo: jest.Mocked<IDeckRepository>;
  let installationRepo: jest.Mocked<IInstallationRepository>;
  let mappingRepo: jest.Mocked<IPrincipleWorkItemMappingRepository>;
  let commentPort: jest.Mocked<IWorkItemCommentPort>;

  beforeEach(() => {
    deckRepo = createMockDeckRepository();
    installationRepo = createMockInstallationRepository();
    mappingRepo = createMockPrincipleWorkItemMappingRepository();
    commentPort = createMockWorkItemCommentPort();
    installationRepo.findAll.mockResolvedValue([]);
  });

  it('Given no installation is registered and the comment port platform is "gitlab", When syncDeckToWorkItems is called, Then the configured path is used as the project', async () => {
    commentPort = commentPortOn('gitlab');
    const service = createService(deckRepo, installationRepo, mappingRepo, commentPort, 'group/project');

    await service.syncDeckToWorkItems('deck-1');

    expect(commentPort.ensureLabels).toHaveBeenCalledWith(
      { installationId: 'group/project', owner: '', repo: 'group/project', platform: 'gitlab' },
      expect.any(Array),
    );
  });

  it('Given the comment port platform is "github", When syncDeckToWorkItems is called, Then owner and repo are taken as separate segments', async () => {
    commentPort = commentPortOn('github');
    const service = createService(deckRepo, installationRepo, mappingRepo, commentPort, 'acme/widgets');

    await service.syncDeckToWorkItems('deck-1');

    expect(commentPort.ensureLabels).toHaveBeenCalledWith(
      { installationId: 'acme/widgets', owner: 'acme', repo: 'widgets', platform: 'github' },
      expect.any(Array),
    );
  });

  it('Given no installation row exists, When the configured project is used, Then its id matches what the webhook adapters derive from a payload — otherwise comment mappings are written under one id and looked up under another', async () => {
    commentPort = commentPortOn('github');
    const service = createService(deckRepo, installationRepo, mappingRepo, commentPort, 'typedigital/tyler');

    await service.syncDeckToWorkItems('deck-1');

    // GitHubWebhookAdapter uses payload.repository.full_name as installationId.
    expect(commentPort.ensureLabels).toHaveBeenCalledWith(
      expect.objectContaining({ installationId: 'typedigital/tyler' }),
      expect.any(Array),
    );
  });

  it.each(['7882', 'acme', 'acme/widgets/extra', '/widgets'])(
    'Given the comment port platform is "github" and the configured path "%s" is not "owner/repo", When syncDeckToWorkItems is called, Then no sync occurs',
    async (path) => {
      commentPort = commentPortOn('github');
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const service = createService(deckRepo, installationRepo, mappingRepo, commentPort, path);

      await service.syncDeckToWorkItems('deck-1');

      expect(commentPort.ensureLabels).not.toHaveBeenCalled();
      expect(deckRepo.findPrinciplesByDeckId).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    },
  );

  it('Given no project is configured, When syncDeckToWorkItems is called, Then no sync occurs', async () => {
    const service = createService(deckRepo, installationRepo, mappingRepo, commentPort);

    await service.syncDeckToWorkItems('deck-1');

    expect(commentPort.ensureLabels).not.toHaveBeenCalled();
  });
});

// ─── Feature: interpretation changed ─────────────────────────────────────

describe('Feature: Propagate a changed interpretation to every comment of that principle', () => {
  let deckRepo: jest.Mocked<IDeckRepository>;
  let installationRepo: jest.Mocked<IInstallationRepository>;
  let mappingRepo: jest.Mocked<IPrincipleWorkItemMappingRepository>;
  let commentPort: jest.Mocked<IWorkItemCommentPort>;
  let service: DeckWorkItemSyncService;

  beforeEach(() => {
    deckRepo = createMockDeckRepository();
    installationRepo = createMockInstallationRepository();
    mappingRepo = createMockPrincipleWorkItemMappingRepository();
    commentPort = createMockWorkItemCommentPort();
    service = createService(deckRepo, installationRepo, mappingRepo, commentPort);
    installationRepo.findAll.mockResolvedValue([installation]);
    deckRepo.findPrinciplesByDeckId.mockResolvedValue([
      { principleId: 'P007', category: 'Dignity', projectContext: 'We store no IP addresses.', rank: 1 },
    ]);
  });

  it('Given three work items carry the principle, When its interpretation changed, Then every comment is updated with the new text', async () => {
    mappingRepo.findAllByPrincipleAndInstallation.mockResolvedValue([
      aMapping('P007', 'issue-1'),
      aMapping('P007', 'issue-2'),
      aMapping('P007', 'issue-3'),
    ]);

    await service.syncPrincipleContextToWorkItems('deck-1', 'P007');

    expect(commentPort.updateComment).toHaveBeenCalledTimes(3);
    for (const call of commentPort.updateComment.mock.calls) {
      expect(call[3]).toContain('We store no IP addresses.');
      expect(call[3]).toContain('Project interpretation');
    }
  });

  it('Given the principle is only commented on one work item, When its interpretation changed, Then no other principle is touched', async () => {
    mappingRepo.findAllByPrincipleAndInstallation.mockResolvedValue([aMapping('P007', 'issue-1')]);

    await service.syncPrincipleContextToWorkItems('deck-1', 'P007');

    expect(mappingRepo.findAllByPrincipleAndInstallation).toHaveBeenCalledWith('P007', 'inst-1');
    expect(commentPort.addComment).not.toHaveBeenCalled();
    expect(commentPort.findWorkItemsByLabel).not.toHaveBeenCalled();
  });

  it('Given a comment was deleted in the platform, When its interpretation changed, Then the dangling mapping is removed instead of failing', async () => {
    mappingRepo.findAllByPrincipleAndInstallation.mockResolvedValue([
      aMapping('P007', 'issue-1'),
      aMapping('P007', 'issue-2'),
    ]);
    commentPort.commentExists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    await service.syncPrincipleContextToWorkItems('deck-1', 'P007');

    expect(mappingRepo.delete).toHaveBeenCalledWith('P007', 'inst-1', 'issue-1');
    expect(commentPort.updateComment).toHaveBeenCalledTimes(1);
  });

  it('Given the principle is not in the deck, When a context sync is requested, Then nothing is written', async () => {
    deckRepo.findPrinciplesByDeckId.mockResolvedValue([]);

    await service.syncPrincipleContextToWorkItems('deck-1', 'P007');

    expect(commentPort.updateComment).not.toHaveBeenCalled();
  });

  it('Given no installation is known, When a context sync is requested, Then nothing is written', async () => {
    installationRepo.findAll.mockResolvedValue([]);

    await service.syncPrincipleContextToWorkItems('deck-1', 'P007');

    expect(mappingRepo.findAllByPrincipleAndInstallation).not.toHaveBeenCalled();
    expect(commentPort.updateComment).not.toHaveBeenCalled();
  });

  it('Given a locale, When a context sync is requested, Then the comment is written in that locale', async () => {
    mappingRepo.findAllByPrincipleAndInstallation.mockResolvedValue([aMapping('P007', 'issue-1')]);

    await service.syncPrincipleContextToWorkItems('deck-1', 'P007', 'de');

    const body = commentPort.updateComment.mock.calls[0][3];
    expect(body).not.toContain('### 📌 Privacy');
    expect(body).toContain('We store no IP addresses.');
  });
});

// ─── Feature: label provisioning guard ───────────────────────────────────

describe('Feature: Ensure labels exist before syncing comments', () => {
  let deckRepo: jest.Mocked<IDeckRepository>;
  let installationRepo: jest.Mocked<IInstallationRepository>;
  let mappingRepo: jest.Mocked<IPrincipleWorkItemMappingRepository>;
  let commentPort: jest.Mocked<IWorkItemCommentPort>;
  let service: DeckWorkItemSyncService;

  beforeEach(() => {
    deckRepo = createMockDeckRepository();
    installationRepo = createMockInstallationRepository();
    mappingRepo = createMockPrincipleWorkItemMappingRepository();
    commentPort = createMockWorkItemCommentPort();
    service = createService(deckRepo, installationRepo, mappingRepo, commentPort);
    installationRepo.findAll.mockResolvedValue([installation]);
  });

  it('Given an installation exists and the deck has no principles, When syncDeckToWorkItems is called, Then ensureLabels is called but no comments are updated', async () => {
    deckRepo.findPrinciplesByDeckId.mockResolvedValue([]);

    await service.syncDeckToWorkItems('deck-1');

    expect(commentPort.ensureLabels).toHaveBeenCalledWith(installation, expect.any(Array));
    expect(commentPort.updateComment).not.toHaveBeenCalled();
  });

  it('Given a principle with a mapping, When syncDeckToWorkItems is called, Then ensureLabels is invoked before any updateComment', async () => {
    deckRepo.findPrinciplesByDeckId.mockResolvedValue([
      { principleId: 'P001', category: 'Beneficence', rank: 1 },
    ]);
    mappingRepo.findAllByPrincipleAndInstallation.mockResolvedValue([aMapping('P001')]);

    const callOrder: string[] = [];
    commentPort.ensureLabels.mockImplementation(async () => { callOrder.push('ensureLabels'); });
    commentPort.updateComment.mockImplementation(async () => { callOrder.push('updateComment'); });

    await service.syncDeckToWorkItems('deck-1');

    expect(callOrder[0]).toBe('ensureLabels');
    expect(callOrder[1]).toBe('updateComment');
  });

  it('Given an installation, When syncDeckToWorkItems runs with locale "en", Then ensureLabels is called with English principle names only', async () => {
    deckRepo.findPrinciplesByDeckId.mockResolvedValue([]);

    await service.syncDeckToWorkItems('deck-1', 'en');

    const [, labelNames] = commentPort.ensureLabels.mock.calls[0];
    expect(labelNames).toEqual(expect.arrayContaining(['Autonomy', 'Privacy', 'Solidarity']));
    expect(labelNames).toHaveLength(9);
  });
});

// ─── Feature: selective comment updates ──────────────────────────────────

describe('Feature: Update comments only for principles with existing mappings', () => {
  let deckRepo: jest.Mocked<IDeckRepository>;
  let installationRepo: jest.Mocked<IInstallationRepository>;
  let mappingRepo: jest.Mocked<IPrincipleWorkItemMappingRepository>;
  let commentPort: jest.Mocked<IWorkItemCommentPort>;
  let service: DeckWorkItemSyncService;

  beforeEach(() => {
    deckRepo = createMockDeckRepository();
    installationRepo = createMockInstallationRepository();
    mappingRepo = createMockPrincipleWorkItemMappingRepository();
    commentPort = createMockWorkItemCommentPort();
    service = createService(deckRepo, installationRepo, mappingRepo, commentPort);
    installationRepo.findAll.mockResolvedValue([installation]);
  });

  it('Given a principle has no mappings, When syncDeckToWorkItems is called, Then that principle is skipped and no comment is updated', async () => {
    deckRepo.findPrinciplesByDeckId.mockResolvedValue([
      { principleId: 'P001', category: 'Beneficence', rank: 1 },
    ]);
    mappingRepo.findAllByPrincipleAndInstallation.mockResolvedValue([]);

    await service.syncDeckToWorkItems('deck-1');

    expect(commentPort.updateComment).not.toHaveBeenCalled();
  });

  it('Given a principle has one mapping, When syncDeckToWorkItems is called, Then updateComment is called with the workItemId and commentId from the mapping', async () => {
    deckRepo.findPrinciplesByDeckId.mockResolvedValue([
      { principleId: 'P001', category: 'Beneficence', rank: 1 },
    ]);
    mappingRepo.findAllByPrincipleAndInstallation.mockResolvedValue([
      { principleId: 'P001', installationId: 'inst-1', workItemId: 'issue-77', commentId: 'note-33' },
    ]);

    await service.syncDeckToWorkItems('deck-1');

    expect(commentPort.updateComment).toHaveBeenCalledWith(
      installation,
      'issue-77',
      'note-33',
      expect.any(String),
    );
  });

  it('Given a principle has two mappings to different work items, When syncDeckToWorkItems is called, Then both comments are updated', async () => {
    deckRepo.findPrinciplesByDeckId.mockResolvedValue([
      { principleId: 'P001', category: 'Beneficence', rank: 1 },
    ]);
    mappingRepo.findAllByPrincipleAndInstallation.mockResolvedValue([
      aMapping('P001', 'issue-1'),
      aMapping('P001', 'issue-2'),
    ]);

    await service.syncDeckToWorkItems('deck-1');

    expect(commentPort.updateComment).toHaveBeenCalledTimes(2);
    expect(commentPort.updateComment).toHaveBeenCalledWith(installation, 'issue-1', expect.any(String), expect.any(String));
    expect(commentPort.updateComment).toHaveBeenCalledWith(installation, 'issue-2', expect.any(String), expect.any(String));
  });

  it('Given a deck with two principles where only one has mappings, When syncDeckToWorkItems is called, Then only the mapped principle triggers an update', async () => {
    deckRepo.findPrinciplesByDeckId.mockResolvedValue([
      { principleId: 'P001', category: 'Beneficence', rank: 1 },
      { principleId: 'P005', category: 'Dignity', rank: 2 },
    ]);
    mappingRepo.findAllByPrincipleAndInstallation.mockImplementation(async (principleId) =>
      principleId === 'P001' ? [aMapping('P001')] : [],
    );

    await service.syncDeckToWorkItems('deck-1');

    expect(commentPort.updateComment).toHaveBeenCalledTimes(1);
    expect(commentPort.updateComment).toHaveBeenCalledWith(
      installation,
      'issue-P001',
      'note-P001',
      expect.any(String),
    );
  });

  it('Given a deck with three principles all having mappings, When syncDeckToWorkItems is called, Then three updateComment calls are made', async () => {
    deckRepo.findPrinciplesByDeckId.mockResolvedValue([
      { principleId: 'P001', category: 'Beneficence', rank: 1 },
      { principleId: 'P005', category: 'Dignity', rank: 2 },
      { principleId: 'P008', category: 'Justice', rank: 3 },
    ]);
    mappingRepo.findAllByPrincipleAndInstallation.mockImplementation(async (principleId) =>
      [aMapping(principleId)],
    );

    await service.syncDeckToWorkItems('deck-1');

    expect(commentPort.updateComment).toHaveBeenCalledTimes(3);
  });

  it('Given multiple installations where only one matches the platform, When syncDeckToWorkItems is called, Then findAllByPrincipleAndInstallation uses the matching installation ID', async () => {
    const githubInstallation = createTestInstallation({ installationId: 'gh-1', platform: 'github' });
    installationRepo.findAll.mockResolvedValue([githubInstallation, installation]);
    deckRepo.findPrinciplesByDeckId.mockResolvedValue([
      { principleId: 'P001', category: 'Beneficence', rank: 1 },
    ]);

    await service.syncDeckToWorkItems('deck-1');

    expect(mappingRepo.findAllByPrincipleAndInstallation).toHaveBeenCalledWith('P001', 'inst-1');
  });
});

// ─── Feature: comment body content ───────────────────────────────────────

describe('Feature: Updated comment body reflects current deck state', () => {
  let deckRepo: jest.Mocked<IDeckRepository>;
  let installationRepo: jest.Mocked<IInstallationRepository>;
  let mappingRepo: jest.Mocked<IPrincipleWorkItemMappingRepository>;
  let commentPort: jest.Mocked<IWorkItemCommentPort>;
  let service: DeckWorkItemSyncService;

  beforeEach(() => {
    deckRepo = createMockDeckRepository();
    installationRepo = createMockInstallationRepository();
    mappingRepo = createMockPrincipleWorkItemMappingRepository();
    commentPort = createMockWorkItemCommentPort();
    service = createService(deckRepo, installationRepo, mappingRepo, commentPort);
    installationRepo.findAll.mockResolvedValue([installation]);
  });

  it('Given a principle with projectContext "We use GDPR-compliant logging", When syncDeckToWorkItems is called, Then the comment body contains that projectContext', async () => {
    deckRepo.findPrinciplesByDeckId.mockResolvedValue([
      { principleId: 'P007', category: 'Dignity', projectContext: 'We use GDPR-compliant logging', rank: 1 },
    ]);
    mappingRepo.findAllByPrincipleAndInstallation.mockResolvedValue([aMapping('P007')]);

    let capturedBody = '';
    commentPort.updateComment.mockImplementation(async (_, __, ___, body) => {
      capturedBody = body;
    });

    await service.syncDeckToWorkItems('deck-1');

    expect(capturedBody).toContain('We use GDPR-compliant logging');
  });

  it('Given a principle without projectContext, When syncDeckToWorkItems is called, Then the comment body falls back to the generic DARE guidance', async () => {
    deckRepo.findPrinciplesByDeckId.mockResolvedValue([
      { principleId: 'P007', category: 'Dignity', projectContext: undefined, rank: 1 },
    ]);
    mappingRepo.findAllByPrincipleAndInstallation.mockResolvedValue([aMapping('P007')]);

    let capturedBody = '';
    commentPort.updateComment.mockImplementation(async (_, __, ___, body) => {
      capturedBody = body;
    });

    await service.syncDeckToWorkItems('deck-1');

    expect(capturedBody).toContain('DARE guidance');
  });

  it('Given principle P001 (Beneficence), When the comment body is built, Then it contains the principle name, ID, and related sibling principles', async () => {
    deckRepo.findPrinciplesByDeckId.mockResolvedValue([
      { principleId: 'P001', category: 'Beneficence', rank: 1 },
    ]);
    mappingRepo.findAllByPrincipleAndInstallation.mockResolvedValue([aMapping('P001')]);

    let capturedBody = '';
    commentPort.updateComment.mockImplementation(async (_, __, ___, body) => {
      capturedBody = body;
    });

    await service.syncDeckToWorkItems('deck-1');

    expect(capturedBody).toContain('P001');
    expect(capturedBody).toContain('Beneficence');
    expect(capturedBody).toContain('Sustainability');
    expect(capturedBody).toContain('Non-Maleficence');
  });
});

// ─── Feature: stale mapping cleanup ─────────────────────────────────────

describe('Feature: Delete stale mappings when comment no longer exists on GitLab', () => {
  let deckRepo: jest.Mocked<IDeckRepository>;
  let installationRepo: jest.Mocked<IInstallationRepository>;
  let mappingRepo: jest.Mocked<IPrincipleWorkItemMappingRepository>;
  let commentPort: jest.Mocked<IWorkItemCommentPort>;
  let service: DeckWorkItemSyncService;

  beforeEach(() => {
    deckRepo = createMockDeckRepository();
    installationRepo = createMockInstallationRepository();
    mappingRepo = createMockPrincipleWorkItemMappingRepository();
    commentPort = createMockWorkItemCommentPort();
    service = createService(deckRepo, installationRepo, mappingRepo, commentPort);
    installationRepo.findAll.mockResolvedValue([installation]);
  });

  it('Given a mapping exists but the comment was deleted on GitLab, When syncing a discovered issue, Then the stale mapping is deleted and a new comment is created', async () => {
    deckRepo.findPrinciplesByDeckId.mockResolvedValue([
      { principleId: 'P001', category: 'Beneficence', rank: 1 },
    ]);
    commentPort.findWorkItemsByLabel.mockResolvedValue(['issue-77']);
    mappingRepo.findByIssue.mockResolvedValue({
      principleId: 'P001', installationId: 'inst-1', workItemId: 'issue-77', commentId: 'note-deleted',
    });
    commentPort.commentExists.mockResolvedValue(false);
    commentPort.addComment.mockResolvedValue('note-new');
    mappingRepo.findAllByPrincipleAndInstallation.mockResolvedValue([]);

    await service.syncDeckToWorkItems('deck-1');

    expect(mappingRepo.delete).toHaveBeenCalledWith('P001', 'inst-1', 'issue-77');
    expect(commentPort.addComment).toHaveBeenCalledWith(installation, 'issue-77', expect.any(String));
    expect(mappingRepo.save).toHaveBeenCalledWith({
      principleId: 'P001', installationId: 'inst-1', workItemId: 'issue-77', commentId: 'note-new',
    });
    expect(commentPort.updateComment).not.toHaveBeenCalled();
  });

  it('Given a stale mapping exists for an issue without the label and the comment is gone, When syncing, Then the mapping is deleted and no update is attempted', async () => {
    deckRepo.findPrinciplesByDeckId.mockResolvedValue([
      { principleId: 'P001', category: 'Beneficence', rank: 1 },
    ]);
    commentPort.findWorkItemsByLabel.mockResolvedValue([]);
    mappingRepo.findAllByPrincipleAndInstallation.mockResolvedValue([
      { principleId: 'P001', installationId: 'inst-1', workItemId: 'issue-99', commentId: 'note-gone' },
    ]);
    commentPort.commentExists.mockResolvedValue(false);

    await service.syncDeckToWorkItems('deck-1');

    expect(mappingRepo.delete).toHaveBeenCalledWith('P001', 'inst-1', 'issue-99');
    expect(commentPort.updateComment).not.toHaveBeenCalled();
  });

  it('Given a stale mapping exists for an issue without the label but the comment still exists, When syncing, Then the comment is updated and the mapping is kept', async () => {
    deckRepo.findPrinciplesByDeckId.mockResolvedValue([
      { principleId: 'P001', category: 'Beneficence', rank: 1 },
    ]);
    commentPort.findWorkItemsByLabel.mockResolvedValue([]);
    mappingRepo.findAllByPrincipleAndInstallation.mockResolvedValue([
      { principleId: 'P001', installationId: 'inst-1', workItemId: 'issue-99', commentId: 'note-ok' },
    ]);
    commentPort.commentExists.mockResolvedValue(true);

    await service.syncDeckToWorkItems('deck-1');

    expect(commentPort.updateComment).toHaveBeenCalledWith(installation, 'issue-99', 'note-ok', expect.any(String));
    expect(mappingRepo.delete).not.toHaveBeenCalled();
  });

  it('Given a mapping exists and the comment still exists on GitLab, When syncing a discovered issue, Then the comment is updated normally', async () => {
    deckRepo.findPrinciplesByDeckId.mockResolvedValue([
      { principleId: 'P001', category: 'Beneficence', rank: 1 },
    ]);
    commentPort.findWorkItemsByLabel.mockResolvedValue(['issue-77']);
    mappingRepo.findByIssue.mockResolvedValue({
      principleId: 'P001', installationId: 'inst-1', workItemId: 'issue-77', commentId: 'note-33',
    });
    commentPort.commentExists.mockResolvedValue(true);
    mappingRepo.findAllByPrincipleAndInstallation.mockResolvedValue([]);

    await service.syncDeckToWorkItems('deck-1');

    expect(commentPort.updateComment).toHaveBeenCalledWith(installation, 'issue-77', 'note-33', expect.any(String));
    expect(mappingRepo.delete).not.toHaveBeenCalled();
    expect(commentPort.addComment).not.toHaveBeenCalled();
  });
});
