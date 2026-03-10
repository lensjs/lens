import { getStore, getUiConfig } from "../context/context";
import { WatcherTypeEnum } from "../types";
import type {
  ApiResponse,
  LensEntry as LensEntry,
  Paginator,
  RouteDefinitionHandler,
} from "../types";

export class ApiController {
  static async getRequests({ qs }: RouteDefinitionHandler) {
    return this.paginatedResponse(
      await getStore().getAllRequests(this.extractPaginationParams(qs)),
    );
  }

  static async getRequest({ params }: RouteDefinitionHandler) {
    const request = await getStore().find(WatcherTypeEnum.REQUEST, params.id);

    if (!request) {
      return this.notFoundResponse();
    }

    const queries = await getStore().allByRequestId(
      request.id,
      WatcherTypeEnum.QUERY,
    );

    const cacheEntries = await getStore().allByRequestId(
      request.id,
      WatcherTypeEnum.CACHE,
    );

    const exceptions = await getStore().allByRequestId(
      request.id,
      WatcherTypeEnum.EXCEPTION,
      false,
    );

    const emails = await getStore().allByRequestId(
      request.id,
      WatcherTypeEnum.MAIL,
      false,
    );

    return this.resourceResponse({
      request,
      queries,
      cacheEntries,
      exceptions,
      emails,
    });
  }

  static async getQueries({
    qs,
  }: RouteDefinitionHandler): Promise<ApiResponse<LensEntry[]>> {
    const queries = await getStore().getAllQueries(
      this.extractPaginationParams(qs),
    );

    return this.paginatedResponse(queries);
  }

  static async getQuery({
    params,
  }: RouteDefinitionHandler): Promise<ApiResponse<LensEntry>> {
    const query = await getStore().find(WatcherTypeEnum.QUERY, params.id);

    if (!query) {
      return this.notFoundResponse();
    }

    return this.resourceResponse(query);
  }

  static async getCacheEntries({ qs }: RouteDefinitionHandler) {
    return this.paginatedResponse(
      await getStore().getAllCacheEntries(this.extractPaginationParams(qs)),
    );
  }

  static async getCacheEntry({ params }: RouteDefinitionHandler) {
    const cacheEntry = await getStore().find(WatcherTypeEnum.CACHE, params.id);

    if (!cacheEntry) {
      return this.notFoundResponse();
    }

    return this.resourceResponse(cacheEntry);
  }

  static async getExceptions({ qs }: RouteDefinitionHandler) {
    return this.paginatedResponse(
      await getStore().getAllExceptions(this.extractPaginationParams(qs)),
    );
  }

  static async getException({ params }: RouteDefinitionHandler) {
    const exception = await getStore().find(
      WatcherTypeEnum.EXCEPTION,
      params.id,
    );

    if (!exception) {
      return this.notFoundResponse();
    }

    return this.resourceResponse(exception);
  }

  static async getEmails({ qs }: RouteDefinitionHandler) {
    return this.paginatedResponse(
      await getStore().getAllEmails(this.extractPaginationParams(qs)),
    );
  }

  static async getEmail({ params }: RouteDefinitionHandler) {
    const email = await getStore().find(WatcherTypeEnum.MAIL, params.id);

    if (!email) {
      return this.notFoundResponse();
    }

    return this.resourceResponse(email);
  }

  static async truncate() {
    await getStore().truncate();

    return this.baseResponse({}, 200, "All entries cleared");
  }

  static fetchUiConfig() {
    return getUiConfig();
  }

  private static extractPaginationParams(qs?: Record<string, any>) {
    if (!qs || Object.keys(qs).length === 0) {
      return { page: 1, perPage: 100 };
    }

    let page = Number(qs.page);
    let perPage = Number(qs.perPage);

    if (!Number.isInteger(perPage) || perPage > 100 || perPage < 5) {
      perPage = 100;
    }

    if (!Number.isInteger(page) || page < 1) {
      page = 1;
    }

    return { page, perPage };
  }

  private static resourceResponse<T extends Object>(data: T): ApiResponse<T> {
    return this.baseResponse<T>(data, 200, "Data fetched successfully");
  }

  private static notFoundResponse<T extends Object>(
    message = "Could not find the requested resource",
  ): ApiResponse<T> {
    return this.baseResponse<T>(null, 404, message);
  }

  public static paginatedResponse<T extends Object>(
    data: Paginator<T>,
  ): ApiResponse<T> {
    return this.baseResponse<T>(data, 200, "Data fetched successfully");
  }

  private static baseResponse<T extends Object>(
    data: Paginator<T> | T | null,
    status: number,
    message: string,
  ): ApiResponse<T> {
    if (!data) {
      return { status, message, data: null };
    }

    if ("meta" in data) {
      return {
        status,
        message,
        data: data.data,
        meta: data.meta,
      };
    }

    return { status, message, data };
  }
}
