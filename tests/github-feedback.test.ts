import { describe, expect, test } from "bun:test";
import { buildGitHubFeedbackUrl } from "../packages/shared/src/github-feedback";

describe("buildGitHubFeedbackUrl", () => {
  test("prefills localized feedback copy and system information", () => {
    const url = new URL(
      buildGitHubFeedbackUrl({
        contentHeading: "Feedback content",
        contentPrompt: "Please describe the issue",
        privacyNotice: "Do not submit private information",
        systemInfo: [
          { label: "Version", value: "v0.5.0" },
          { label: "System", value: "Android 16" },
        ],
        systemInfoHeading: "System information",
        systemInfoNotice: "Auto-generated",
        titlePrefix: "[Feedback] ",
      })
    );

    expect(`${url.origin}${url.pathname}`).toBe("https://github.com/tianma-if/edgeever/issues/new");
    expect(url.searchParams.get("title")).toBe("[Feedback] ");
    expect(url.searchParams.get("body")).toContain("## Feedback content");
    expect(url.searchParams.get("body")).toContain("- Version: v0.5.0");
    expect(url.searchParams.get("body")).toContain("- System: Android 16");
    expect(url.searchParams.get("body")).toContain("> Do not submit private information");
  });
});
