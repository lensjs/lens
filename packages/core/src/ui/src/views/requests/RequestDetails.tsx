import Table from "../../components/Table";
import TabbedDataViewer, {
  type TabItem,
} from "../../components/tabs/TabbedDataViewer";
import type { OneRequest } from "../../types";
import getQueriesColumns from "../queries/columns";
import getExceptionsColumns from "../exceptions/columns";
import getCacheColumns from "../cache/columns";
import getMailColumns from "../mail/columns";
import getHttpColumns from "../http/columns";
import getEventColumns from "../event/columns";
import getRedisColumns from "../redis/columns";
import getFcmColumns from "../fcm/columns";
import BasicRequestDetails from "./BasicRequestDetails";
import RequestTimeline from "./RequestTimeline";

const RequestDetails = ({ request }: { request: OneRequest }) => {
  const queriesColumns = getQueriesColumns();
  const exceptionsColumns = getExceptionsColumns();
  const cacheColumns = getCacheColumns();
  const mailColumns = getMailColumns();
  const httpColumns = getHttpColumns();
  const eventColumns = getEventColumns();
  const redisColumns = getRedisColumns();
  const fcmColumns = getFcmColumns();

  const dynamicTabs = [
    { id: "payload", label: "Payload", data: request?.request?.data?.body },
    { id: "headers", label: "Headers", data: request?.request?.data?.headers },
  ];

  const responseTabs = [
    {
      id: "response-body",
      label: "Body",
      data: request?.request?.data?.response?.json,
    },
    {
      id: "response-headers",
      label: "Headers",
      data: request?.request?.data?.response?.headers,
    },
  ];

  const requestRelatedTabls: TabItem[] = [
    {
      id: "request-exceptions",
      label: `Exceptions (${request.exceptions.length})`,
      shouldShow: request.exceptions.length > 0,
      content: <Table columns={exceptionsColumns} data={request.exceptions} />,
    },
    {
      id: "request-queries",
      label: `Queries (${request?.queries?.length})`,
      shouldShow: request?.queries?.length > 0,
      content: <Table columns={queriesColumns} data={request?.queries} />,
    },
    {
      id: "request-cache",
      label: `Cache (${request?.cacheEntries.length})`,
      shouldShow: request?.cacheEntries.length > 0,
      content: <Table columns={cacheColumns} data={request?.cacheEntries} />,
    },
    {
      id: "request-emails",
      label: `Emails (${request?.emails?.length || 0})`,
      shouldShow: request?.emails?.length > 0,
      content: <Table columns={mailColumns} data={request?.emails} />,
    },
    {
      id: "request-http",
      label: `HTTP (${request?.httpEntries?.length || 0})`,
      shouldShow: (request?.httpEntries?.length || 0) > 0,
      content: <Table columns={httpColumns} data={request?.httpEntries ?? []} />,
    },
    {
      id: "request-events",
      label: `Events (${request?.eventEntries?.length || 0})`,
      shouldShow: (request?.eventEntries?.length || 0) > 0,
      content: (
        <Table columns={eventColumns} data={request?.eventEntries ?? []} />
      ),
    },
    {
      id: "request-redis",
      label: `Redis (${request?.redisEntries?.length || 0})`,
      shouldShow: (request?.redisEntries?.length || 0) > 0,
      content: (
        <Table columns={redisColumns} data={request?.redisEntries ?? []} />
      ),
    },
    {
      id: "request-fcm",
      label: `FCM (${request?.fcmEntries?.length || 0})`,
      shouldShow: (request?.fcmEntries?.length || 0) > 0,
      content: <Table columns={fcmColumns} data={request?.fcmEntries ?? []} />,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <BasicRequestDetails request={request} />

      <div className="grid gap-3 xl:grid-cols-2">
        <TabbedDataViewer
          tabs={dynamicTabs}
          title="Request Data"
          defaultActiveTab="payload"
        />
        <TabbedDataViewer
          tabs={responseTabs}
          title="Response Data"
          defaultActiveTab="response-body"
        />
      </div>

      <RequestTimeline request={request} />
      <TabbedDataViewer tabs={requestRelatedTabls} />
    </div>
  );
};

export default RequestDetails;
