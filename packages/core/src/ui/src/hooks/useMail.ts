import { useCallback, useMemo, useState } from "react";
import type { OneMail, PaginatorMeta, MailTableRow } from "../types";
import useLensApi, { DEFAULT_META } from "./useLensApi";

const defaultMail: OneMail = {
  created_at: "",
  data: {
    requestId: "",
    from: [],
    to: [],
    subject: "",
    date: "",
    headers: [],
    mime: {
      contentType: "",
      headers: [],
    },
    meta: {
      driver: "",
      status: "pending",
    },
  },
  id: "",
  lens_entry_id: null,
  type: "mail",
};

export default function useMail() {
  const [mails, setMails] = useState<MailTableRow[]>([]);
  const [mail, setMail] = useState<OneMail>(defaultMail);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PaginatorMeta>(DEFAULT_META);

  const { getAllMail, getMailById } = useLensApi();

  const fetchMail = useCallback(
    async (id: string) => {
      setLoading(true);
      getMailById(id)
        .then((res) => {
          setMail(res.data!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getMailById]
  );

  const fetchMails = useCallback(
    async (page?: number) => {
      setLoading(true);
      getAllMail(page)
        .then((res) => {
          setMails(res.data!);
          setMeta(res.meta!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getAllMail]
  );

  const loadMoreMails = useMemo(
    () => ({
      initialData: mails,
      meta,
      loading,
      fetchRawPage: getAllMail,
    }),
    [mails, meta, loading, getAllMail]
  );

  const [search, setSearch] = useState("");
  const filterMails = (row: MailTableRow) =>
    row.data.subject?.toLowerCase().includes(search.toLowerCase());

  return {
    loadMoreMails,
    fetchMails,
    fetchMail,
    mail,
    search,
    filterMails,
    setSearch,
  };
}
