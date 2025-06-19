export interface SmsMessage {
  to: string;
  body: string;
}

class PhoneService {
  async sendSms(message: SmsMessage): Promise<boolean> {
    console.log('sendSms stub', message);
    return true;
  }

  async makeCall(number: string): Promise<boolean> {
    console.log('makeCall stub', number);
    return true;
  }

  async getSignalStrength(): Promise<number> {
    console.log('getSignalStrength stub');
    return 0;
  }
}

export const phoneService = new PhoneService();
