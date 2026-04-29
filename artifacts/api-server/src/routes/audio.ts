/**
 * Audio proxy — batch fetch pre-generated audio from Supabase Storage.
 * POST /api/audio/batch
 *   Body: { paths: string[] }
 *   Response: { audios: { [path]: base64 } }
 *
 * Path conventions:
 *   lesson/{lessonId}/{wordIndex}/pronunciation-en → lessons-audio bucket
 *   games/math/num-5-en                          → lessons-audio bucket
 *   games/letter/celebrate-0-ar                  → lessons-audio bucket
 *   games/jigsaw/solar-en                        → lessons-audio bucket
 *   story-1/sentence-0                           → stories-audio bucket
 */
import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase.js";

const router: IRouter = Router();

function getBucket(path: string): string {
  return path.startsWith("story-") ? "stories-audio" : "lessons-audio";
}

// In-memory cache to avoid re-downloading from Supabase
const _cache = new Map<string, string>();
const MAX_CACHE = 2000;

/** Clear all cached entries whose path starts with the given prefix */
export function clearCacheByPrefix(prefix: string): void {
  for (const key of Array.from(_cache.keys())) {
    if (key.startsWith(prefix)) _cache.delete(key);
  }
}

async function fetchAudioBase64(path: string): Promise<string | null> {
  const cacheKey = path;
  if (_cache.has(cacheKey)) return _cache.get(cacheKey)!;

  const bucket = getBucket(path);
  const fullPath = `${path}.mp3`;

  try {
    const { data, error } = await supabase.storage.from(bucket).download(fullPath);
    if (error || !data) return null;

    const arrayBuffer = await data.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    if (_cache.size >= MAX_CACHE) {
      const firstKey = _cache.keys().next().value;
      if (firstKey) _cache.delete(firstKey);
    }
    _cache.set(cacheKey, base64);
    return base64;
  } catch {
    return null;
  }
}

router.post("/audio/batch", async (req, res) => {
  try {
    const { paths } = req.body as { paths: string[] };
    if (!Array.isArray(paths) || paths.length === 0) {
      return res.json({ audios: {} });
    }

    const limited = paths.slice(0, 150);

    const results = await Promise.allSettled(
      limited.map(async (p) => ({ path: p, base64: await fetchAudioBase64(p) }))
    );

    const audios: Record<string, string> = {};
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.base64) {
        audios[r.value.path] = r.value.base64;
      }
    }

    return res.json({ audios });
  } catch (err) {
    return res.status(500).json({ error: "batch audio failed" });
  }
});

export default router;
