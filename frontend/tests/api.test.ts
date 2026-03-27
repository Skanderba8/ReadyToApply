import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadBlob } from "../lib/api";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("downloadBlob()", () => {
  it("creates and clicks an anchor element", () => {
    const mockUrl = "blob:http://localhost/test";
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => mockUrl),
      revokeObjectURL: vi.fn(),
    });

    const clickSpy = vi.fn();
    const appendSpy = vi.fn();
    const removeSpy = vi.fn();

    vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click: clickSpy,
    } as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, "appendChild").mockImplementation(appendSpy);
    vi.spyOn(document.body, "removeChild").mockImplementation(removeSpy);

    const blob = new Blob(["test"], { type: "text/plain" });
    downloadBlob(blob, "test.docx");

    expect(clickSpy).toHaveBeenCalled();
  });
});

describe("API error handling", () => {
  beforeEach(() => mockFetch.mockReset());

  it("throws on network error", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const { extractCV } = await import("../lib/api");
    const file = new File(["pdf content"], "cv.pdf", { type: "application/pdf" });
    await expect(extractCV(file, null, "job desc")).rejects.toThrow("Network error");
  });

  it("throws with API error detail on non-ok response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ detail: "Rate limit exceeded" }),
    });
    const { generateCV } = await import("../lib/api");
    const cvData = {
      name: "Test", title: "Dev",
      contact: { email: "t@t.com", phone: "0", location: "FR" },
      summary: "S", experience: [], education: [], skills: [],
      certifications: [], languages: [], projects: [],
    };
    await expect(generateCV(cvData, "job", "classic")).rejects.toThrow("Rate limit exceeded");
  });
});
