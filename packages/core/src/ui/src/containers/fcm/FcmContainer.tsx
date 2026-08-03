import { lazy, useEffect } from "react";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { FcmTableRow } from "../../types";
import useFcm from "../../hooks/useFcm";
import useListQuery from "../../hooks/useListQuery";

const FcmTable = lazy(() => import("../../views/fcm/FcmTable"));

const FcmContainer = () => {
  const { params, key, isCustomSort } = useListQuery();
  const { loadMoreItems, getItems } = useFcm(params);
  const hasMoreObject = useLoadMore<FcmTableRow>({
    paginatedPage: loadMoreItems,
    live: !isCustomSort,
  });

  useEffect(() => {
    getItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <FcmTable hasMoreObject={hasMoreObject} />;
};

export default FcmContainer;
