import { PrincipleCommentService } from './PrincipleCommentService';
import { IPrincipleWorkItemMappingRepository } from '../ports/outbound/IPrincipleWorkItemMappingRepository';
import { IWorkItemCommentPort } from '../ports/outbound/IWorkItemCommentPort';
import { PrincipleWorkItemMapping } from '../model/PrincipleWorkItemMapping';
import { IDeckRepository } from '../ports/outbound/IDeckRepository';
import {
  createTestInstallation,
  createMockWorkItemCommentPort,
  createMockPrincipleWorkItemMappingRepository,
  createMockDeckRepository,
} from '../../test/helpers';

function createService(
  mappingRepo: jest.Mocked<IPrincipleWorkItemMappingRepository>,
  commentPort: jest.Mocked<IWorkItemCommentPort>,
  deckRepo: jest.Mocked<IDeckRepository> = createMockDeckRepository(),
): PrincipleCommentService {
  return new PrincipleCommentService(mappingRepo, commentPort, deckRepo);
}

const installation = createTestInstallation({ installationId: 'inst-1', owner: 'acme', repo: 'project' });

// ─── Feature: vocabulary matching ─────────────────────────────────────────

describe('Feature: Match the work item\'s vocabulary to principles', () => {
  let mappingRepo: jest.Mocked<IPrincipleWorkItemMappingRepository>;
  let commentPort: jest.Mocked<IWorkItemCommentPort>;
  let service: PrincipleCommentService;

  beforeEach(() => {
    mappingRepo = createMockPrincipleWorkItemMappingRepository();
    commentPort = createMockWorkItemCommentPort();
    service = createService(mappingRepo, commentPort);
  });

  it('Given a work item, When addPrincipleCommentForIssue is called, Then the vocabulary is read through the port rather than passed in', async () => {
    commentPort.getPrinciples.mockResolvedValue(['Autonomy']);

    await service.addPrincipleCommentForIssue(installation, '42');

    expect(commentPort.getPrinciples).toHaveBeenCalledWith(installation, '42');
  });

  it('Given an issue with label "Autonomy" (English principle name P005), When addPrincipleCommentForIssue is called, Then a comment is posted and the mapping is saved with principleId P005', async () => {
    commentPort.addComment.mockResolvedValue('comment-99');

    commentPort.getPrinciples.mockResolvedValue(['Autonomy']);
    await service.addPrincipleCommentForIssue(installation, '42');

    expect(commentPort.addComment).toHaveBeenCalled();
    expect(mappingRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ principleId: 'P005_autonomy', commentId: 'comment-99' }),
    );
  });

  it('Given a label matching the German locale name "Autonomie", When addPrincipleCommentForIssue is called, Then P005 is matched and a comment is posted', async () => {
    commentPort.addComment.mockResolvedValue('c1');

    commentPort.getPrinciples.mockResolvedValue(['Autonomie']);
    await service.addPrincipleCommentForIssue(installation, '10');

    expect(commentPort.addComment).toHaveBeenCalled();
    expect(mappingRepo.save).toHaveBeenCalledWith(expect.objectContaining({ principleId: 'P005_autonomy' }));
  });

  it('Given a label "PRIVACY" in uppercase, When addPrincipleCommentForIssue is called, Then the match is case-insensitive and P007_privacy is used', async () => {
    commentPort.addComment.mockResolvedValue('c2');

    commentPort.getPrinciples.mockResolvedValue(['PRIVACY']);
    await service.addPrincipleCommentForIssue(installation, '11');

    expect(mappingRepo.save).toHaveBeenCalledWith(expect.objectContaining({ principleId: 'P007_privacy' }));
  });

  it('Given multiple labels where only the second one matches, When addPrincipleCommentForIssue is called, Then the matching principle is used', async () => {
    commentPort.addComment.mockResolvedValue('c3');

    commentPort.getPrinciples.mockResolvedValue(['bug', 'Privacy', 'enhancement']);
    await service.addPrincipleCommentForIssue(installation, '42');

    expect(commentPort.addComment).toHaveBeenCalled();
    expect(mappingRepo.save).toHaveBeenCalledWith(expect.objectContaining({ principleId: 'P007_privacy' }));
  });

  it('Given an empty label list, When addPrincipleCommentForIssue is called, Then no calls are made', async () => {
    commentPort.getPrinciples.mockResolvedValue([]);
    await service.addPrincipleCommentForIssue(installation, '42');

    expect(commentPort.ensureLabels).not.toHaveBeenCalled();
    expect(commentPort.addComment).not.toHaveBeenCalled();
    expect(mappingRepo.save).not.toHaveBeenCalled();
  });

  it('Given labels that do not match any principle in any locale, When addPrincipleCommentForIssue is called, Then no calls are made', async () => {
    commentPort.getPrinciples.mockResolvedValue(['bug', 'enhancement', 'wontfix']);
    await service.addPrincipleCommentForIssue(installation, '42');

    expect(commentPort.ensureLabels).not.toHaveBeenCalled();
    expect(commentPort.addComment).not.toHaveBeenCalled();
    expect(mappingRepo.save).not.toHaveBeenCalled();
  });
});

