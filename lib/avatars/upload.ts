import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AVATAR_BUCKET,
  AVATAR_EXT_BY_MIME,
  validateAvatarFile,
} from "@/lib/avatars/constants";

/**
 * Uploads a profile photo to the public `avatars` bucket and returns its public URL.
 * Uses the admin (service-role) client so RLS does not block the write.
 */
export async function uploadUserAvatar(
  adminClient: SupabaseClient,
  userId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  const validationError = validateAvatarFile(file);
  if (validationError) return { error: validationError };

  const ext = AVATAR_EXT_BY_MIME[file.type] ?? "jpg";
  const path = `${userId}/avatar.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await adminClient.storage
    .from(AVATAR_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data } = adminClient.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  // Bust CDN/browser cache when replacing an existing avatar.
  const url = `${data.publicUrl}?v=${Date.now()}`;
  return { url };
}
