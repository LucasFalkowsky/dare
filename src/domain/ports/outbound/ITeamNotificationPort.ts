import { Installation } from '../../model/Installation';

export interface ITeamNotificationPort {
  pinReminder(installation: Installation, workItemId: string, message: string): Promise<void>;
  persistFrameworkSetup(installation: Installation, identifier: string, content: string): Promise<void>;
  frameworkSetupExists(installation: Installation, identifier: string): Promise<boolean>;
}
