import { lazy, useEffect } from "react";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { FcmTableRow } from "../../types";
import useFcm from "../../hooks/useFcm";

const FcmTable = lazy(() => import("../../views/fcm/FcmTable"));

const FcmContainer = () => {
  const { loadMoreItems, getItems } = useFcm();
  const hasMoreObject = useLoadMore<FcmTableRow>({
    paginatedPage: loadMoreItems,
  });

  useEffect(() => {
    getItems();
  }, []);

  return <FcmTable hasMoreObject={hasMoreObject} />;
};

export default FcmContainer;
