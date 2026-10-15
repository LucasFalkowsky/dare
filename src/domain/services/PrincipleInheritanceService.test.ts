import { PrincipleInheritanceService } from './PrincipleInheritanceService';
import { IPrincipleInheritancePort } from '../ports/outbound/IPrincipleInheritancePort';
import { IWorkItemPrincipleSnapshotRepository } from '../ports/outbound/IWorkItemPrincipleSnapshotRepository';
import { createTestInstallation } from '../../test/helpers';

const INSTALLATION = createTestInstallation({ platform: 'github', owner: 'my-org', repo: 'my-repo' });

/**
 * In-memory stand-ins for the platform and the snapshot store, so the tests
 * state the inheritance rules rather than HTTP or SQL behaviour.
 */
function createFakePort(opts: {
  principles?: Record<string, string[]>;
  children?: Record<string, string[]>;
  supported?: boolean;
}) {
  const principles: Record<string, string[]> = { ...(opts.principles ?? {}) };
  const children: Record<string, string[]> = { ...(opts.children ?? {}) };

  const port: jest.Mocked<IPrincipleInheritancePort> = {
    supported: opts.supported ?? true,
    getPrinciples: jest.fn(async (_i, id: string) => [...(principles[id] ?? [])]),
    addPrinciples: jest.fn(async (_i, id: string, names: string[]) => {
      principles[id] = [...(principles[id] ?? []), ...names];
    }),
    findChildWorkItems: jest.fn(async (_i, id: string) => [...(children[id] ?? [])]),
  };

  return { port, principles };
}

function createFakeSnapshotRepo(initial: Record<string, string[]> = {}) {
  const store: Record<string, string[]> = { ...initial };

  const repo: jest.Mocked<IWorkItemPrincipleSnapshotRepository> = {
    find: jest.fn(async (_inst: string, id: string) =>
      id in store ? [...store[id]] : null,
    ),
    save: jest.fn(async (_inst: string, id: string, names: string[]) => {
      store[id] = [...names];
    }),
  };

  return { repo, store };
}

// ─── Trigger 1: a child is attached to a parent ──────────────────────────

describe('PrincipleInheritanceService - inheritOnAttach', () => {
  it('Given a parent carrying two principles, When a child is attached, Then the child receives both', async () => {
    const { port, principles } = createFakePort({
      principles: { '1': ['Autonomy', 'Privacy'], '2': [] },
    });
    const { repo } = createFakeSnapshotRepo();
    const service = new PrincipleInheritanceService(port, repo);

    await service.inheritOnAttach(INSTALLATION, '1', '2');

    expect(principles['2']).toEqual(['Autonomy', 'Privacy']);
  });

  it('Given the child already carries one of the principles, When it is attached, Then only the missing one is added', async () => {
    const { port } = createFakePort({
      principles: { '1': ['Autonomy', 'Privacy'], '2': ['Autonomy'] },
    });
    const { repo } = createFakeSnapshotRepo();
    const service = new PrincipleInheritanceService(port, repo);

    await service.inheritOnAttach(INSTALLATION, '1', '2');

    expect(port.addPrinciples).toHaveBeenCalledWith(INSTALLATION, '2', ['Privacy']);
  });

  it('Given a parent with no principles, When a child is attached, Then nothing is written to the child', async () => {
    const { port } = createFakePort({ principles: { '1': [], '2': [] } });
    const { repo } = createFakeSnapshotRepo();
    const service = new PrincipleInheritanceService(port, repo);

    await service.inheritOnAttach(INSTALLATION, '1', '2');

    expect(port.addPrinciples).not.toHaveBeenCalled();
  });

  it('Given a parent whose principles were never recorded, When a child is attached, Then the parent snapshot is recorded too', async () => {
    const { port } = createFakePort({ principles: { '1': ['Autonomy'], '2': [] } });
    const { repo, store } = createFakeSnapshotRepo();
    const service = new PrincipleInheritanceService(port, repo);

    await service.inheritOnAttach(INSTALLATION, '1', '2');

    // Without this the parent's next change would count everything as new.
    expect(store['1']).toEqual(['Autonomy']);
  });

  it('Given the attached child has children of its own, When it is attached, Then the whole subtree inherits', async () => {
    const { port, principles } = createFakePort({
      principles: { '1': ['Autonomy'], '2': [], '3': [], '4': [] },
      children: { '2': ['3'], '3': ['4'] },
    });
    const { repo } = createFakeSnapshotRepo();
    const service = new PrincipleInheritanceService(port, repo);

    await service.inheritOnAttach(INSTALLATION, '1', '2');

    expect(principles['2']).toEqual(['Autonomy']);
    expect(principles['3']).toEqual(['Autonomy']);
    expect(principles['4']).toEqual(['Autonomy']);
  });

  it('Given foreign labels on the parent, When a child is attached, Then only DARE principles are inherited', async () => {
    const { port } = createFakePort({
      principles: { '1': ['Autonomy', 'bug', 'needs-triage'], '2': [] },
    });
    const { repo } = createFakeSnapshotRepo();
    const service = new PrincipleInheritanceService(port, repo);

    await service.inheritOnAttach(INSTALLATION, '1', '2');

    expect(port.addPrinciples).toHaveBeenCalledWith(INSTALLATION, '2', ['Autonomy']);
  });

  it('Given principle names in another locale, When a child is attached, Then they are recognised and inherited', async () => {
    const { port } = createFakePort({
      principles: { '1': ['Autonomie', 'Datenschutz'], '2': [] },
    });
    const { repo } = createFakeSnapshotRepo();
    const service = new PrincipleInheritanceService(port, repo);

    await service.inheritOnAttach(INSTALLATION, '1', '2');

    expect(port.addPrinciples).toHaveBeenCalledWith(INSTALLATION, '2', ['Autonomie', 'Datenschutz']);
  });
});

