import { getStore } from "../context/context";
import Watcher from "../core/watcher";
import { WatcherTypeEnum, type RequestEntry } from "../types/index";

type HiddenFields = {
  headers?: string[];
  bodyParams?: string[];
};

export default class RequestWatcher extends Watcher {
  name = WatcherTypeEnum.REQUEST;

  private static readonly DEFAULT_HIDDEN_HEADERS = ["Authorization", "Basic"];
  private static readonly DEFAULT_HIDDEN_BODY_PARAMS = [
    "password",
    "passwordConfirmation",
    "secret",
    "password_confirmation",
  ];

  async log(data: RequestEntry, hidden: HiddenFields = {}): Promise<void> {
    const headersToHide = (
      hidden.headers?.length
        ? hidden.headers
        : RequestWatcher.DEFAULT_HIDDEN_HEADERS
    ).map((header) => header.toLowerCase());

    const bodyParamsToHide = hidden.bodyParams?.length
      ? hidden.bodyParams
      : RequestWatcher.DEFAULT_HIDDEN_BODY_PARAMS;

    const payload = {
      id: data.request.id,
      type: this.name,
      minimal_data: {
        id: data.request.id,
        method: data.request.method,
        path: data.request.path,
        duration: data.request.duration,
        createdAt: data.request.createdAt,
        status: data.request.status,
      },
      data: {
        ...data.request,
        user: data.user,
        response: data.response || {},
      },
    };

    // normalize + hide headers and body
    payload.data.headers = this.hideSensitive(
      this.normalizeHeaders(payload.data.headers),
      headersToHide,
    );

    payload.data.response.headers = this.hideSensitive(
      this.normalizeHeaders(payload.data.response?.headers),
      headersToHide,
    );

    payload.data.body = this.hideSensitive(payload.data.body, bodyParamsToHide, false);

    await getStore().save(payload);
  }

  /**
   * Normalize headers: converts keys to lowercase.
   */
  protected normalizeHeaders(
    headers?: Record<string, string>,
  ): Record<string, string> {
    if (!headers || typeof headers !== "object") return {};
    return Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
    );
  }

  protected hideSensitive<T extends Record<string, any>>(
    obj?: T,
    keysToHide: string[] = [],
    isObjHeaders = true,
  ): T {
    if (!obj || typeof obj !== "object") {
      return (isObjHeaders ? {} : obj) as T;
    }

    const clone = { ...obj };
    for (const key of keysToHide) {
      if (key in clone) {
        (clone[key] as unknown) = "*******";
      }
    }
    return clone;
  }
}
