import { logNodeMailerEntry } from "@lensjs/watchers";
import { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

type NodeMailerTransporter = Transporter<
  SMTPTransport.SentMessageInfo,
  SMTPTransport.Options
>;

export async function sendEmail<T extends NodeMailerTransporter>(
  transporter: T,
  payload: Parameters<T["sendMail"]>[0],
): Promise<SMTPTransport.SentMessageInfo> {
  const message = await transporter.sendMail(payload);

  logNodeMailerEntry<T>(payload, message);

  return message;
}
