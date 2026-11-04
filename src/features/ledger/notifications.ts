import { Schedule, formatUGX, newId } from './model';

export type LedgerNotice = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
  sourceId?: string;
};

export function createNotice(
  title: string,
  body: string,
  sourceId?: string,
): LedgerNotice {
  return {
    id: newId(),
    title,
    body,
    sourceId,
    createdAt: new Date().toISOString(),
  };
}

async function channel() {
  const { default: notifee } = await import('@notifee/react-native');
  return notifee.createChannel({
    id: 'ledger-activity',
    name: 'Ledger activity',
  });
}

export async function enableDeviceNotifications() {
  try {
    const { default: notifee, AuthorizationStatus } = await import(
      '@notifee/react-native'
    );
    const settings = await notifee.requestPermission();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

export async function deviceNotificationsEnabled() {
  try {
    const { default: notifee, AuthorizationStatus } = await import(
      '@notifee/react-native'
    );
    const settings = await notifee.getNotificationSettings();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

export async function displayDeviceNotice(notice: LedgerNotice) {
  if (!(await deviceNotificationsEnabled())) return;
  try {
    const { default: notifee } = await import('@notifee/react-native');
    const channelId = await channel();
    await notifee.displayNotification({
      id: notice.id,
      title: notice.title,
      body: notice.body,
      android: { channelId, pressAction: { id: 'default' } },
    });
  } catch {
    // The inbox entry remains available even when the device blocks alerts.
  }
}

export async function scheduleDeviceReminder(schedule: Schedule) {
  if (!(await deviceNotificationsEnabled())) return;
  const timestamp = new Date(schedule.nextAt).getTime();
  if (!Number.isFinite(timestamp) || timestamp <= Date.now()) return;
  try {
    const { default: notifee, TriggerType } = await import(
      '@notifee/react-native'
    );
    const channelId = await channel();
    await notifee.createTriggerNotification(
      {
        id: `schedule-${schedule.id}`,
        title: 'Scheduled ledger entry',
        body: `${schedule.note || schedule.kind} · ${formatUGX(
          schedule.amount,
        )}`,
        android: { channelId, pressAction: { id: 'default' } },
      },
      { type: TriggerType.TIMESTAMP, timestamp },
    );
  } catch {
    // Schedule data still remains in MMKV and the in-app activity view.
  }
}

export async function cancelDeviceReminder(id: string) {
  try {
    const { default: notifee } = await import('@notifee/react-native');
    await notifee.cancelNotification(`schedule-${id}`);
  } catch {}
}

export async function openDeviceNotificationSettings() {
  try {
    const { default: notifee } = await import('@notifee/react-native');
    await notifee.openNotificationSettings();
  } catch {}
}
