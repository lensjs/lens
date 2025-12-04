export const prepareApiUrl = (path: string) => {
  return `${import.meta.env.VITE_API_URL ?? ''}/${replaceTrailingSlash(path)}`;
};

const replaceTrailingSlash = (path: string) => {
  return path.replace(/^\/+|\/+$/g, "");
};
