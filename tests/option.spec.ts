import { describe, expect, it } from "vitest";
import { option } from "../index";

describe("option", () => {
  describe("creation", () => {
    it("creates Some for truthy values", () => {
      const a = option("hello");
      expect(a.isSome).toBe(true);
      expect(a.isNone).toBe(false);
      expect(a.type).toBe("Some");
      if (a.isSome) {
        expect(a.value).toBe("hello");
      }
    });

    it("creates Some for numeric zero", () => {
      const a = option(0);
      expect(a.isSome).toBe(true);
      if (a.isSome) {
        expect(a.value).toBe(0);
      }
    });

    it("treats NaN as None", () => {
      const a = option(Number.NaN);
      expect(a.isNone).toBe(true);
      expect(a.type).toBe("None");
    });

    it("treats Infinity as None", () => {
      const a = option(Infinity);
      expect(a.isNone).toBe(true);
    });

    it("treats -Infinity as None", () => {
      const a = option(-Infinity);
      expect(a.isNone).toBe(true);
    });

    it("creates Some for boolean false", () => {
      const a = option(false);
      expect(a.isSome).toBe(true);
      if (a.isSome) {
        expect(a.value).toBe(false);
      }
    });

    it("creates None for null", () => {
      const a = option(null);
      expect(a.isNone).toBe(true);
      expect(a.isSome).toBe(false);
      expect(a.type).toBe("None");
    });

    it("creates None for undefined", () => {
      const a = option(undefined);
      expect(a.isNone).toBe(true);
      expect(a.type).toBe("None");
    });

    it("creates None for empty string", () => {
      const a = option("");
      expect(a.isNone).toBe(true);
      expect(a.type).toBe("None");
    });

    it("creates Some for objects and arrays", () => {
      const obj = option({ key: "value" });
      const arr = option([1, 2, 3]);
      expect(obj.isSome).toBe(true);
      expect(arr.isSome).toBe(true);
    });
  });

  describe("expect", () => {
    it("returns value for Some", () => {
      const a = option(42);
      expect(a.expect()).toBe(42);
      expect(a.expect("custom message")).toBe(42);
    });

    it("throws default error for None", () => {
      const a = option(null);
      expect(() => a.expect()).toThrow("Expected Some, got None");
    });

    it("throws custom error for None", () => {
      const a = option(undefined);
      expect(() => a.expect("must be present")).toThrow("must be present");
    });
  });

  describe("unwrap().else()", () => {
    describe("Some path", () => {
      it("returns inner value and ignores else", () => {
        const a = option(20);
        const result = a.unwrap().else(-1);
        expect(result).toBe(20);
      });

      it("ignores else function for Some", () => {
        const value: string = "hello";
        const a = option(value);
        const result = a.unwrap().else(() => "fallback");
        expect(result).toBe("hello");
      });
    });

    describe("None path", () => {
      it("uses else value for None", () => {
        const a = option<number | null>(null);
        const result = a.unwrap().else(99);
        expect(result).toBe(99);
      });

      it("calls else function with undefined for None", () => {
        const a = option<number | undefined>(undefined);
        let receivedValue: any;
        const result = a.unwrap().else((val) => {
          receivedValue = val;
          return 42;
        });
        expect(receivedValue).toBe(undefined);
        expect(result).toBe(42);
      });

      it("throws if else returns falsy value", () => {
        const a = option<string | null>(null);
        expect(() => a.unwrap().else("")).toThrow("Fallback must be truthy");
      });

      it("throws if else function returns null", () => {
        const a = option<number | null>(null);
        expect(() => a.unwrap().else(() => null as any)).toThrow(
          "Fallback must be truthy",
        );
      });

      it("throws if else function returns undefined", () => {
        const a = option<number | null>(null);
        expect(() => a.unwrap().else(() => undefined as any)).toThrow(
          "Fallback must be truthy",
        );
      });

      it("throws if else returns NaN", () => {
        const a = option<number | null>(null);
        expect(() => a.unwrap().else(() => Number.NaN as any)).toThrow(
          "Fallback must be truthy",
        );
      });

      it("throws if else returns Infinity", () => {
        const a = option<number | null>(null);
        expect(() => a.unwrap().else(() => Infinity as any)).toThrow(
          "Fallback must be truthy",
        );
      });

      it("throws if else returns -Infinity", () => {
        const a = option<number | null>(null);
        expect(() => a.unwrap().else(() => -Infinity as any)).toThrow(
          "Fallback must be truthy",
        );
      });

      it("accepts else function returning 0", () => {
        const a = option<number | null>(null);
        const result = a.unwrap().else(() => 0);
        expect(result).toBe(0);
      });

      it("accepts else function returning false", () => {
        const a = option<boolean | null>(null);
        const result = a.unwrap().else(() => false);
        expect(result).toBe(false);
      });
    });

    describe("missing else chain", () => {
      it("documents microtask throw behavior for Some", () => {
        // If .else() is not called, microtask throws "Expected else"
        // This test documents the behavior without triggering it
        const a = option(20);
        const chain = a.unwrap();
        expect(chain).toHaveProperty("else");
        chain.else(-1); // Complete the chain to avoid throw
      });

      it("documents microtask throw behavior for None", () => {
        // If .else() is not called, microtask throws "Expected else"
        // This test documents the behavior without triggering it
        const a = option<number | null>(null);
        const chain = a.unwrap();
        expect(chain).toHaveProperty("else");
        chain.else(0); // Complete the chain to avoid throw
      });
    });
  });

  describe("type narrowing", () => {
    it("narrows to Some when isSome is true", () => {
      const a = option("test");
      if (a.isSome) {
        // TypeScript should narrow here
        const val: string = a.value;
        expect(val).toBe("test");
      }
    });

    it("narrows to None when isNone is true", () => {
      const a = option(null);
      if (a.isNone) {
        // TypeScript should know this is None
        expect(a.type).toBe("None");
      }
    });
  });
});
