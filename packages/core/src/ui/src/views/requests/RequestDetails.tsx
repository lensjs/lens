import DetailPanel from "../../components/DetailPanel";
import Table from "../../components/Table";
import TabbedDataViewer, {
  type TabItem,
} from "../../components/tabs/TabbedDataViewer";
import type { OneRequest } from "../../types";
import getColumns from "../queries/columns";
import getExceptionsColumns from "../exceptions/columns";
import getCacheColumns from "../cache/columns";
import BasicRequestDetails from "./BasicRequestDetails";

const RequestDetails = ({ request }: { request: OneRequest }) => {
  const dynamicTabs = [
    {
      id: "payload",
      label: "Payload",
      data: request?.request?.data?.body,
    },
    {
      id: "headers",
      label: "Headers",
      data: request?.request?.data?.headers,
    },
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
      id: "request-queries",
      label: `Queries (${request?.queries?.length})`,
      shouldShow: request?.queries?.length > 0,
      content: <Table columns={getColumns()} data={request?.queries} />,
    },
    {
      id: "request-cache",
      label: `Cache (${request?.cacheEntries.length})`,
      shouldShow: request?.cacheEntries.length > 0,
      content: (
        <Table columns={getCacheColumns()} data={request?.cacheEntries} />
      ),
    },
    {
      id: "request-exceptions",
      label: `Exceptions (${request.exceptions.length})`,
      shouldShow: request.exceptions.length > 0,
      content: (
        <Table columns={getExceptionsColumns()} data={request.exceptions} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <BasicRequestDetails request={request} />
      {request?.request?.data?.user && (
        <DetailPanel
          title="User"
          items={[
            {
              label: "ID",
              value: request?.request?.data?.user?.id,
            },
            {
              label: "Email",
              value: request?.request?.data?.user?.email,
            },
            {
              label: "Name",
              value: request?.request?.data?.user?.name,
            },
          ]}
        />
      )}

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
      <TabbedDataViewer tabs={requestRelatedTabls} />
    </div>
  );
};

export default RequestDetails;
