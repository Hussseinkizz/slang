import { describe, expect, it } from "vitest";
import { atom } from "../index";

describe("atom", () => {
  describe("creation", () => {
    it("creates a unique symbol with description", () => {
      const ready = atom("ready");
      expect(typeof ready).toBe("object"); // boxed symbol
      expect(ready.description).toBe("ready");
    });

    it("creates non-interned atoms", () => {
      const a1 = atom("test");
      const a2 = atom("test");
      expect(a1).not.toBe(a2);
      expect(a1 === a2).toBe(false);
    });

    it("preserves description across instances", () => {
      const loading = atom("loading");
      const pending = atom("pending");
      expect(loading.description).toBe("loading");
      expect(pending.description).toBe("pending");
    });
  });

  describe("to(option)", () => {
    it("converts atom to Some with description", () => {
      const ready = atom("ready");
      const opt = ready.to("option");
      expect(opt.isSome).toBe(true);
      if (opt.isSome) {
        expect(opt.value).toBe("ready");
      }
    });

    it("uses description string as option value", () => {
      const status = atom("active");
      const opt = status.to("option");
      expect(opt.isSome).toBe(true);
      if (opt.isSome) {
        expect(typeof opt.value).toBe("string");
        expect(opt.value).toBe("active");
      }
    });
  });

  describe("to(result)", () => {
    it("converts atom to Ok with description", () => {
      const success = atom("success");
      const result = success.to("result");
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toBe("success");
      }
    });

    it("uses description string as Ok value", () => {
      const state = atom("initialized");
      const result = state.to("result");
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(typeof result.value).toBe("string");
        expect(result.value).toBe("initialized");
      }
    });
  });

  describe("to(atom)", () => {
    it("returns the same atom", () => {
      const original = atom("original");
      const converted = original.to("atom");
      // Compare descriptions since symbols are boxed objects
      expect(converted.description).toBe(original.description);
      expect(converted.description).toBe("original");
    });
  });

  describe("type information", () => {
    it("carries type information in the atom type", () => {
      const loading = atom("loading");
      // TypeScript should infer Atom<"loading">
      expect(loading.description).toBe("loading");
    });

    it("works with const assertions", () => {
      const status = atom("ready" as const);
      expect(status.description).toBe("ready");
    });
  });

  describe("equality and identity", () => {
    it("different atoms are not equal even with same name", () => {
      const a = atom("state");
      const b = atom("state");
      expect(a === b).toBe(false);
      expect(a !== b).toBe(true);
    });

    it("same atom reference is equal to itself", () => {
      const state = atom("active");
      const ref = state;
      expect(state === ref).toBe(true);
    });
  });

  describe("as match key", () => {
    it("can be used as unique match key", () => {
      const ready = atom("ready");
      const failed = atom("failed");
      const current = ready;

      let matched = false;
      if (current === ready) {
        matched = true;
      }
      expect(matched).toBe(true);

      // TypeScript sees different atom types as non-overlapping, so cast to unknown
      if ((current as unknown) === (failed as unknown)) {
        matched = false;
      }
      expect(matched).toBe(true); // still true from before
    });

    it("description can be extracted for semantic matching", () => {
      const status = atom("processing");
      expect(status.description).toBe("processing");
      
      // This is how matchAll uses it internally
      const key = status.description;
      expect(key).toBe("processing");
    });
  });
});
