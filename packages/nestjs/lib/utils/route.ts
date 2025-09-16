import { RouteDefinition } from "@lensjs/core";
import { Controller, Get, Delete, Param, Query, Post } from "@nestjs/common";

function getMethodDecorator(path: string, method: RouteDefinition["method"]) {
  switch (method) {
    case "GET":
      return Get(path);
    case "POST":
      return Post(path);
    case "DELETE":
      return Delete(path);
    default:
      return Get(path);
  }
}
export function createDynamicController(routes: RouteDefinition[]) {
  @Controller()
  class DynamicLensController {}

  routes.forEach((route, index) => {
    const methodDecorator = getMethodDecorator(route.path, route.method);
    const methodName = `route_${index}`;
    const handler = async function (params: any, qs: any) {
      const result = await route.handler({ params, qs });

      return result;
    };

    Reflect.defineProperty(DynamicLensController.prototype, methodName, {
      value: handler,
    });

    methodDecorator(
      DynamicLensController.prototype,
      methodName,
      Object.getOwnPropertyDescriptor(
        DynamicLensController.prototype,
        methodName,
      ) as PropertyDescriptor,
    );

    Param()(DynamicLensController.prototype, methodName, 0);
    Query()(DynamicLensController.prototype, methodName, 1);
  });

  return DynamicLensController;
}