// ─── Feature: project interpretation in webhook comments ─────────────────

describe('Feature: Use the deck interpretation in webhook-triggered comments', () => {
  let mappingRepo: jest.Mocked<IPrincipleWorkItemMappingRepository>;
  let commentPort: jest.Mocked<IWorkItemCommentPort>;
  let deckRepo: jest.Mocked<IDeckRepository>;
  let service: PrincipleCommentService;
  let capturedBody: string;

  beforeEach(() => {
    mappingRepo = createMockPrincipleWorkItemMappingRepository();
    commentPort = createMockWorkItemCommentPort();
    deckRepo = createMockDeckRepository();
    service = createService(mappingRepo, commentPort, deckRepo);
    capturedBody = '';
    commentPort.addComment.mockImplementation(async (_i, _w, body) => {
      capturedBody = body;
      return 'c1';
    });
  });

  function deckWith(principles: { principleId: string; projectContext?: string }[]): void {
    deckRepo.findLatest.mockResolvedValue({
      deckId: 'deck-1',
      name: 'Project deck',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    deckRepo.findPrinciplesByDeckId.mockResolvedValue(
      principles.map(p => ({ ...p, category: 'Dignity', rank: 1 })) as never,
    );
  }

  it('Given the current deck interprets the principle, When a comment is posted, Then the interpretation replaces the generic guidance', async () => {
    deckWith([{ principleId: 'P007_privacy', projectContext: 'We store no IP addresses.' }]);
    commentPort.getPrinciples.mockResolvedValue(['Privacy']);

    await service.addPrincipleCommentForIssue(installation, '42');

    expect(capturedBody).toContain('We store no IP addresses.');
    expect(capturedBody).toContain('Project interpretation');
  });

  it('Given a deck entry stored as the bare principle number, When a comment is posted, Then its interpretation is still found', async () => {
    deckWith([{ principleId: 'P007', projectContext: 'Bare id form.' }]);
    commentPort.getPrinciples.mockResolvedValue(['Privacy']);

    await service.addPrincipleCommentForIssue(installation, '42');

    expect(capturedBody).toContain('Bare id form.');
  });

  it('Given the deck carries no interpretation for the principle, When a comment is posted, Then the generic guidance is used', async () => {
    deckWith([{ principleId: 'P008_justice', projectContext: 'Unrelated principle.' }]);
    commentPort.getPrinciples.mockResolvedValue(['Privacy']);

    await service.addPrincipleCommentForIssue(installation, '42');

    expect(capturedBody).not.toContain('Unrelated principle.');
    expect(capturedBody).toContain('DARE guidance');
  });

  it.each([undefined, '', '   '])('Given an interpretation of %p, When a comment is posted, Then the generic guidance is used', async (context) => {
    deckWith([{ principleId: 'P007_privacy', projectContext: context }]);
    commentPort.getPrinciples.mockResolvedValue(['Privacy']);

    await service.addPrincipleCommentForIssue(installation, '42');

    expect(capturedBody).toContain('DARE guidance');
  });

  it('Given no deck exists yet, When a comment is posted, Then the comment is still written with the generic guidance', async () => {
    deckRepo.findLatest.mockResolvedValue(null);
    commentPort.getPrinciples.mockResolvedValue(['Privacy']);

    await service.addPrincipleCommentForIssue(installation, '42');

    expect(commentPort.addComment).toHaveBeenCalled();
    expect(capturedBody).toContain('DARE guidance');
  });

  it('Given two principles are commented in one run, When the deck is read, Then it is read once rather than per principle', async () => {
    deckWith([{ principleId: 'P007_privacy', projectContext: 'Once is enough.' }]);
    commentPort.getPrinciples.mockResolvedValue(['Privacy', 'Transparency']);

    await service.addPrincipleCommentForIssue(installation, '42');

    expect(deckRepo.findPrinciplesByDeckId).toHaveBeenCalledTimes(1);
  });
});

// ─── Feature: one comment per principle ──────────────────────────────────

describe('Feature: Comment on every principle the work item carries', () => {
  let mappingRepo: jest.Mocked<IPrincipleWorkItemMappingRepository>;
  let commentPort: jest.Mocked<IWorkItemCommentPort>;
  let service: PrincipleCommentService;

  /**
   * A stateful stand-in for the repository: findByIssue has to see what a
   * previous save wrote, otherwise a second run cannot be told apart from a
   * first one — which is exactly what the duplicate-comment cases are about.
   */
  function statefulMappingRepo(): jest.Mocked<IPrincipleWorkItemMappingRepository> {
    const rows = new Map<string, PrincipleWorkItemMapping>();
    const key = (p: string, i: string, w: string) => `${p}#${i}#${w}`;
    const repo = createMockPrincipleWorkItemMappingRepository();

    repo.save.mockImplementation(async (entry: PrincipleWorkItemMapping) => {
      rows.set(key(entry.principleId, entry.installationId, entry.workItemId), entry);
    });
    repo.findByIssue.mockImplementation(async (p: string, i: string, w: string) =>
      rows.get(key(p, i, w)) ?? null,
    );
    repo.findAllByWorkItem.mockImplementation(async (i: string, w: string) =>
      [...rows.values()].filter(r => r.installationId === i && r.workItemId === w),
    );
    return repo;
  }

  beforeEach(() => {
    mappingRepo = statefulMappingRepo();
    commentPort = createMockWorkItemCommentPort();
    service = createService(mappingRepo, commentPort);
  });

  it('Given the work item carries two principles, When addPrincipleCommentForIssue is called, Then one comment is posted per principle', async () => {
    commentPort.getPrinciples.mockResolvedValue(['Transparency', 'Privacy']);
    commentPort.addComment.mockResolvedValueOnce('c-privacy').mockResolvedValueOnce('c-transparency');

    await service.addPrincipleCommentForIssue(installation, '42');

    expect(commentPort.addComment).toHaveBeenCalledTimes(2);
    expect(mappingRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ principleId: 'P006_transparency' }),
    );
    expect(mappingRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ principleId: 'P007_privacy' }),
    );
  });

  it('Given a comment exists for one of two principles, When addPrincipleCommentForIssue is called, Then the known one is updated and only the new one is posted', async () => {
    await mappingRepo.save({
      principleId: 'P007_privacy',
      installationId: 'inst-1',
      workItemId: '42',
      commentId: 'note-privacy',
    });
    commentPort.getPrinciples.mockResolvedValue(['Privacy', 'Justice']);

    await service.addPrincipleCommentForIssue(installation, '42');

    expect(commentPort.updateComment).toHaveBeenCalledWith(installation, '42', 'note-privacy', expect.any(String));
    expect(commentPort.addComment).toHaveBeenCalledTimes(1);
    expect(mappingRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ principleId: 'P008_justice' }),
    );
  });

  it('Given the comment order must not depend on the platform, When the same two principles arrive in reverse order, Then the comments are posted in the same order', async () => {
    commentPort.getPrinciples.mockResolvedValue(['Privacy', 'Transparency']);
    await service.addPrincipleCommentForIssue(installation, '42');
    const firstRun = mappingRepo.save.mock.calls.map(c => (c[0] as PrincipleWorkItemMapping).principleId);

    mappingRepo = statefulMappingRepo();
    commentPort = createMockWorkItemCommentPort();
    service = createService(mappingRepo, commentPort);
    commentPort.getPrinciples.mockResolvedValue(['Transparency', 'Privacy']);
    await service.addPrincipleCommentForIssue(installation, '42');
    const secondRun = mappingRepo.save.mock.calls.map(c => (c[0] as PrincipleWorkItemMapping).principleId);

    expect(secondRun).toEqual(firstRun);
  });
});

