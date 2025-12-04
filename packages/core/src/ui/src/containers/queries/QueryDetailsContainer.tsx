import { useEffect } from "react";
import { useParams } from "react-router-dom";
import useQueries from "../../hooks/useQueries";
import QueryDetails from "../../views/queries/QueryDetails";

const QueryDetailsContainer = () => {
  const { query, fetchQuery } = useQueries();
  const { id } = useParams();

  useEffect(() => {
    id && fetchQuery(id);
  }, [id]);

  return <div>{query && <QueryDetails query={query} />}</div>;
};

export default QueryDetailsContainer;
