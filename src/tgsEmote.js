import { inflate } from "pako";

const cache = new Map();

export function resolvePublicAsset(src) {
  if (!src || /^https?:\/\//i.test(src) || src.startsWith("data:")) return src;
  const base = import.meta.env.BASE_URL || "/";
  if (src.startsWith(base)) return src;
  return `${base}${src.replace(/^\//, "")}`;
}

export async function loadTgsAnimationData(src) {
  const url = resolvePublicAsset(src);
  if (cache.has(url)) return cache.get(url);
  const promise = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`TGS fetch failed (${res.status}): ${url}`);
      return res.arrayBuffer();
    })
    .then((buf) => {
      const data = JSON.parse(new TextDecoder().decode(inflate(new Uint8Array(buf))));
      delete data.tgs;
      return data;
    });
  cache.set(url, promise);
  return promise;
}