// ─── Feature: overlapping events ─────────────────────────────────────────

describe('Feature: Serialize overlapping events for one work item', () => {
  let mappingRepo: jest.Mocked<IPrincipleWorkItemMappingRepository>;
  let commentPort: jest.Mocked<IWorkItemCommentPort>;
  let service: PrincipleCommentService;

  function statefulMappingRepo(): jest.Mocked<IPrincipleWorkItemMappingRepository> {
    const rows = new Map<string, PrincipleWorkItemMapping>();
    const key = (p: string, i: string, w: string) => `${p}#${i}#${w}`;
    const repo = createMockPrincipleWorkItemMappingRepository();
    repo.save.mockImplementation(async (entry: PrincipleWorkItemMapping) => {
      rows.set(key(entry.principleId, entry.installationId, entry.workItemId), entry);
    });
    repo.findByIssue.mockImplementation(async (p: string, i: string, w: string) =>
      rows.get(key(p, i, w)) ?? null,
    );
    repo.findAllByWorkItem.mockImplementation(async (i: string, w: string) =>
      [...rows.values()].filter(r => r.installationId === i && r.workItemId === w),
    );
    return repo;
  }

  beforeEach(() => {
    mappingRepo = statefulMappingRepo();
    commentPort = createMockWorkItemCommentPort();
    service = createService(mappingRepo, commentPort);
  });

  it('Given two events for the same work item arrive at once, When both are handled, Then each principle is commented exactly once', async () => {
    // What GitHub sends when two principles are added in quick succession: the
    // first event still sees one value, the second already sees both.
    commentPort.getPrinciples
      .mockResolvedValueOnce(['Transparency'])
      .mockResolvedValueOnce(['Transparency', 'Privacy']);
    let n = 0;
    commentPort.addComment.mockImplementation(async () => `c-${++n}`);

    await Promise.all([
      service.addPrincipleCommentForIssue(installation, '42'),
      service.addPrincipleCommentForIssue(installation, '42'),
    ]);

    expect(commentPort.addComment).toHaveBeenCalledTimes(2);
    const commented = mappingRepo.save.mock.calls.map(c => (c[0] as PrincipleWorkItemMapping).principleId);
    expect(commented.sort()).toEqual(['P006_transparency', 'P007_privacy']);
  });

  it('Given a failing run, When the next event for the same work item arrives, Then it is still handled', async () => {
    commentPort.getPrinciples
      .mockRejectedValueOnce(new Error('GitHub API error: 503'))
      .mockResolvedValueOnce(['Privacy']);

    const first = service.addPrincipleCommentForIssue(installation, '42');
    const second = service.addPrincipleCommentForIssue(installation, '42');

    await expect(first).rejects.toThrow('503');
    await expect(second).resolves.toBeUndefined();
    expect(commentPort.addComment).toHaveBeenCalledTimes(1);
  });

  it('Given events for two different work items, When both are handled, Then they are not serialized against each other', async () => {
    commentPort.getPrinciples.mockResolvedValue(['Privacy']);
    let release: (() => void) | undefined;
    commentPort.addComment.mockImplementationOnce(
      () => new Promise<string>(resolve => { release = () => resolve('c-1'); }),
    );
    commentPort.addComment.mockResolvedValueOnce('c-2');

    const blocked = service.addPrincipleCommentForIssue(installation, '42');
    const other = service.addPrincipleCommentForIssue(installation, '43');

    // The second work item completes while the first is still waiting.
    await expect(other).resolves.toBeUndefined();
    release?.();
    await blocked;
  });
});

