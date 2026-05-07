import { colorFromString } from "../../../../utils/colorFromString";
import { moodOptions } from "../../constants/moodColors";
import type { BookReview } from "../../types/book";
import type { MoodTag } from "../../types/filters";

export function getReviewMood(review: BookReview): MoodTag {
  const seed = colorFromString(`${review.review_text} ${review.book_title ?? ""}`);
  return moodOptions[seed % moodOptions.length]?.value ?? "hopeful";
}
