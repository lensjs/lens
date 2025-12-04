import Container from "./container";

export const getStore = () => {
  return Container.make("store");
};

export const getUiConfig = () => {
  return Container.make("uiConfig");
};