// ─── Feature: idempotency via existing mapping ────────────────────────────

describe('Feature: Update existing comment when mapping already exists', () => {
  let mappingRepo: jest.Mocked<IPrincipleWorkItemMappingRepository>;
  let commentPort: jest.Mocked<IWorkItemCommentPort>;
  let service: PrincipleCommentService;

  beforeEach(() => {
    mappingRepo = createMockPrincipleWorkItemMappingRepository();
    commentPort = createMockWorkItemCommentPort();
    service = createService(mappingRepo, commentPort);
  });

  it('Given a mapping already exists for this principle, installation, and work item, When addPrincipleCommentForIssue is called, Then updateComment is called instead of addComment', async () => {
    const existing: PrincipleWorkItemMapping = {
      principleId: 'P005_autonomy',
      installationId: 'inst-1',
      workItemId: '42',
      commentId: 'comment-old',
    };
    mappingRepo.findByIssue.mockResolvedValue(existing);

    commentPort.getPrinciples.mockResolvedValue(['Autonomy']);
    await service.addPrincipleCommentForIssue(installation, '42');

    expect(commentPort.updateComment).toHaveBeenCalledWith(
      installation,
      '42',
      'comment-old',
      expect.any(String),
    );
    expect(commentPort.addComment).not.toHaveBeenCalled();
    expect(mappingRepo.save).not.toHaveBeenCalled();
  });

  it('Given no existing mapping, When addPrincipleCommentForIssue is called, Then addComment is called and the returned commentId is persisted', async () => {
    mappingRepo.findByIssue.mockResolvedValue(null);
    commentPort.addComment.mockResolvedValue('note-777');

    commentPort.getPrinciples.mockResolvedValue(['Justice']);
    await service.addPrincipleCommentForIssue(installation, '55');

    expect(commentPort.addComment).toHaveBeenCalled();
    expect(mappingRepo.save).toHaveBeenCalledWith({
      principleId: 'P008_justice',
      installationId: 'inst-1',
      workItemId: '55',
      commentId: 'note-777',
    });
  });

  it('Given a mapping check is performed, When addPrincipleCommentForIssue is called, Then findByIssue is called with the correct principleId, installationId, and workItemId', async () => {
    commentPort.getPrinciples.mockResolvedValue(['Privacy']);
    await service.addPrincipleCommentForIssue(installation, '42');

    expect(mappingRepo.findByIssue).toHaveBeenCalledWith('P007_privacy', 'inst-1', '42');
  });
});

