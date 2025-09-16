import { Catch, ArgumentsHost, ExceptionFilter } from "@nestjs/common";

@Catch()
export class LensExceptionReporter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
  }
}
