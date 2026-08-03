import { useNavigate } from "react-router-dom";
import { humanDifferentDate } from "@lensjs/date";
import Table, { type TableColumn } from "../../components/Table";
import ListToolbar from "../../components/ListToolbar";
import GroupToggle from "../../components/GroupToggle";
import { DetailSkeleton } from "../../components/Skeleton";
import { useListView } from "../../hooks/useListView";
import useListQuery from "../../hooks/useListQuery";
import { useExceptionGroups } from "../../hooks/useTanstackApi";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import type { ExceptionGroup } from "../../types";

export default function ExceptionGroups() {
  const config = useConfig();
  const paths = getRoutesPaths(config);
  const navigate = useNavigate();
  const { params } = useListQuery();
  const controls = useListView<ExceptionGroup>([], {});
  const { data, isLoading } = useExceptionGroups(params);

  const groups = data?.data ?? [];

  const open = (group: ExceptionGroup) => {
    // Drill into all occurrences of this issue via the server-side fingerprint
    // filter; fall back to the sample occurrence for pre-fingerprint entries.
    if (group.fingerprint) {
      navigate(
        `${paths.EXCEPTIONS}?fingerprint=${encodeURIComponent(group.fingerprint)}`,
      );
    } else {
      navigate(`${paths.EXCEPTIONS}/${group.sampleId}`);
    }
  };

  const columns: TableColumn<ExceptionGroup>[] = [
    {
      name: "Exception",
      render: (g) => (
        <span className="font-mono text-sm font-semibold text-danger">
          {g.name}
        </span>
      ),
    },
    {
      name: "Message",
      render: (g) => (
        <span className="line-clamp-1 text-sm text-muted" title={g.message}>
          {g.message || "\u2014"}
        </span>
      ),
    },
    {
      name: "Occurrences",
      render: (g) => <span className="tabular font-semibold">{g.count}</span>,
      position: "end",
    },
    {
      name: "Last seen",
      render: (g) => {
        const t = humanDifferentDate(g.lastSeen);
        return <span title={t.exact}>{t.label}</span>;
      },
      position: "end",
      class: "min-w-32",
    },
  ];

  const stats = [{ label: "Issues", value: groups.length }];

  return (
    <div>
      <ListToolbar
        controls={controls}
        stats={stats}
        searchPlaceholder="Search by type or message…"
        actions={<GroupToggle />}
      />
      {isLoading ? (
        <DetailSkeleton />
      ) : (
        <Table
          columns={columns}
          data={groups}
          emptyMessage="No exceptions in this range."
          onRowClick={open}
        />
      )}
    </div>
  );
}
