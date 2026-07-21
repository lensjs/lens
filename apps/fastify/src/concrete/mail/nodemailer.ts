import { logNodeMailerEntry } from "@lensjs/watchers";
import type { Transporter } from "nodemailer";

export async function sendEmail(
  transporter: Transporter,
  payload: Parameters<Transporter["sendMail"]>[0],
) {
  const message = await transporter.sendMail(payload);

  logNodeMailerEntry("smtp", payload, message);

  return message;
}
