import { PrismaClient } from '../../generated/prisma/client';
import { FrameworkActivationService } from './FrameworkActivationService';
import {
  createMockNotificationPort,
  createTestPrismaClient,
  createTestInstallationRepo,
  createTestInstallation,
} from '../../test/helpers';

describe('FrameworkActivationService', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = createTestPrismaClient();
  });

  afterEach(async () => {
    await prisma.installation.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const setup = () => {
    const notificationPort = createMockNotificationPort();
    const installationRepo = createTestInstallationRepo(prisma);
    const service = new FrameworkActivationService(notificationPort, installationRepo);
    const installation = createTestInstallation();
    return { service, notificationPort, installationRepo, installation };
  };

  it('saves the installation and persists framework setup', async () => {
    const { service, notificationPort, installationRepo, installation } = setup();
    notificationPort.frameworkSetupExists.mockResolvedValue(false);

    await service.activate(installation);

    const saved = await installationRepo.findById(installation.installationId);
    expect(saved).toEqual(installation);
    expect(notificationPort.frameworkSetupExists).toHaveBeenCalledWith(installation, 'example/setup');
    expect(notificationPort.persistFrameworkSetup).toHaveBeenCalledWith(
      installation,
      'example/setup',
      '# Framework Setup\n',
    );
  });

  it('skips persistFrameworkSetup when setup already exists', async () => {
    const { service, notificationPort, installationRepo, installation } = setup();
    notificationPort.frameworkSetupExists.mockResolvedValue(true);

    await service.activate(installation);

    const saved = await installationRepo.findById(installation.installationId);
    expect(saved).toEqual(installation);
    expect(notificationPort.frameworkSetupExists).toHaveBeenCalledWith(installation, 'example/setup');
    expect(notificationPort.persistFrameworkSetup).not.toHaveBeenCalled();
  });
});
