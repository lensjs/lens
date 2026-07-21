import { Injectable, OnModuleInit } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { logNodeMailerEntry } from '@lensjs/watchers';

type Mailer = ReturnType<typeof nodemailer.createTransport>;

@Injectable()
export class MailService implements OnModuleInit {
  private transporter!: Mailer;

  async onModuleInit() {
    // Ethereal test account — no real emails are sent, but they're captured.
    const testAccount = await nodemailer.createTestAccount();
    this.transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }

  async send(payload: Parameters<Mailer['sendMail']>[0]) {
    const message = await this.transporter.sendMail(payload);
    // Captured by the Lens mail watcher.
    logNodeMailerEntry('smtp', payload, message);
    return message;
  }
}
