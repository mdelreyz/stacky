import { useDeferredValue, useEffect, useState } from "react";
import { router } from "expo-router";

import { supplements as supplementsApi, type Supplement } from "@/lib/api";
import { showError } from "@/lib/errors";
import { formatSupplementCategory } from "@/components/supplement-add/config";

export function useSupplementAddScreen() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState<Supplement[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Supplement[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const trimmedName = name.trim();
  const deferredName = useDeferredValue(trimmedName);

  useEffect(() => {
    let cancelled = false;

    void supplementsApi
      .list()
      .then((result) => {
        if (!cancelled) {
          setCatalog(result.items);
        }
      })
      .catch((error: any) => {
        if (!cancelled) {
          showError(error.message || "Failed to load supplement catalog");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (deferredName.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    let cancelled = false;
    setSuggestionsLoading(true);

    void supplementsApi
      .list({ search: deferredName })
      .then((result) => {
        if (!cancelled) {
          setSuggestions(result.items.slice(0, 6));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSuggestions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSuggestionsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [deferredName]);

  async function handleOnboard() {
    if (!trimmedName) return;
    setLoading(true);
    try {
      const result = await supplementsApi.onboard({ name: trimmedName });
      if (result.status === "failed" && result.ai_error) {
        showError(result.ai_error);
      }
      router.replace(`/supplement/${result.id}`);
    } catch (error: any) {
      showError(error.message || "Failed to onboard supplement");
    } finally {
      setLoading(false);
    }
  }

  const exactMatch =
    suggestions.find((item) => item.name.toLowerCase() === trimmedName.toLowerCase()) ||
    catalog.find((item) => item.name.toLowerCase() === trimmedName.toLowerCase()) ||
    null;

  const categories = [...new Set(catalog.map((item) => formatSupplementCategory(item.category)))].sort();
  const browseItems = activeCategory
    ? catalog.filter((item) => formatSupplementCategory(item.category) === activeCategory)
    : catalog;
  const browsePreview = browseItems.slice(0, 8);

  return {
    activeCategory,
    browsePreview,
    catalog,
    catalogLoading,
    categories,
    exactMatch,
    handleOnboard,
    loading,
    name,
    setActiveCategory,
    setName,
    suggestions,
    suggestionsLoading,
    trimmedName,
  };
}
