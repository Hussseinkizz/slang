import { describe, expect, it } from "vitest";
import { safeTry } from "../index";

describe("safeTry", () => {
  describe("synchronous functions", () => {
    it("returns result on success", async () => {
      const { result, error } = await safeTry(() => {
        return "success";
      });

      expect(result).toBe("success");
      expect(error).toBeNull();
    });

    it("captures error on failure", async () => {
      const { result, error } = await safeTry(() => {
        throw new Error("sync error");
      });

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe("sync error");
    });

    it("returns result with complex types", async () => {
      const { result, error } = await safeTry(() => {
        return { id: 1, name: "test" };
      });

      expect(result).toEqual({ id: 1, name: "test" });
      expect(error).toBeNull();
    });

    it("converts non-Error to Error", async () => {
      const { result, error } = await safeTry(() => {
        throw "string error";
      });

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe("string error");
    });
  });

  describe("asynchronous functions", () => {
    it("returns result on async success", async () => {
      const { result, error } = await safeTry(async () => {
        return "async success";
      });

      expect(result).toBe("async success");
      expect(error).toBeNull();
    });

    it("captures error on async failure", async () => {
      const { result, error } = await safeTry(async () => {
        throw new Error("async error");
      });

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe("async error");
    });

    it("handles async operations", async () => {
      const { result, error } = await safeTry(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "delayed";
      });

      expect(result).toBe("delayed");
      expect(error).toBeNull();
    });

    it("converts non-Error async throws to Error", async () => {
      const { result, error } = await safeTry(async () => {
        throw { custom: "object" };
      });

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe("[object Object]");
    });
  });

  describe("throw option", () => {
    it("re-throws sync errors when throw is true", async () => {
      await expect(
        safeTry(() => {
          throw new Error("should throw");
        }, { throw: true })
      ).rejects.toThrow("should throw");
    });

    it("re-throws async errors when throw is true", async () => {
      await expect(
        safeTry(async () => {
          throw new Error("async should throw");
        }, { throw: true })
      ).rejects.toThrow("async should throw");
    });

    it("does not throw when throw is false", async () => {
      const { result, error } = await safeTry(() => {
        throw new Error("captured");
      }, { throw: false });

      expect(result).toBeNull();
      expect(error?.message).toBe("captured");
    });

    it("does not throw by default", async () => {
      const { result, error } = await safeTry(() => {
        throw new Error("default captured");
      });

      expect(result).toBeNull();
      expect(error?.message).toBe("default captured");
    });
  });

  describe("edge cases", () => {
    it("handles null return value", async () => {
      const { result, error } = await safeTry(() => {
        return null;
      });

      expect(result).toBeNull();
      expect(error).toBeNull();
    });

    it("handles undefined return value", async () => {
      const { result, error } = await safeTry(() => {
        return undefined;
      });

      expect(result).toBeUndefined();
      expect(error).toBeNull();
    });

    it("handles 0 return value", async () => {
      const { result, error } = await safeTry(() => {
        return 0;
      });

      expect(result).toBe(0);
      expect(error).toBeNull();
    });

    it("handles false return value", async () => {
      const { result, error } = await safeTry(() => {
        return false;
      });

      expect(result).toBe(false);
      expect(error).toBeNull();
    });

    it("handles empty string return value", async () => {
      const { result, error } = await safeTry(() => {
        return "";
      });

      expect(result).toBe("");
      expect(error).toBeNull();
    });
  });
});
