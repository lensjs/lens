import Container from "./container";
import type { LensNotifier } from "../core/notifier";

export const getStore = () => {
  return Container.make("store");
};

export const getUiConfig = () => {
  return Container.make("uiConfig");
};

/** The bound outbound notifier, or null when alerting is not configured. */
export const getNotifier = (): LensNotifier | null => {
  return Container.has("notifier") ? Container.make("notifier") : null;
};
