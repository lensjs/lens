import {
  ExceptionWatcher,
  lensContext,
  lensExceptionUtils,
} from "@lensjs/core";
import { Catch, ArgumentsHost, HttpException } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";

@Catch()
export class LensExceptionFilter extends BaseExceptionFilter {
  constructor(
    appRef: any,
    private readonly enabled: boolean,
    private readonly watcher?: ExceptionWatcher,
  ) {
    super(appRef);
  }

  catch(exception: HttpException, host: ArgumentsHost): void {
    // the .lensContext is available in fastify adapter
    const context =
      host.switchToHttp().getRequest().lensContext ?? lensContext.getStore();

    if (this.enabled && this.watcher && host.getType() === "http") {
      this.watcher.log({
        ...lensExceptionUtils.constructErrorObject(exception),
        requestId: context?.requestId,
      });
    }

    super.catch(exception, host);
  }
}
