import { useEffect, useState } from "react";

import { showError } from "@/lib/errors";

type UseCatalogItemDetailOptions<T> = {
  id: string | string[] | undefined;
  fetchItem: (id: string) => Promise<T>;
  errorMessage: string;
};

export function useCatalogItemDetail<T>({ id, fetchItem, errorMessage }: UseCatalogItemDetailOptions<T>) {
  const [item, setItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolvedId = Array.isArray(id) ? id[0] : id;
    if (!resolvedId) {
      setItem(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchItem(resolvedId)
      .then((nextItem) => {
        if (!cancelled) {
          setItem(nextItem);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItem(null);
        }
        showError(errorMessage);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [errorMessage, fetchItem, id]);

  return { item, loading };
}
