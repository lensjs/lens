import {
  ArrowRightLeft,
  Bell,
  Bug,
  Database,
  Globe,
  Layers,
  Mail,
  Radio,
  Server,
  Zap,
} from "lucide-react";
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
const MailContainer = lazy(
  () => import("../../containers/mail/MailContainer"),
);
const MailDetailsContainer = lazy(
  () => import("../../containers/mail/MailDetailsContainer"),
);
const HttpContainer = lazy(() => import("../../containers/http/HttpContainer"));
const HttpDetailsContainer = lazy(
  () => import("../../containers/http/HttpDetailsContainer"),
);
const EventContainer = lazy(
  () => import("../../containers/event/EventContainer"),
);
const EventDetailsContainer = lazy(
  () => import("../../containers/event/EventDetailsContainer"),
);
const RedisContainer = lazy(
  () => import("../../containers/redis/RedisContainer"),
);
const RedisDetailsContainer = lazy(
  () => import("../../containers/redis/RedisDetailsContainer"),
);
const FcmContainer = lazy(() => import("../../containers/fcm/FcmContainer"));
const FcmDetailsContainer = lazy(
  () => import("../../containers/fcm/FcmDetailsContainer"),
);
const LiveTailContainer = lazy(
  () => import("../../containers/liveTail/LiveTailContainer"),
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
    MAIL: `${config.path}/mail`,
    MAIL_DETAILS: `${config.path}/mail/:mailId`,
    HTTP: `${config.path}/http`,
    HTTP_DETAILS: `${config.path}/http/:httpId`,
    EVENTS: `${config.path}/events`,
    EVENT_DETAILS: `${config.path}/events/:eventId`,
    REDIS: `${config.path}/redis`,
    REDIS_DETAILS: `${config.path}/redis/:redisId`,
    FCM: `${config.path}/fcm`,
    FCM_DETAILS: `${config.path}/fcm/:fcmId`,
    LIVE_TAIL: `${config.path}/live`,
  };
}

export function getSidebarRoutes(config: LensConfig) {
  const paths = getRoutesPaths(config);

  return [
    {
      path: paths.LIVE_TAIL,
      label: "Live Tail",
      icon: Radio,
    },
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
    {
      path: paths.MAIL,
      label: "Mail",
      icon: Mail,
    },
    {
      path: paths.HTTP,
      label: "HTTP",
      icon: Globe,
    },
    {
      path: paths.EVENTS,
      label: "Events",
      icon: Zap,
    },
    {
      path: paths.REDIS,
      label: "Redis",
      icon: Server,
    },
    {
      path: paths.FCM,
      label: "FCM",
      icon: Bell,
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
          path: "mail",
          element: <MailContainer />,
        },
        {
          path: "mail/:id",
          element: <MailDetailsContainer />,
        },
        {
          path: "http",
          element: <HttpContainer />,
        },
        {
          path: "http/:id",
          element: <HttpDetailsContainer />,
        },
        {
          path: "events",
          element: <EventContainer />,
        },
        {
          path: "events/:id",
          element: <EventDetailsContainer />,
        },
        {
          path: "redis",
          element: <RedisContainer />,
        },
        {
          path: "redis/:id",
          element: <RedisDetailsContainer />,
        },
        {
          path: "fcm",
          element: <FcmContainer />,
        },
        {
          path: "fcm/:id",
          element: <FcmDetailsContainer />,
        },
        {
          path: "live",
          element: <LiveTailContainer />,
        },
        {
          path: "*",
          element: <h1>Error</h1>,
        },
      ],
    },
  ];
}
