import { supabase } from '../../lib/supabase.js';

export type NotificationType =
  | 'deadline_approaching'
  | 'vouch_needed'
  | 'quest_missed'
  | 'submission_resolved';

export type NotificationPayload = Record<string, unknown>;

export interface NotificationDelivery {
  readonly channel: 'in_app' | 'email';
  deliver(userId: string, type: NotificationType, payload: NotificationPayload): Promise<void>;
}

export class InAppDelivery implements NotificationDelivery {
  readonly channel = 'in_app' as const;

  async deliver(userId: string, type: NotificationType, payload: NotificationPayload): Promise<void> {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      payload,
    });
    if (error) throw new Error(error.message);
  }
}

/** Phase 2: wire to Resend / Supabase email. Stub logs only for now. */
export class EmailDelivery implements NotificationDelivery {
  readonly channel = 'email' as const;

  async deliver(userId: string, type: NotificationType, payload: NotificationPayload): Promise<void> {
    if (process.env.NOTIFICATION_EMAIL_ENABLED === 'true') {
      console.info('[email notification stub]', { userId, type, payload });
    }
  }
}

const inApp = new InAppDelivery();
const email = new EmailDelivery();

export const defaultDeliveries: NotificationDelivery[] = [inApp];

export function getDeliveries(): NotificationDelivery[] {
  const deliveries: NotificationDelivery[] = [inApp];
  if (process.env.NOTIFICATION_EMAIL_ENABLED === 'true') {
    deliveries.push(email);
  }
  return deliveries;
}
