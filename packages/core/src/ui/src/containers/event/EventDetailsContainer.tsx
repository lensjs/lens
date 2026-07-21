import { lazy, useEffect } from "react";
import { useParams } from "react-router-dom";
import useEvent from "../../hooks/useEvent";
import { DetailSkeleton } from "../../components/Skeleton";

const EventDetailsView = lazy(() => import("../../views/event/EventDetails"));

const EventDetailsContainer = () => {
  const { item, getItem } = useEvent();
  const { id } = useParams();

  useEffect(() => {
    id && getItem(id);
  }, [id]);

  if (!item) return <DetailSkeleton />;

  return <EventDetailsView data={item} />;
};

export default EventDetailsContainer;
