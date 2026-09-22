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
      if (!isSupported) return null;
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

        // Return the data so the caller can use it for generating the Word doc
        const [searchResp, deckResp] = responses;
        const dictionary_entries = searchResp ? (await searchResp.json()).results : [];
        const flashcards = deckResp ? (await deckResp.json()).cards : [];
        
        return { category, dictionary_entries, flashcards };
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