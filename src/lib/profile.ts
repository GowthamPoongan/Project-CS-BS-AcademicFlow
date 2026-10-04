import { supabase } from "@/integrations/supabase/client";

export const PROFILE_PHOTO_BUCKET = "profile-photos";

export async function uploadProfilePhoto(userId: string, file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Profile photo must be 5 MB or smaller.");
  }
  const extension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const path = `${userId}/avatar-${Date.now()}.${extension}`;
  const { error } = await supabase.storage
    .from(PROFILE_PHOTO_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
  if (error) throw error;
  return path;
}
