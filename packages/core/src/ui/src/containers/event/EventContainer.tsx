import { lazy, useEffect } from "react";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { EventTableRow } from "../../types";
import useEvent from "../../hooks/useEvent";

const EventTable = lazy(() => import("../../views/event/EventTable"));

const EventContainer = () => {
  const { loadMoreItems, getItems } = useEvent();
  const hasMoreObject = useLoadMore<EventTableRow>({
    paginatedPage: loadMoreItems,
  });

  useEffect(() => {
    getItems();
  }, []);

  return <EventTable hasMoreObject={hasMoreObject} />;
};

export default EventContainer;
