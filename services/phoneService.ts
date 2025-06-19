export interface SmsMessage {
  to: string;
  body: string;
}

class PhoneService {
  async sendSms(message: SmsMessage): Promise<boolean> {
    try {
      const res = await fetch('/phonebridge/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      return res.ok;
    } catch (err) {
      console.error('sendSms failed', err);
      return false;
    }
  }

  async makeCall(number: string): Promise<boolean> {
    try {
      const res = await fetch('/phonebridge/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number }),
      });
      return res.ok;
    } catch (err) {
      console.error('makeCall failed', err);
      return false;
    }
  }

  async getSignalStrength(): Promise<number> {
    try {
      const res = await fetch('/phonebridge/status');
      if (!res.ok) return 0;
      const data = await res.json();
      return data.signalStrength || 0;
    } catch (err) {
      console.error('getSignalStrength failed', err);
      return 0;
    }
  }
}

export const phoneService = new PhoneService();
