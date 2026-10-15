import { WorkItemReminderService } from './WorkItemReminderService';
import { createMockNotificationPort, createTestInstallation } from '../../test/helpers';

describe('WorkItemReminderService', () => {
  it('calls pinReminder with correct parameters', async () => {
    const notificationPort = createMockNotificationPort();
    const service = new WorkItemReminderService(notificationPort);
    const installation = createTestInstallation();

    await service.remindOnWorkItemOpened(installation, 'WI-42');

    expect(notificationPort.pinReminder).toHaveBeenCalledWith(
      installation,
      'WI-42',
      'Example reminder pinned by DARE.',
    );
  });
});
