import { useQuery } from "@tanstack/react-query";
import { LoaderCircle, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PROFILE_PHOTO_BUCKET } from "@/lib/profile";

type ProfileAvatarProps = {
  name?: string | null | undefined;
  path?: string | null | undefined;
  className?: string;
  imageClassName?: string;
  showStatus?: boolean;
};

export function ProfileAvatar({
  name,
  path,
  className = "",
  imageClassName = "",
  showStatus = false,
}: ProfileAvatarProps) {
  const photo = useQuery({
    queryKey: ["profile-photo", path],
    enabled: Boolean(path),
    staleTime: 45 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(PROFILE_PHOTO_BUCKET)
        .createSignedUrl(path!, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
  const initial = name?.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className={`relative shrink-0 ${className}`}>
      {photo.data ? (
        <img
          src={photo.data}
          alt={name ? `${name}'s profile` : "Profile"}
          className={`h-full w-full rounded-[inherit] object-cover ${imageClassName}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-[inherit] bg-gradient-to-br from-[#a78bfa] via-[#7c5cfc] to-[#4f46e5] font-bold text-white shadow-[0_8px_20px_rgba(91,76,212,.28)]">
          {photo.isFetching && path ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            initial || <UserRound className="h-4 w-4" />
          )}
        </div>
      )}
      {showStatus && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 shadow-sm" />
      )}
    </div>
  );
}
