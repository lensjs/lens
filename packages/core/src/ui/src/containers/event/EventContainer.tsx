import { lazy, useEffect } from "react";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { EventTableRow } from "../../types";
import useEvent from "../../hooks/useEvent";
import useListQuery from "../../hooks/useListQuery";

const EventTable = lazy(() => import("../../views/event/EventTable"));

const EventContainer = () => {
  const { params, key, isCustomSort } = useListQuery();
  const { loadMoreItems, getItems } = useEvent(params);
  const hasMoreObject = useLoadMore<EventTableRow>({
    paginatedPage: loadMoreItems,
    live: !isCustomSort,
  });

  useEffect(() => {
    getItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <EventTable hasMoreObject={hasMoreObject} />;
};

export default EventContainer;