// ─── Feature: Remove stale principle comments ────────────────────────────

describe('Feature: Remove stale principle comments', () => {
  let mappingRepo: jest.Mocked<IPrincipleWorkItemMappingRepository>;
  let commentPort: jest.Mocked<IWorkItemCommentPort>;
  let service: PrincipleCommentService;

  beforeEach(() => {
    mappingRepo = createMockPrincipleWorkItemMappingRepository();
    commentPort = createMockWorkItemCommentPort();
    service = createService(mappingRepo, commentPort);
  });

  it('Given a principle label was removed, When addPrincipleCommentForIssue is called, Then the stale mapping and comment are deleted', async () => {
    mappingRepo.findAllByWorkItem.mockResolvedValue([
      { principleId: 'P005_autonomy', installationId: 'inst-1', workItemId: '42', commentId: 'comment-old' },
    ]);

    commentPort.getPrinciples.mockResolvedValue(['Privacy']);
    await service.addPrincipleCommentForIssue(installation, '42');

    expect(commentPort.deleteComment).toHaveBeenCalledWith(installation, '42', 'comment-old');
    expect(mappingRepo.delete).toHaveBeenCalledWith('P005_autonomy', 'inst-1', '42');
  });

  it('Given all principle labels were removed, When addPrincipleCommentForIssue is called with non-matching labels, Then all stale mappings are cleaned up', async () => {
    mappingRepo.findAllByWorkItem.mockResolvedValue([
      { principleId: 'P005_autonomy', installationId: 'inst-1', workItemId: '42', commentId: 'c-1' },
      { principleId: 'P007_privacy', installationId: 'inst-1', workItemId: '42', commentId: 'c-2' },
    ]);

    commentPort.getPrinciples.mockResolvedValue(['bug', 'enhancement']);
    await service.addPrincipleCommentForIssue(installation, '42');

    expect(commentPort.deleteComment).toHaveBeenCalledTimes(2);
    expect(mappingRepo.delete).toHaveBeenCalledTimes(2);
  });

  it('Given two principle labels and only one is removed, When addPrincipleCommentForIssue is called, Then only the removed mapping is deleted', async () => {
    mappingRepo.findAllByWorkItem.mockResolvedValue([
      { principleId: 'P005_autonomy', installationId: 'inst-1', workItemId: '42', commentId: 'c-auto' },
      { principleId: 'P007_privacy', installationId: 'inst-1', workItemId: '42', commentId: 'c-priv' },
    ]);

    // Keep Privacy (P007_privacy), remove Autonomy (P005_autonomy)
    commentPort.getPrinciples.mockResolvedValue(['Privacy']);
    await service.addPrincipleCommentForIssue(installation, '42');

    expect(commentPort.deleteComment).toHaveBeenCalledWith(installation, '42', 'c-auto');
    expect(commentPort.deleteComment).toHaveBeenCalledTimes(1);
    expect(mappingRepo.delete).toHaveBeenCalledWith('P005_autonomy', 'inst-1', '42');
    expect(mappingRepo.delete).toHaveBeenCalledTimes(1);
  });
});

