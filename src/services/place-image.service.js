const MEMORY_CACHE = new Map();
const CACHE_PREFIX = 'safarsang_place_img_v1_';

const normalizeDestination = (destination = '') =>
  String(destination)
    .replace(/,?\s*india$/i, '')
    .trim();

const buildCandidates = (destination = '') => {
  const clean = normalizeDestination(destination);
  if (!clean) return [];
  const base = clean.split(',').map((s) => s.trim()).filter(Boolean);
  const first = base[0] || clean;
  return [...new Set([clean, first])];
};

const fetchWikipediaSummaryImage = async (title) => {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.thumbnail?.source || data?.originalimage?.source || null;
};

const searchWikipediaTitle = async (query) => {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=1&format=json&origin=*`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.query?.search?.[0]?.title || null;
};

const cacheKey = (destination) => `${CACHE_PREFIX}${normalizeDestination(destination).toLowerCase()}`;

const readCache = (destination) => {
  const key = cacheKey(destination);
  if (MEMORY_CACHE.has(key)) return MEMORY_CACHE.get(key);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.url === 'string' && parsed.url) {
      MEMORY_CACHE.set(key, parsed.url);
      return parsed.url;
    }
  } catch {
    // Ignore cache parse errors.
  }
  return null;
};

const writeCache = (destination, url) => {
  const key = cacheKey(destination);
  MEMORY_CACHE.set(key, url);
  try {
    localStorage.setItem(key, JSON.stringify({ url, ts: Date.now() }));
  } catch {
    // Ignore storage quota errors.
  }
};

export const getPlaceImage = async (destination) => {
  const candidates = buildCandidates(destination);
  const clean = candidates[0];
  if (!clean) return null;

  const cached = readCache(clean);
  if (cached) return cached;

  try {
    let img = null;
    for (const title of candidates) {
      img = await fetchWikipediaSummaryImage(title);
      if (img) break;
    }
    if (!img) {
      // Fallback: search wikipedia first, then fetch the top result summary image.
      for (const q of candidates) {
        const topTitle = await searchWikipediaTitle(q);
        if (!topTitle) continue;
        img = await fetchWikipediaSummaryImage(topTitle);
        if (img) break;
      }
    }
    if (img) writeCache(clean, img);
    return img;
  } catch {
    return null;
  }
};

