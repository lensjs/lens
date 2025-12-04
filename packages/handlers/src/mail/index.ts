import { lensEmitter, MailEntry } from "@lensjs/core";

export const emitMailEvent = (payload: MailEntry) => {
  lensEmitter.emit("mail", payload);
};
