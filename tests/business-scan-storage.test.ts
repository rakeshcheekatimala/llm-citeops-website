import { describe, expect, it } from "vitest";

import {
  businessScanStorageSetupMessage,
  BusinessScanStorageSetupError,
  formatBusinessScanStorageError,
  tokenMatchesHash,
} from "@/lib/business-scan/storage";
import { createClaimToken, hashClaimToken } from "@/lib/reports/tokens";

describe("business scan storage", () => {
  it("turns Supabase schema-cache table misses into an actionable setup message", () => {
    const message = formatBusinessScanStorageError(
      new Error(
        "Could not find the table 'public.business_scan_projects' in the schema cache",
      ),
    );

    expect(message).toBe(businessScanStorageSetupMessage);
  });

  it("exposes a typed setup error for routes to return a clear 503", () => {
    const error = new BusinessScanStorageSetupError();
    expect(error.message).toBe(businessScanStorageSetupMessage);
    expect(error.name).toBe("BusinessScanStorageSetupError");
  });

  it("keeps unrelated storage errors intact", () => {
    expect(formatBusinessScanStorageError(new Error("network failed"))).toBe(
      "network failed",
    );
  });
});

describe("tokenMatchesHash (ownership check)", () => {
  it("accepts the correct token against its stored hash", () => {
    const token = createClaimToken();
    expect(tokenMatchesHash(token, hashClaimToken(token))).toBe(true);
  });

  it("rejects an incorrect or missing token", () => {
    const token = createClaimToken();
    const hash = hashClaimToken(token);
    expect(tokenMatchesHash("wrong-token", hash)).toBe(false);
    expect(tokenMatchesHash(undefined, hash)).toBe(false);
  });

  it("denies access when a project has no stored hash (legacy rows)", () => {
    expect(tokenMatchesHash(createClaimToken(), null)).toBe(false);
    expect(tokenMatchesHash(undefined, undefined)).toBe(false);
  });
});
