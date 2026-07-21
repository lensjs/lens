import { lazy, useEffect } from "react";
import useMail from "../../hooks/useMail";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { MailTableRow } from "../../types";

const MailTableView = lazy(() => import("../../views/mail/MailTable"));

const MailContainer = () => {
  const { loadMoreMails, fetchMails } = useMail();
  const hasMoreObject = useLoadMore<MailTableRow>({
    paginatedPage: loadMoreMails,
  });

  useEffect(() => {
    fetchMails();
  }, []);

  return <MailTableView hasMoreObject={hasMoreObject} />;
};

export default MailContainer;
