import { ArrowRightLeft, Bug, Database, Layers } from "lucide-react";
import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import type { LensConfig } from "../../types";

const RequestsContainer = lazy(
  () => import("../../containers/requests/RequestsContainer"),
);
const QueriesContainer = lazy(
  () => import("../../containers/queries/QueriesContainer"),
);
const RequestDetailsContainer = lazy(
  () => import("../../containers/requests/RequestDetailsContainer"),
);
const QueryDetailsContainer = lazy(
  () => import("../../containers/queries/QueryDetailsContainer"),
);
const CacheEntryContainer = lazy(
  () => import("../../containers/cacheEntries/CacheEntryContainer"),
);
const CacheEntryDetailsContainer = lazy(
  () => import("../../containers/cacheEntries/CacheEntryDetailsContainer"),
);
const ExceptionsContainer = lazy(
  () => import("../../containers/exceptions/ExceptionContainer"),
);
const ExceptionDetailsContainer = lazy(
  () => import("../../containers/exceptions/ExceptionDetailsContainer"),
);

export function getRoutesPaths(config: LensConfig) {
  return {
    REQUESTS: `${config.path}/requests`,
    QUERIES: `${config.path}/queries`,
    REQUEST_DETAILS: `${config.path}/requests/:requestId`,
    QUERY_DETAILS: `${config.path}/queries/:queryId`,
    CACHE_ENTRIES: `${config.path}/cache`,
    CACHE_ENTRY_DETAILS: `${config.path}/cache/:cacheId`,
    EXCEPTIONS: `${config.path}/exceptions`,
    EXCEPTION_DETAILS: `${config.path}/exceptions/:exceptionId`,
  };
}

export function getSidebarRoutes(config: LensConfig) {
  const paths = getRoutesPaths(config);

  return [
    {
      path: paths.REQUESTS,
      label: "Requests",
      icon: ArrowRightLeft,
    },
    {
      path: paths.QUERIES,
      label: "Queries",
      icon: Database,
    },
    {
      path: paths.CACHE_ENTRIES,
      label: "Cache",
      icon: Layers,
    },
    {
      path: paths.EXCEPTIONS,
      label: "Exceptions",
      icon: Bug,
    },
  ];
}

export function getRoutes(config: LensConfig): RouteObject[] {
  const paths = getRoutesPaths(config);

  return [
    {
      path: "/",
      element: <Navigate to={paths.REQUESTS} replace />,
    },
    {
      path: config.path,
      element: <Layout />,
      children: [
        {
          index: true,
          element: <Navigate to="requests" replace />,
        },
        {
          path: "requests",
          element: <RequestsContainer />,
        },
        {
          path: "requests/:id",
          element: <RequestDetailsContainer />,
        },
        {
          path: "queries",
          element: <QueriesContainer />,
        },
        {
          path: "queries/:id",
          element: <QueryDetailsContainer />,
        },
        {
          path: "cache",
          element: <CacheEntryContainer />,
        },
        {
          path: "cache/:id",
          element: <CacheEntryDetailsContainer />,
        },
        {
          path: "exceptions",
          element: <ExceptionsContainer />,
        },
        {
          path: "exceptions/:id",
          element: <ExceptionDetailsContainer />,
        },
        {
          path: "*",
          element: <h1>Error</h1>,
        },
      ],
    },
  ];
}
