import type { Profile, SemesterRecord, DocumentRow, Achievement } from "./academic";

export type CompletionStatus = {
  percentage: number;
  missingItems: string[];
  nextRecommendedAction: {
    label: string;
    route: string;
  } | null;
  breakdown: {
    personal: boolean;
    academic: boolean;
    profilePhoto: boolean;
    records: boolean;
    achievements: boolean;
    documents: boolean;
  };
};

export function calculateProfileCompletion(data: {
  profile: Profile | null;
  semesters: SemesterRecord[];
  documents: DocumentRow[];
  achievements: Achievement[];
}): CompletionStatus {
  let score = 0;
  const missing: string[] = [];
  let nextAction = null;
  
  const p = data.profile;
  const hasPersonal = !!p?.full_name;
  const hasAcademic = !!(p?.register_no && p?.batch && p?.current_semester);
  const hasProfilePhoto = !!p?.profile_photo_path;
  const hasRecords = data.semesters.length > 0;
  const hasAchievements = data.achievements.length > 0;
  const hasDocuments = data.documents.length > 0;

  if (hasPersonal) score += 15;
  else missing.push("personal_info");

  if (hasAcademic) score += 15;
  else missing.push("academic_info");

  if (hasProfilePhoto) score += 10;
  else missing.push("profile_photo");

  if (hasRecords) score += 25;
  else missing.push("academic_records");

  if (hasAchievements) score += 15;
  else missing.push("achievements");

  if (hasDocuments) score += 20;
  else missing.push("documents");

  if (!hasPersonal || !hasAcademic) {
    nextAction = { label: "Complete your basic profile info", route: "/settings" };
  } else if (!hasProfilePhoto) {
    nextAction = { label: "Add a profile photo", route: "/settings" };
  } else if (!hasRecords) {
    nextAction = { label: "Add your first semester record", route: "/records" };
  } else if (!hasAchievements) {
    nextAction = { label: "Add your first achievement", route: "/profile" };
  } else if (!hasDocuments) {
    nextAction = { label: "Upload your first document", route: "/records" };
  }

  return {
    percentage: score,
    missingItems: missing,
    nextRecommendedAction: nextAction,
    breakdown: {
      personal: hasPersonal,
      academic: hasAcademic,
      profilePhoto: hasProfilePhoto,
      records: hasRecords,
      achievements: hasAchievements,
      documents: hasDocuments,
    }
  };
}
