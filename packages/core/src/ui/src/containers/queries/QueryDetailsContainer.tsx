import { useEffect } from "react";
import { useParams } from "react-router-dom";
import useQueries from "../../hooks/useQueries";
import QueryDetails from "../../views/queries/QueryDetails";
import { DetailSkeleton } from "../../components/Skeleton";

const QueryDetailsContainer = () => {
  const { query, fetchQuery } = useQueries();
  const { id } = useParams();

  useEffect(() => {
    id && fetchQuery(id);
  }, [id]);

  if (!query) return <DetailSkeleton />;

  return <QueryDetails query={query} />;
};

export default QueryDetailsContainer;
