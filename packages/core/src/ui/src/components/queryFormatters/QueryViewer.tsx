import type { QueryEntry } from "../../types";
import SqlViewer from "./SqlViewer";
import MongbDbViewer from "./MongoViewer";

interface QueryFormatterProps {
  queryPayload: QueryEntry;
}

const QueryViewer = ({ queryPayload }: QueryFormatterProps) => {
  switch (queryPayload.type) {
    case "mongodb":
      return <MongbDbViewer query={queryPayload.query} />;
    default:
      return <SqlViewer sql={queryPayload.query} />;
  }
};

export default QueryViewer;
