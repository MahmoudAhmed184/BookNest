import { describe, expect, it } from "vitest";

import { resolveImageUrl } from "./imageUrls";

describe("resolveImageUrl", () => {
  it("keeps absolute and browser-native image URLs unchanged", () => {
    expect(resolveImageUrl("https://cdn.example.com/avatar.jpg")).toBe(
      "https://cdn.example.com/avatar.jpg"
    );
    expect(resolveImageUrl("data:image/png;base64,abc")).toBe(
      "data:image/png;base64,abc"
    );
  });

  it("points backend media paths at the API host", () => {
    expect(resolveImageUrl("/media/profile_pictures/avatar.jpg")).toBe(
      "http://localhost:8000/media/profile_pictures/avatar.jpg"
    );
    expect(resolveImageUrl("profile_pictures/avatar.jpg")).toBe(
      "http://localhost:8000/media/profile_pictures/avatar.jpg"
    );
  });

  it("recovers absolute URLs embedded in malformed media values", () => {
    expect(
      resolveImageUrl(
        "image/upload/https://res.cloudinary.com/demo/image/upload/v1/avatar.png"
      )
    ).toBe("https://res.cloudinary.com/demo/image/upload/v1/avatar.png");
  });

  it("keeps public client assets rooted at the frontend", () => {
    expect(resolveImageUrl("user_profile.png")).toBe("/user_profile.png");
    expect(resolveImageUrl("/user_profile.png")).toBe("/user_profile.png");
  });
});
