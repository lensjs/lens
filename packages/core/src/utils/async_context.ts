import { AsyncLocalStorage } from "async_hooks";
import { ExceptionWatcher } from "../watchers";
import { constructErrorObject } from "./exception";

type LensContext = {
  requestId: string;
};

export const lensContext = new AsyncLocalStorage<LensContext>();
export const handleUncaughExceptions = (logger: ExceptionWatcher) => {
  process.on("uncaughtExceptionMonitor", async (err) => {
    await logger.log({
      ...constructErrorObject(err),
      requestId: lensContext.getStore()?.requestId,
    });
  });

  process.on("uncaughtException", async (err) => {
    await logger.log({
      ...constructErrorObject(err),
      requestId: lensContext.getStore()?.requestId,
    });
  });
};
