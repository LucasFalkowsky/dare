import { Injectable, Inject } from '@nestjs/common';
import { Installation } from '../model/Installation';
import { ITeamNotificationPort } from '../ports/outbound/ITeamNotificationPort';
import { IInstallationRepository } from '../ports/outbound/IInstallationRepository';
import { TEAM_NOTIFICATION_PORT, INSTALLATION_REPOSITORY } from '../ports/injection-tokens';

@Injectable()
export class FrameworkActivationService {
  constructor(
    @Inject(TEAM_NOTIFICATION_PORT) private notificationPort: ITeamNotificationPort,
    @Inject(INSTALLATION_REPOSITORY) private installationRepo: IInstallationRepository
  ) {}

  async activate(installation: Installation): Promise<void> {
    console.log(`[FrameworkActivationService] activating for ${installation.owner}/${installation.repo}`);

    await this.installationRepo.save(installation);

    const alreadySetUp = await this.notificationPort.frameworkSetupExists(
      installation,
      'example/setup'
    );

    if (!alreadySetUp) {
      await this.notificationPort.persistFrameworkSetup(
        installation,
        'example/setup',
        '# Framework Setup\n'
      );
    }
  }
}
