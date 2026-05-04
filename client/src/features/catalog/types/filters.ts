export type MoodTag = "adventurous" | "emotional" | "dark" | "funny" | "hopeful";
export type PaceTag = "fast" | "medium" | "slow";

export interface CatalogFilters {
  genres: string[];
  moods: MoodTag[];
  pace: PaceTag[];
}
