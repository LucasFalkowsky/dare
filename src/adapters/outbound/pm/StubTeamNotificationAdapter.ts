import { Injectable } from '@nestjs/common';
import { ITeamNotificationPort } from '../../../domain/ports/outbound/ITeamNotificationPort';
import { Installation } from '../../../domain/model/Installation';

@Injectable()
export class StubTeamNotificationAdapter implements ITeamNotificationPort {

  async pinReminder(installation: Installation, workItemId: string, message: string): Promise<void> {
    console.log(`[StubTeamNotificationAdapter] pinReminder → ${installation.owner}/${installation.repo} #${workItemId}`);
    console.log(`  message: ${message}`);
  }

  async persistFrameworkSetup(installation: Installation, identifier: string, content: string): Promise<void> {
    console.log(`[StubTeamNotificationAdapter] persistFrameworkSetup → ${identifier}`);
    console.log(`  content: ${content}`);
  }

  async frameworkSetupExists(installation: Installation, identifier: string): Promise<boolean> {
    console.log(`[StubTeamNotificationAdapter] frameworkSetupExists → ${identifier} (returns false)`);
    return false;
  }
}
