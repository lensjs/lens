import { lazy } from "react";
import { useParams } from "react-router-dom";
import { useMailById } from "../../hooks/useTanstackApi";

const MailDetailsView = lazy(() => import("../../views/mail/MailDetails"));

const MailDetailsContainer = () => {
  const { id } = useParams();
  const { data, isLoading } = useMailById(id as string);

  if (isLoading) return <div>Loading...</div>;

  return <>{data?.data && <MailDetailsView mail={data.data} />}</>;
};

export default MailDetailsContainer;