// ─── Feature: label provisioning guard ───────────────────────────────────

describe('Feature: Ensure labels exist before posting a comment', () => {
  let mappingRepo: jest.Mocked<IPrincipleWorkItemMappingRepository>;
  let commentPort: jest.Mocked<IWorkItemCommentPort>;
  let service: PrincipleCommentService;

  beforeEach(() => {
    mappingRepo = createMockPrincipleWorkItemMappingRepository();
    commentPort = createMockWorkItemCommentPort();
    service = createService(mappingRepo, commentPort);
  });

  it('Given a matching label, When addPrincipleCommentForIssue is called, Then ensureLabels is invoked before addComment', async () => {
    commentPort.addComment.mockResolvedValue('c1');
    const callOrder: string[] = [];
    commentPort.ensureLabels.mockImplementation(async () => { callOrder.push('ensureLabels'); });
    commentPort.addComment.mockImplementation(async () => { callOrder.push('addComment'); return 'c1'; });

    commentPort.getPrinciples.mockResolvedValue(['Autonomy']);
    await service.addPrincipleCommentForIssue(installation, '42');

    expect(callOrder).toEqual(['ensureLabels', 'addComment']);
  });

  it('Given a matching label, When addPrincipleCommentForIssue is called, Then ensureLabels receives an array containing all known principle names across all locales', async () => {
    commentPort.addComment.mockResolvedValue('c1');

    commentPort.getPrinciples.mockResolvedValue(['Autonomy']);
    await service.addPrincipleCommentForIssue(installation, '42');

    const [, labelNames] = commentPort.ensureLabels.mock.calls[0];
    expect(labelNames).toEqual(expect.arrayContaining(['Autonomy', 'Privacy', 'Justice', 'Solidarity']));
    expect(labelNames).toEqual(expect.arrayContaining(['Autonomie', 'Datenschutz'])); // German locale
    expect(labelNames.length).toBeGreaterThan(9); // more than just English
  });

  it('Given ensureLabels throws, When addPrincipleCommentForIssue is called, Then the error propagates and no comment is posted', async () => {
    commentPort.ensureLabels.mockRejectedValue(new Error('GitLab unreachable'));

    commentPort.getPrinciples.mockResolvedValue(['Autonomy']);
    await expect(
      service.addPrincipleCommentForIssue(installation, '42'),
    ).rejects.toThrow('GitLab unreachable');

    expect(commentPort.addComment).not.toHaveBeenCalled();
  });
});

