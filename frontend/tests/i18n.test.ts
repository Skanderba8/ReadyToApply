import { describe, it, expect } from "vitest";
import { u, detectJobLang } from "../lib/i18n";

describe("u() translation", () => {
  it("returns English string", () => {
    expect(u("continue", "en")).toBe("Continue");
  });

  it("returns French string", () => {
    expect(u("continue", "fr")).toBe("Continuer");
  });

  it("falls back to English for unknown lang", () => {
    expect(u("back", "en")).toBe("← Back");
  });

  it("returns key for unknown key", () => {
    expect(u("nonexistent_key_xyz", "en")).toBe("nonexistent_key_xyz");
  });
});

describe("detectJobLang()", () => {
  it("detects French job description", () => {
    const fr = "Nous recherchons un développeur pour rejoindre notre équipe. Le poste est basé en France. Vous travaillerez avec des équipes transversales.";
    expect(detectJobLang(fr)).toBe("fr");
  });

  it("detects English job description", () => {
    const en = "We are looking for a software engineer to join our team. The role involves building scalable systems.";
    expect(detectJobLang(en)).toBe("en");
  });

  it("defaults to English for short text", () => {
    expect(detectJobLang("hello")).toBe("en");
  });
});
