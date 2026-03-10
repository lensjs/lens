import { lazy, useEffect } from "react";
import useMail from "../../hooks/useMail";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { MailTableRow } from "../../types";
import SearchInput from "../../components/SearchInput";

const MailTableView = lazy(() => import("../../views/mail/MailTable"));

const MailContainer = () => {
  const { loadMoreMails, fetchMails, search, setSearch, filterMails } =
    useMail();
  let hasMoreObject = useLoadMore<MailTableRow>({
    paginatedPage: loadMoreMails,
  });

  hasMoreObject = {
    ...hasMoreObject,
    data: hasMoreObject.data.filter(filterMails),
  };

  useEffect(() => {
    fetchMails();
  }, []);

  return (
    <div>
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by subject..."
        resultCount={hasMoreObject.data.length}
        showResultCount={true}
      />
      <MailTableView hasMoreObject={hasMoreObject} />
    </div>
  );
};

export default MailContainer;
