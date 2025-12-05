import { describe, expect, it } from "vitest";
import { println } from "../index";

describe("utilities", () => {
  describe("println", () => {
    it("logs to console when available", () => {
      const spy = { calls: [] as any[][] };
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        spy.calls.push(args);
      };

      println("test", 123, true);

      console.log = originalLog;

      expect(spy.calls.length).toBe(1);
      expect(spy.calls[0]).toEqual(["test", 123, true]);
    });

    it("handles multiple arguments", () => {
      const spy = { calls: [] as any[][] };
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        spy.calls.push(args);
      };

      println("a", "b", "c");

      console.log = originalLog;

      expect(spy.calls[0]).toEqual(["a", "b", "c"]);
    });

    it("handles no arguments", () => {
      const spy = { calls: [] as any[][] };
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        spy.calls.push(args);
      };

      println();

      console.log = originalLog;

      expect(spy.calls.length).toBe(1);
      expect(spy.calls[0]).toEqual([]);
    });
  });
});
