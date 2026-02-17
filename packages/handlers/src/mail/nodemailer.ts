import { lensEmitter, MailAddress } from "@lensjs/core";
import { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import addressParser from "nodemailer/lib/addressparser";

type NodeMailerTransporter = Transporter<
  SMTPTransport.SentMessageInfo,
  SMTPTransport.Options
>;

type AddressInput =
  | string
  | { name?: string; address: string }
  | Array<string | { name?: string; address: string }>
  | null
  | undefined;

export function normalizeAddresses(input: AddressInput): MailAddress[] {
  if (!input) return [{ name: "", email: "" }];

  let inputString: string;
  if (Array.isArray(input)) {
    inputString = input
      .map((addr) =>
        typeof addr === "string"
          ? addr
          : `"${addr.name ?? ""}" <${addr.address}>`,
      )
      .join(", ");
  } else if (typeof input === "object") {
    inputString = `"${input.name ?? ""}" <${input.address}>`;
  } else {
    inputString = input;
  }

  const parsed = addressParser(inputString, { flatten: true });

  return (
    parsed.map((addr) => ({
      name: addr.name,
      email: addr.address,
    })) ?? [{ name: "", email: "" }]
  );
}

function parseStatus(status: string): "sent" | "failed" {
  const statusArr = status.split(" ");
  const code = parseInt(statusArr[0] as string);

  return code >= 200 && code < 300 ? "sent" : "failed";
}

export async function logNodeMailerEntry<T extends NodeMailerTransporter>(
  payload: Parameters<T["sendMail"]>[0],
  message: SMTPTransport.SentMessageInfo,
) {
  const from = normalizeAddresses(payload.from)[0] as MailAddress;
  lensEmitter.emit("mail", {
    from,
    to: normalizeAddresses(payload.to),
    cc: normalizeAddresses(payload.cc),
    bcc: normalizeAddresses(payload.bcc),
    replyTo: normalizeAddresses(payload.replyTo),
    subject: payload.subject ?? "",
    headers: payload.headers ?? {},
    sentAt: "",
    attachments: [],
    mailer: "",
    driver: "",
    status: parseStatus(message.response),
    fullStatus: message.response,
  });
  return message;
}
