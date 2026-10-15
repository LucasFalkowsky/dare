import { StubPrincipleInheritanceAdapter } from './StubPrincipleInheritanceAdapter';
import { createTestInstallation } from '../../../test/helpers';

const INSTALLATION = createTestInstallation({ platform: 'gitlab', owner: 'my-group', repo: 'my-project' });

describe('StubPrincipleInheritanceAdapter', () => {
  it('Given the stub, When supported is read, Then inheritance is reported as unavailable', () => {
    expect(new StubPrincipleInheritanceAdapter().supported).toBe(false);
  });

  it('Given a caller that ignores the flag, When getPrinciples is called, Then it fails loudly instead of returning nothing', async () => {
    await expect(new StubPrincipleInheritanceAdapter().getPrinciples(INSTALLATION, '42'))
      .rejects.toThrow('not available on GitLab');
  });

  it('Given a caller that ignores the flag, When addPrinciples is called, Then it fails loudly', async () => {
    await expect(new StubPrincipleInheritanceAdapter().addPrinciples(INSTALLATION, '42'))
      .rejects.toThrow('not available on GitLab');
  });

  it('Given a caller that ignores the flag, When findChildWorkItems is called, Then it fails loudly', async () => {
    await expect(new StubPrincipleInheritanceAdapter().findChildWorkItems(INSTALLATION, '42'))
      .rejects.toThrow('not available on GitLab');
  });
});
