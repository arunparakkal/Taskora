export const AVATAR_BUCKET = "avatars";
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const AVATAR_EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_MIME_TYPES.has(file.type)) {
    return "Photo must be a JPEG, PNG, WebP, or GIF image";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "Photo must be 2MB or smaller";
  }
  return null;
}
