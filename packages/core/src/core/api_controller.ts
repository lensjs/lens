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

    const httpEntries = await getStore().allByRequestId(
      request.id,
      WatcherTypeEnum.HTTP,
    );

    const eventEntries = await getStore().allByRequestId(
      request.id,
      WatcherTypeEnum.EVENT,
    );

    const redisEntries = await getStore().allByRequestId(
      request.id,
      WatcherTypeEnum.REDIS,
    );

    const fcmEntries = await getStore().allByRequestId(
      request.id,
      WatcherTypeEnum.FCM,
    );

    return this.resourceResponse({
      request,
      queries,
      cacheEntries,
      exceptions,
      emails,
      httpEntries,
      eventEntries,
      redisEntries,
      fcmEntries,
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

  static async getEventEntries({ qs }: RouteDefinitionHandler) {
    return this.paginatedResponse(
      await getStore().paginate<Omit<LensEntry, "data">[]>(
        WatcherTypeEnum.EVENT,
        this.extractPaginationParams(qs),
        false,
      ),
    );
  }

  static async getEventEntry({ params }: RouteDefinitionHandler) {
    const entry = await getStore().find(WatcherTypeEnum.EVENT, params.id);

    if (!entry) {
      return this.notFoundResponse();
    }

    return this.resourceResponse(entry);
  }

  static async getHttpEntries({ qs }: RouteDefinitionHandler) {
    return this.paginatedResponse(
      await getStore().paginate<Omit<LensEntry, "data">[]>(
        WatcherTypeEnum.HTTP,
        this.extractPaginationParams(qs),
        false,
      ),
    );
  }

  static async getHttpEntry({ params }: RouteDefinitionHandler) {
    const entry = await getStore().find(WatcherTypeEnum.HTTP, params.id);

    if (!entry) {
      return this.notFoundResponse();
    }

    return this.resourceResponse(entry);
  }

  static async getRedisEntries({ qs }: RouteDefinitionHandler) {
    return this.paginatedResponse(
      await getStore().paginate<Omit<LensEntry, "data">[]>(
        WatcherTypeEnum.REDIS,
        this.extractPaginationParams(qs),
        false,
      ),
    );
  }

  static async getRedisEntry({ params }: RouteDefinitionHandler) {
    const entry = await getStore().find(WatcherTypeEnum.REDIS, params.id);

    if (!entry) {
      return this.notFoundResponse();
    }

    return this.resourceResponse(entry);
  }

  static async getFcmEntries({ qs }: RouteDefinitionHandler) {
    return this.paginatedResponse(
      await getStore().paginate<Omit<LensEntry, "data">[]>(
        WatcherTypeEnum.FCM,
        this.extractPaginationParams(qs),
        false,
      ),
    );
  }

  static async getFcmEntry({ params }: RouteDefinitionHandler) {
    const entry = await getStore().find(WatcherTypeEnum.FCM, params.id);

    if (!entry) {
      return this.notFoundResponse();
    }

    return this.resourceResponse(entry);
  }

  static async getStream({ qs }: RouteDefinitionHandler) {
    return this.paginatedResponse(
      await getStore().latest<Omit<LensEntry, "data">[]>(
        this.extractPaginationParams(qs),
        false,
      ),
    );
  }

  static async truncate() {
    await getStore().truncate();

    return this.baseResponse({}, 200, "All entries cleared");
  }

  static fetchUiConfig() {
    return getUiConfig();
  }

  private static extractPaginationParams(qs?: Record<string, any>) {
    let perPage = Number(qs?.perPage);
    if (!Number.isInteger(perPage) || perPage > 100 || perPage < 5) {
      perPage = 100;
    }

    const toCursor = (value: unknown) => {
      const n = Number(value);
      return Number.isInteger(n) && n > 0 ? n : undefined;
    };

    return {
      cursor: toCursor(qs?.cursor),
      after: toCursor(qs?.after),
      perPage,
    };
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
