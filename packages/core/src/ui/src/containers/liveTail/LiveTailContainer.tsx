import { lazy } from "react";
import useLiveTail from "../../hooks/useLiveTail";

const LiveTailView = lazy(() => import("../../views/liveTail/LiveTail"));

const LiveTailContainer = () => {
  const { items, status, dropped } = useLiveTail();

  return <LiveTailView items={items} status={status} dropped={dropped} />;
};

export default LiveTailContainer;