// ─── Feature: comment body content ───────────────────────────────────────

describe('Feature: Comment body contains correct principle content', () => {
  let mappingRepo: jest.Mocked<IPrincipleWorkItemMappingRepository>;
  let commentPort: jest.Mocked<IWorkItemCommentPort>;
  let service: PrincipleCommentService;

  beforeEach(() => {
    mappingRepo = createMockPrincipleWorkItemMappingRepository();
    commentPort = createMockWorkItemCommentPort();
    service = createService(mappingRepo, commentPort);
  });

  it('Given label "Privacy" (P007), When a comment is posted, Then the body contains the principle name, ID, and category', async () => {
    let capturedBody = '';
    commentPort.addComment.mockImplementation(async (_, __, body) => {
      capturedBody = body;
      return 'c1';
    });

    commentPort.getPrinciples.mockResolvedValue(['Privacy']);
    await service.addPrincipleCommentForIssue(installation, '42');

    expect(capturedBody).toContain('Privacy');
    expect(capturedBody).toContain('P007');
    expect(capturedBody).toContain('Dignity');
  });

  it('Given a work item with no project interpretation, When the comment body is built, Then the generic DARE guidance carries the text', async () => {
    let capturedBody = '';
    commentPort.addComment.mockImplementation(async (_, __, body) => {
      capturedBody = body;
      return 'c1';
    });

    commentPort.getPrinciples.mockResolvedValue(['Justice']);
    await service.addPrincipleCommentForIssue(installation, '42');

    expect(capturedBody).toContain('DARE guidance');
  });

  it('Given label "Beneficence" (P001), When the comment body is built, Then it lists the sibling principles P002 and P003 (same category)', async () => {
    let capturedBody = '';
    commentPort.addComment.mockImplementation(async (_, __, body) => {
      capturedBody = body;
      return 'c1';
    });

    commentPort.getPrinciples.mockResolvedValue(['Beneficence']);
    await service.addPrincipleCommentForIssue(installation, '42');

    expect(capturedBody).toContain('Sustainability');
    expect(capturedBody).toContain('Non-Maleficence');
  });

  it('Given label "Justice" (P008), When the comment body is built, Then only P009 (Solidarity) is listed as related — not P008 itself', async () => {
    let capturedBody = '';
    commentPort.addComment.mockImplementation(async (_, __, body) => {
      capturedBody = body;
      return 'c1';
    });

    commentPort.getPrinciples.mockResolvedValue(['Justice']);
    await service.addPrincipleCommentForIssue(installation, '42');

    const relatedSection = capturedBody.split('Related:')[1] ?? '';
    expect(relatedSection).toContain('Solidarity');
    expect(relatedSection).not.toContain('P008');
  });
});