// ─── Trigger 2: a principle is added to a parent ─────────────────────────

describe('PrincipleInheritanceService - propagateAddedPrinciples', () => {
  it('Given a parent gained one principle since the last snapshot, When the change is handled, Then only that one reaches the child', async () => {
    const { port } = createFakePort({
      principles: { '1': ['Autonomy', 'Privacy'], '2': [] },
      children: { '1': ['2'] },
    });
    const { repo } = createFakeSnapshotRepo({ '1': ['Autonomy'] });
    const service = new PrincipleInheritanceService(port, repo);

    await service.propagateAddedPrinciples(INSTALLATION, '1');

    expect(port.addPrinciples).toHaveBeenCalledWith(INSTALLATION, '2', ['Privacy']);
    expect(port.addPrinciples).toHaveBeenCalledTimes(1);
  });

  it('Given a principle the user removed from the child, When an unrelated principle is added to the parent, Then the removed one is not restored', async () => {
    const { port, principles } = createFakePort({
      // The child once had 'Autonomy' and the user took it off again.
      principles: { '1': ['Autonomy', 'Privacy'], '2': [] },
      children: { '1': ['2'] },
    });
    const { repo } = createFakeSnapshotRepo({ '1': ['Autonomy'] });
    const service = new PrincipleInheritanceService(port, repo);

    await service.propagateAddedPrinciples(INSTALLATION, '1');

    expect(principles['2']).toEqual(['Privacy']);
    expect(principles['2']).not.toContain('Autonomy');
  });

  it('Given nothing changed since the last snapshot, When the change is handled, Then no child is touched', async () => {
    const { port } = createFakePort({
      principles: { '1': ['Autonomy'], '2': [] },
      children: { '1': ['2'] },
    });
    const { repo } = createFakeSnapshotRepo({ '1': ['Autonomy'] });
    const service = new PrincipleInheritanceService(port, repo);

    await service.propagateAddedPrinciples(INSTALLATION, '1');

    expect(port.addPrinciples).not.toHaveBeenCalled();
    expect(port.findChildWorkItems).not.toHaveBeenCalled();
  });

  it('Given a principle was removed from the parent, When the change is handled, Then nothing is propagated and nothing is removed from the child', async () => {
    const { port, principles } = createFakePort({
      principles: { '1': ['Autonomy'], '2': ['Autonomy', 'Privacy'] },
      children: { '1': ['2'] },
    });
    const { repo } = createFakeSnapshotRepo({ '1': ['Autonomy', 'Privacy'] });
    const service = new PrincipleInheritanceService(port, repo);

    await service.propagateAddedPrinciples(INSTALLATION, '1');

    expect(port.addPrinciples).not.toHaveBeenCalled();
    expect(principles['2']).toEqual(['Autonomy', 'Privacy']);
  });

  it('Given a principle was removed from the parent and later added again, When each change is handled, Then the re-add counts as new', async () => {
    const { port, principles } = createFakePort({
      principles: { '1': ['Autonomy'], '2': [] },
      children: { '1': ['2'] },
    });
    const { repo } = createFakeSnapshotRepo({ '1': ['Autonomy', 'Privacy'] });
    const service = new PrincipleInheritanceService(port, repo);

    // 'Privacy' was removed from the parent: nothing propagates, but the
    // snapshot shrinks to ['Autonomy'].
    await service.propagateAddedPrinciples(INSTALLATION, '1');
    expect(port.addPrinciples).not.toHaveBeenCalled();

    // Added again → now it is new relative to the recorded state.
    principles['1'] = ['Autonomy', 'Privacy'];
    await service.propagateAddedPrinciples(INSTALLATION, '1');

    expect(port.addPrinciples).toHaveBeenCalledWith(INSTALLATION, '2', ['Privacy']);
  });

  it('Given a work item never seen before, When a change is handled, Then everything it carries counts as new', async () => {
    const { port } = createFakePort({
      principles: { '1': ['Autonomy'], '2': [] },
      children: { '1': ['2'] },
    });
    const { repo } = createFakeSnapshotRepo(); // no snapshot at all
    const service = new PrincipleInheritanceService(port, repo);

    await service.propagateAddedPrinciples(INSTALLATION, '1');

    expect(port.addPrinciples).toHaveBeenCalledWith(INSTALLATION, '2', ['Autonomy']);
  });

  it('Given a recorded empty snapshot, When a principle is added, Then it is treated as new', async () => {
    const { port } = createFakePort({
      principles: { '1': ['Autonomy'], '2': [] },
      children: { '1': ['2'] },
    });
    const { repo } = createFakeSnapshotRepo({ '1': [] });
    const service = new PrincipleInheritanceService(port, repo);

    await service.propagateAddedPrinciples(INSTALLATION, '1');

    expect(port.addPrinciples).toHaveBeenCalledWith(INSTALLATION, '2', ['Autonomy']);
  });

  it('Given a three-level hierarchy, When a principle is added at the top, Then child and grandchild both receive it', async () => {
    const { port, principles } = createFakePort({
      principles: { '1': ['Autonomy', 'Privacy'], '2': [], '3': [] },
      children: { '1': ['2'], '2': ['3'] },
    });
    const { repo } = createFakeSnapshotRepo({ '1': ['Autonomy'] });
    const service = new PrincipleInheritanceService(port, repo);

    await service.propagateAddedPrinciples(INSTALLATION, '1');

    expect(principles['2']).toEqual(['Privacy']);
    expect(principles['3']).toEqual(['Privacy']);
  });

  it('Given a child that already has the new principle but a grandchild that does not, When the change is handled, Then the grandchild still receives it', async () => {
    const { port, principles } = createFakePort({
      principles: { '1': ['Autonomy', 'Privacy'], '2': ['Privacy'], '3': [] },
      children: { '1': ['2'], '2': ['3'] },
    });
    const { repo } = createFakeSnapshotRepo({ '1': ['Autonomy'] });
    const service = new PrincipleInheritanceService(port, repo);

    await service.propagateAddedPrinciples(INSTALLATION, '1');

    expect(principles['3']).toEqual(['Privacy']);
  });

  it('Given several children, When a principle is added to the parent, Then every child receives it', async () => {
    const { port, principles } = createFakePort({
      principles: { '1': ['Privacy'], '2': [], '3': [], '4': [] },
      children: { '1': ['2', '3', '4'] },
    });
    const { repo } = createFakeSnapshotRepo({ '1': [] });
    const service = new PrincipleInheritanceService(port, repo);

    await service.propagateAddedPrinciples(INSTALLATION, '1');

    expect(principles['2']).toEqual(['Privacy']);
    expect(principles['3']).toEqual(['Privacy']);
    expect(principles['4']).toEqual(['Privacy']);
  });

  it('Given a cycle in the hierarchy, When a principle is propagated, Then the walk terminates and each item is written at most once', async () => {
    const { port } = createFakePort({
      principles: { '1': ['Privacy'], '2': [], '3': [] },
      children: { '1': ['2'], '2': ['3'], '3': ['2'] }, // 2 → 3 → 2
    });
    const { repo } = createFakeSnapshotRepo({ '1': [] });
    const service = new PrincipleInheritanceService(port, repo);

    await service.propagateAddedPrinciples(INSTALLATION, '1');

    expect(port.addPrinciples).toHaveBeenCalledTimes(2);
  });

  it('Given a child pointing back at the changed parent, When a principle is propagated, Then the parent is not revisited', async () => {
    const { port } = createFakePort({
      principles: { '1': ['Privacy'], '2': [] },
      children: { '1': ['2'], '2': ['1'] },
    });
    const { repo } = createFakeSnapshotRepo({ '1': [] });
    const service = new PrincipleInheritanceService(port, repo);

    await service.propagateAddedPrinciples(INSTALLATION, '1');

    expect(port.addPrinciples).toHaveBeenCalledTimes(1);
    expect(port.addPrinciples).toHaveBeenCalledWith(INSTALLATION, '2', ['Privacy']);
  });

  it('Given a foreign label was added to the parent, When the change is handled, Then nothing is propagated', async () => {
    const { port } = createFakePort({
      principles: { '1': ['Autonomy', 'bug'], '2': [] },
      children: { '1': ['2'] },
    });
    const { repo } = createFakeSnapshotRepo({ '1': ['Autonomy'] });
    const service = new PrincipleInheritanceService(port, repo);

    await service.propagateAddedPrinciples(INSTALLATION, '1');

    expect(port.addPrinciples).not.toHaveBeenCalled();
  });

  it('Given a parent without children, When a principle is added, Then the snapshot is still updated', async () => {
    const { port } = createFakePort({ principles: { '1': ['Autonomy', 'Privacy'] } });
    const { repo, store } = createFakeSnapshotRepo({ '1': ['Autonomy'] });
    const service = new PrincipleInheritanceService(port, repo);

    await service.propagateAddedPrinciples(INSTALLATION, '1');

    expect(store['1']).toEqual(['Autonomy', 'Privacy']);
  });

  it('Given a child received a principle, When the child later fires its own change, Then it does not propagate again', async () => {
    const { port } = createFakePort({
      principles: { '1': ['Privacy'], '2': [], '3': [] },
      children: { '1': ['2'], '2': ['3'] },
    });
    const { repo } = createFakeSnapshotRepo({ '1': [] });
    const service = new PrincipleInheritanceService(port, repo);

    await service.propagateAddedPrinciples(INSTALLATION, '1');
    const callsAfterFirst = port.addPrinciples.mock.calls.length;

    // The child's snapshot was recorded when it was written, so its own event
    // sees no delta.
    await service.propagateAddedPrinciples(INSTALLATION, '2');

    expect(port.addPrinciples.mock.calls.length).toBe(callsAfterFirst);
  });
});

// ─── unsupported platform ────────────────────────────────────────────────

describe('PrincipleInheritanceService - unsupported platform', () => {
  it('Given the platform does not support inheritance, When a child is attached, Then the platform is never queried', async () => {
    const { port } = createFakePort({
      supported: false,
      principles: { '1': ['Autonomy'], '2': [] },
    });
    const { repo } = createFakeSnapshotRepo();
    const service = new PrincipleInheritanceService(port, repo);

    await service.inheritOnAttach(INSTALLATION, '1', '2');

    expect(port.getPrinciples).not.toHaveBeenCalled();
    expect(port.addPrinciples).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('Given the platform does not support inheritance, When principles change, Then the platform is never queried', async () => {
    const { port } = createFakePort({
      supported: false,
      principles: { '1': ['Autonomy'] },
      children: { '1': ['2'] },
    });
    const { repo } = createFakeSnapshotRepo();
    const service = new PrincipleInheritanceService(port, repo);

    await service.propagateAddedPrinciples(INSTALLATION, '1');

    expect(port.getPrinciples).not.toHaveBeenCalled();
    expect(port.findChildWorkItems).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });
});
