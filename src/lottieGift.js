import { resolvePublicAsset } from "./tgsEmote.js";

export const ROSE_LOTTIE_SRC = "lottie/rose/animation.json";

const cache = new Map();

/** Load a standard Lottie JSON file from public assets. */
export async function loadLottieAnimationData(src) {
  const jsonUrl = resolvePublicAsset(src);
  if (cache.has(jsonUrl)) return cache.get(jsonUrl);

  const promise = fetch(jsonUrl)
    .then((res) => {
      if (!res.ok) throw new Error(`Lottie fetch failed (${res.status}): ${jsonUrl}`);
      return res.json();
    })
    .then((data) => ({
      data,
      assetsPath: jsonUrl.replace(/animation\.json$/, ""),
    }));

  cache.set(jsonUrl, promise);
  return promise;
}
