import { describe, expect, it } from "vitest";
import { panic } from "../index";

describe("panic", () => {
  it("throws error with message", () => {
    expect(() => panic("Critical failure")).toThrow("Critical failure");
  });

  it("throws Error instance", () => {
    try {
      panic("Test error");
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).toBe("Test error");
    }
  });

  it("never returns", () => {
    const fn = (): string => {
      panic("Should throw");
      return "unreachable";
    };

    expect(fn).toThrow("Should throw");
  });

  it("works in guard clauses", () => {
    function processValue(value: string | null): string {
      if (!value) panic("Value required");
      return value.toUpperCase();
    }

    expect(() => processValue(null)).toThrow("Value required");
    expect(processValue("hello")).toBe("HELLO");
  });

  it("handles empty message", () => {
    expect(() => panic("")).toThrow("");
  });

  it("works with special characters", () => {
    const msg = "Error: 'Something' went wrong!";
    expect(() => panic(msg)).toThrow(msg);
  });
});
