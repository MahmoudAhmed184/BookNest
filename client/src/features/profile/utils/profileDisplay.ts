import { getFallbackHueStyle, getInitials } from "../../../utils/colorFromString";

export function resolveProfileImage(src?: string | null): string | undefined {
  if (!src) return undefined;
  return src.endsWith("image") ? `${src}.svg` : src;
}

export { getFallbackHueStyle, getInitials };
