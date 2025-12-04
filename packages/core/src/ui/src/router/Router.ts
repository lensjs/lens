import { useRoutes, type RouteObject } from "react-router-dom";
import { getRoutes } from "./routes";
import type { LensConfig } from "../types";

const Router = ({config}: {config: LensConfig}) => {
  const allRoutes: RouteObject[] = getRoutes(config);

  return useRoutes([...allRoutes]);
};

export default Router;
