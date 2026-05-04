import type { MoodTag, PaceTag } from "../types/filters";

export interface MoodColorOption<TValue extends string> {
  value: TValue;
  label: string;
  colorToken: string;
}

export const moodOptions: Array<MoodColorOption<MoodTag>> = [
  { value: "adventurous", label: "Adventurous", colorToken: "var(--mood-adventurous)" },
  { value: "emotional", label: "Emotional", colorToken: "var(--mood-emotional)" },
  { value: "dark", label: "Dark", colorToken: "var(--mood-dark)" },
  { value: "funny", label: "Funny", colorToken: "var(--mood-funny)" },
  { value: "hopeful", label: "Hopeful", colorToken: "var(--mood-hopeful)" },
];

export const paceOptions: Array<MoodColorOption<PaceTag>> = [
  { value: "fast", label: "Fast", colorToken: "var(--pace-fast)" },
  { value: "medium", label: "Medium", colorToken: "var(--pace-medium)" },
  { value: "slow", label: "Slow", colorToken: "var(--pace-slow)" },
];

export const moodColorTokens: Record<MoodTag | PaceTag, string> = {
  adventurous: "var(--mood-adventurous)",
  emotional: "var(--mood-emotional)",
  dark: "var(--mood-dark)",
  funny: "var(--mood-funny)",
  hopeful: "var(--mood-hopeful)",
  fast: "var(--pace-fast)",
  medium: "var(--pace-medium)",
  slow: "var(--pace-slow)",
};
