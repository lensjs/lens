import { lazy, useEffect } from "react";
import useMail from "../../hooks/useMail";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { MailTableRow } from "../../types";
import useListQuery from "../../hooks/useListQuery";

const MailTableView = lazy(() => import("../../views/mail/MailTable"));

const MailContainer = () => {
  const { params, key, isCustomSort } = useListQuery();
  const { loadMoreMails, fetchMails } = useMail(params);
  const hasMoreObject = useLoadMore<MailTableRow>({
    paginatedPage: loadMoreMails,
    live: !isCustomSort,
  });

  useEffect(() => {
    fetchMails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <MailTableView hasMoreObject={hasMoreObject} />;
};

export default MailContainer;
