import { describe, expect, it } from "vitest";

import {
  normalizeArrayResponse,
  normalizeAuthEnvelope,
  normalizeEmptyResponse,
  normalizeListResponse,
  normalizeLimitOffsetList,
  normalizeProfileEnvelope,
  type AuthEnvelopeMeta,
} from "./normalizers";

interface TestUser {
  id: number;
  username: string;
}

interface TestProfile {
  id: number;
  bio: string;
}

describe("normalizers", () => {
  it("unwraps auth login/register envelopes", () => {
    const meta = {
      profile_required: true,
      next_action: "create_profile",
    } satisfies AuthEnvelopeMeta;

    const normalized = normalizeAuthEnvelope({
      success: true,
      message: "Logged in",
      data: {
        user: { id: 1, username: "reader" },
        access: "access-token",
        refresh: "refresh-token",
      },
      meta,
    });

    expect(normalized).toEqual({
      user: { id: 1, username: "reader" },
      access: "access-token",
      refresh: "refresh-token",
      meta,
    });
  });

  it("unwraps profile envelopes", () => {
    const normalized = normalizeProfileEnvelope<TestProfile>({
      success: true,
      data: {
        profile: { id: 7, bio: "Library first." },
      },
    });

    expect(normalized.profile.bio).toBe("Library first.");
  });

  it("normalizes limit-offset paginated lists", () => {
    const normalized = normalizeLimitOffsetList<TestUser>({
      count: 12,
      next: "/api/v1/users/?limit=2&offset=2",
      previous: null,
      results: [{ id: 1, username: "reader" }],
    });

    expect(normalized).toEqual({
      count: 12,
      next: "/api/v1/users/?limit=2&offset=2",
      previous: null,
      results: [{ id: 1, username: "reader" }],
    });
  });

  it("passes through plain array responses", () => {
    const response = [{ id: 1, username: "reader" }];

    expect(normalizeArrayResponse<TestUser>(response)).toBe(response);
  });

  it("unwraps paginated list envelopes", () => {
    const response = {
      count: 1,
      next: null,
      previous: null,
      results: [{ id: 1, username: "reader" }],
    };

    expect(normalizeListResponse<TestUser>(response)).toEqual(response.results);
  });

  it("normalizes empty 204 responses to void", () => {
    expect(normalizeEmptyResponse()).toBeUndefined();
  });
});
