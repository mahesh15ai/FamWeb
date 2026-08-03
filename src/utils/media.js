const API_ORIGIN =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ?? "";

/**
 * Backend media fields (profile_photo, logo, cover_image) return relative
 * paths like "/media/family_logos/xxxx.jpg". This turns that into a full,
 * browser-usable URL, pointing at the same origin as the API.
 */
export function resolveMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_ORIGIN}${path}`;
}