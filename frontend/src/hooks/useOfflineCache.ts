import { useCallback, useEffect, useState } from "react";

const CACHE_NAME = "palashvani-offline-v1";

/**
 * Real (not simulated) offline content packs, built on the standard
 * browser Cache API -- the same mechanism a service worker would use.
 * "Downloading a category" fetches its dictionary + flashcard data once
 * and stores the raw responses in this named cache; the app can then be
 * used with the device offline, exactly as the PPT's "Offline Status"
 * screen describes, without requiring a full service-worker/PWA install
 * step for the prototype to demonstrate the idea honestly.
 */
export function useOfflineCache() {
  const isSupported = typeof window !== "undefined" && "caches" in window;
  const [cachedCategories, setCachedCategories] = useState<string[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSupported) return;
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const categories = new Set<string>();
    for (const req of keys) {
      const url = new URL(req.url);
      const category = url.searchParams.get("category");
      if (category) categories.add(category);
    }
    setCachedCategories([...categories]);
  }, [isSupported]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const downloadCategory = useCallback(
    async (category: string) => {
      if (!isSupported) return;
      setDownloading(category);
      try {
        const cache = await caches.open(CACHE_NAME);
        const urls = [
          `/api/translations/search?category=${encodeURIComponent(category)}&page_size=100`,
          `/api/flashcards/deck?category=${encodeURIComponent(category)}`,
        ];
        const responses = await Promise.all(
          urls.map(async (url) => {
            const response = await fetch(url);
            if (response.ok) await cache.put(url, response.clone());
            return response.ok ? response.clone() : null;
          }),
        );
        await refresh();

        // In addition to the invisible browser-cache copy above (what makes
        // the app itself keep working offline), also hand the teacher a real,
        // visible file -- a plain "Download" button that only updates some
        // internal cache with no file appearing anywhere is confusing, so we
        // save an actual .json file to their Downloads folder too.
        const [searchResp, deckResp] = responses;
        const payload = {
          category,
          exported_at: new Date().toISOString(),
          dictionary_entries: searchResp ? (await searchResp.json()).results : [],
          flashcards: deckResp ? (await deckResp.json()).cards : [],
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `palashvani-${category}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);
      } finally {
        setDownloading(null);
      }
    },
    [isSupported, refresh],
  );

  const clearAll = useCallback(async () => {
    if (!isSupported) return;
    await caches.delete(CACHE_NAME);
    setCachedCategories([]);
  }, [isSupported]);

  return { isSupported, cachedCategories, downloading, downloadCategory, clearAll };
}
