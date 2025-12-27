import { describe, expect, it } from "vitest";
import { zip, zipWith, unzip } from "../index";

describe("zip", () => {
  describe("basic array zipping", () => {
    it("zips two arrays of same length", () => {
      const arr1 = [1, 2, 3];
      const arr2 = [4, 5, 6];
      const result = zip([arr1, arr2]);
      expect(result).toEqual([
        [1, 4],
        [2, 5],
        [3, 6],
      ]);
    });

    it("zips three arrays of same length", () => {
      const arr1 = [1, 2, 3];
      const arr2 = [4, 5, 6];
      const arr3 = [7, 8, 9];
      const result = zip([arr1, arr2, arr3]);
      expect(result).toEqual([
        [1, 4, 7],
        [2, 5, 8],
        [3, 6, 9],
      ]);
    });

    it("returns empty array for empty input", () => {
      const result = zip([]);
      expect(result).toEqual([]);
    });

    it("zips single array", () => {
      const arr = [1, 2, 3];
      const result = zip([arr]);
      expect(result).toEqual([[1], [2], [3]]);
    });
  });

  describe("different length arrays", () => {
    it("stops at shortest array by default", () => {
      const arr1 = [1, 2, 3];
      const arr2 = [4, 5];
      const result = zip([arr1, arr2]);
      expect(result).toEqual([
        [1, 4],
        [2, 5],
      ]);
    });

    it("stops at shortest when first array is shorter", () => {
      const arr1 = [1, 2];
      const arr2 = [4, 5, 6];
      const result = zip([arr1, arr2]);
      expect(result).toEqual([
        [1, 4],
        [2, 5],
      ]);
    });

    it("handles empty array in inputs", () => {
      const arr1 = [1, 2, 3];
      const arr2: number[] = [];
      const result = zip([arr1, arr2]);
      expect(result).toEqual([]);
    });
  });

  describe("fillValue option", () => {
    it("extends to longest array with fillValue", () => {
      const arr1 = [1, 2, 3];
      const arr2 = [10, 20];
      const result = zip([arr1, arr2], { fillValue: 0 });
      expect(result).toEqual([
        [1, 10],
        [2, 20],
        [3, 0],
      ]);
    });

    it("fills multiple positions when arrays differ significantly", () => {
      const arr1 = [1, 2, 3, 4, 5];
      const arr2 = [10];
      const result = zip([arr1, arr2], { fillValue: -1 });
      expect(result).toEqual([
        [1, 10],
        [2, -1],
        [3, -1],
        [4, -1],
        [5, -1],
      ]);
    });

    it("works with three arrays and fillValue", () => {
      const arr1 = [1, 2];
      const arr2 = [10, 20, 30];
      const arr3 = [100];
      const result = zip([arr1, arr2, arr3], { fillValue: 0 });
      expect(result).toEqual([
        [1, 10, 100],
        [2, 20, 0],
        [0, 30, 0],
      ]);
    });

    it("accepts string fillValue", () => {
      const arr1 = ["a", "b", "c"];
      const arr2 = ["x"];
      const result = zip([arr1, arr2], { fillValue: "z" });
      expect(result).toEqual([
        ["a", "x"],
        ["b", "z"],
        ["c", "z"],
      ]);
    });

    it("accepts zero as fillValue", () => {
      const arr1 = [1, 2];
      const arr2 = [10];
      const result = zip([arr1, arr2], { fillValue: 0 });
      expect(result).toEqual([
        [1, 10],
        [2, 0],
      ]);
    });
  });

  describe("Sets with includeValues", () => {
    it("zips two Sets when includeValues is true", () => {
      const s1 = new Set([10, 20, 30]);
      const s2 = new Set([100, 200, 300]);
      const result = zip([s1, s2], { includeValues: true });
      expect(result).toEqual([
        [10, 100],
        [20, 200],
        [30, 300],
      ]);
    });

    it("throws error when zipping Sets without includeValues", () => {
      const s1 = new Set([1, 2]);
      const s2 = new Set([3, 4]);
      expect(() => zip([s1, s2])).toThrow(
        "Only arrays allowed when includeValues=false",
      );
    });

    it("zips Sets with different sizes and fillValue", () => {
      const s1 = new Set([1, 2, 3]);
      const s2 = new Set([10]);
      const result = zip([s1, s2], { includeValues: true, fillValue: 0 });
      expect(result).toEqual([
        [1, 10],
        [2, 0],
        [3, 0],
      ]);
    });
  });

  describe("Objects with includeValues", () => {
    it("zips object values when includeValues is true", () => {
      const o1 = { a: 1, b: 2, c: 3 };
      const o2 = { x: 100, y: 200, z: 300 };
      const result = zip([o1, o2], { includeValues: true });
      expect(result).toEqual([
        [1, 100],
        [2, 200],
        [3, 300],
      ]);
    });

    it("throws error when zipping objects without includeValues", () => {
      const o1 = { a: 1 };
      const o2 = { b: 2 };
      expect(() => zip([o1, o2])).toThrow(
        "Only arrays allowed when includeValues=false",
      );
    });

    it("zips objects with different number of keys", () => {
      const o1 = { a: 1, b: 2 };
      const o2 = { x: 100, y: 200, z: 300 };
      const result = zip([o1, o2], { includeValues: true, fillValue: 0 });
      expect(result).toEqual([
        [1, 100],
        [2, 200],
        [0, 300],
      ]);
    });
  });

  describe("mixed types with includeValues", () => {
    it("does not allow mixing arrays and Sets without includeValues", () => {
      const arr = [1, 2];
      const set = new Set([3, 4]);
      expect(() => zip([arr, set as unknown as number[]])).toThrow(
        "Only arrays allowed when includeValues=false",
      );
    });

    it("does not allow mixing arrays and objects without includeValues", () => {
      const arr = [1, 2];
      const obj = { a: 3, b: 4 };
      expect(() => zip([arr, obj as unknown as number[]])).toThrow(
        "Only arrays allowed when includeValues=false",
      );
    });
  });
});

describe("zipWith", () => {
  describe("basic transformations", () => {
    it("sums corresponding elements", () => {
      const arr1 = [1, 2, 3];
      const arr2 = [4, 5, 6];
      const result = zipWith([arr1, arr2], (t) => (t[0] ?? 0) + (t[1] ?? 0));
      expect(result).toEqual([5, 7, 9]);
    });

    it("applies transformation to three arrays", () => {
      const arr1 = [1, 2, 3];
      const arr2 = [10, 20, 30];
      const arr3 = [100, 200, 300];
      const result = zipWith([arr1, arr2, arr3], (t) =>
        t.reduce((sum, x) => sum + x, 0),
      );
      expect(result).toEqual([111, 222, 333]);
    });

    it("concatenates strings", () => {
      const arr1 = ["a", "b", "c"];
      const arr2 = ["x", "y", "z"];
      const result = zipWith([arr1, arr2], (t) => t.join("-"));
      expect(result).toEqual(["a-x", "b-y", "c-z"]);
    });

    it("returns empty array for empty input", () => {
      const result = zipWith([], (t) => t);
      expect(result).toEqual([]);
    });
  });

  describe("with fillValue", () => {
    it("uses fillValue in transformation", () => {
      const arr1 = [1, 2, 3];
      const arr2 = [10];
      const result = zipWith(
        [arr1, arr2],
        (t) => t.reduce((sum, x) => sum + x, 0),
        { fillValue: 0 },
      );
      expect(result).toEqual([11, 2, 3]);
    });

    it("handles multiple missing values", () => {
      const arr1 = [5, 5, 5, 5];
      const arr2 = [1];
      const result = zipWith(
        [arr1, arr2],
        (t) => (t[0] ?? 0) * (t[1] ?? 0),
        {
          fillValue: 1,
        },
      );
      expect(result).toEqual([5, 5, 5, 5]);
    });
  });

  describe("with includeValues", () => {
    it("works with Sets", () => {
      const s1 = new Set([1, 2, 3]);
      const s2 = new Set([10, 20, 30]);
      const result = zipWith(
        [s1, s2],
        (t) => (t[0] ?? 0) + (t[1] ?? 0),
        {
          includeValues: true,
        },
      );
      expect(result).toEqual([11, 22, 33]);
    });

    it("works with objects", () => {
      const o1 = { a: 1, b: 2 };
      const o2 = { x: 10, y: 20 };
      const result = zipWith(
        [o1, o2],
        (t) => (t[0] ?? 0) * (t[1] ?? 0),
        {
          includeValues: true,
        },
      );
      expect(result).toEqual([10, 40]);
    });
  });

  describe("complex transformations", () => {
    it("creates objects from tuples", () => {
      const keys = ["name", "age", "city"];
      const values: Array<string | number> = ["Alice", 30, "NYC"];
      const result = zipWith(
        [keys, values],
        (t) => ({ [t[0] as string]: t[1] }),
      );
      expect(result).toEqual([
        { name: "Alice" },
        { age: 30 },
        { city: "NYC" },
      ]);
    });

    it("applies mathematical operations", () => {
      const arr1 = [10, 20, 30];
      const arr2 = [2, 4, 5];
      const result = zipWith(
        [arr1, arr2],
        (t) => (t[0] ?? 0) ** (t[1] ?? 0),
      );
      expect(result).toEqual([100, 160000, 24300000]);
    });

    it("finds maximum of corresponding elements", () => {
      const arr1 = [5, 2, 9];
      const arr2 = [3, 8, 7];
      const result = zipWith([arr1, arr2], (t) => Math.max(...t));
      expect(result).toEqual([5, 8, 9]);
    });
  });
});

describe("unzip", () => {
  describe("basic unzipping", () => {
    it("unzips a zipped array back to original arrays", () => {
      const arr1 = [1, 2, 3];
      const arr2 = [4, 5, 6];
      const zipped = zip([arr1, arr2]);
      const result = unzip(zipped);
      expect(result).toEqual([
        [1, 2, 3],
        [4, 5, 6],
      ]);
    });

    it("unzips three arrays", () => {
      const zipped = [
        [1, 4, 7],
        [2, 5, 8],
        [3, 6, 9],
      ];
      const result = unzip(zipped);
      expect(result).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]);
    });

    it("handles empty array", () => {
      const result = unzip([]);
      expect(result).toEqual([]);
    });

    it("unzips single element tuples", () => {
      const zipped = [[1], [2], [3]];
      const result = unzip(zipped);
      expect(result).toEqual([[1, 2, 3]]);
    });
  });

  describe("roundtrip transformations", () => {
    it("zip followed by unzip returns original arrays", () => {
      const arr1 = [1, 2, 3];
      const arr2 = ["a", "b", "c"];
      const arr3 = [true, false, true];
      const zipped = zip([arr1, arr2, arr3]);
      const unzipped = unzip(zipped);
      expect(unzipped).toEqual([arr1, arr2, arr3]);
    });

    it("handles string arrays", () => {
      const arr1 = ["hello", "world"];
      const arr2 = ["foo", "bar"];
      const zipped = zip([arr1, arr2]);
      const unzipped = unzip(zipped);
      expect(unzipped).toEqual([arr1, arr2]);
    });

    it("preserves complex types", () => {
      const arr1 = [{ id: 1 }, { id: 2 }];
      const arr2 = [{ name: "a" }, { name: "b" }];
      const zipped = zip([arr1, arr2]);
      const unzipped = unzip(zipped);
      expect(unzipped).toEqual([arr1, arr2]);
    });
  });

  describe("edge cases", () => {
    it("handles tuples with varying lengths gracefully", () => {
      const zipped: number[][] = [[1, 2, 3], [4, 5], [6]];
      const result = unzip(zipped);
      expect(result[0]).toEqual([1, 4, 6]);
      expect(result[1]).toEqual([2, 5]);
      expect(result[2]).toEqual([3]);
    });

    it("handles single tuple", () => {
      const zipped = [[1, 2, 3]];
      const result = unzip(zipped);
      expect(result).toEqual([[1], [2], [3]]);
    });

    it("handles null and undefined values", () => {
      const zipped: Array<Array<number | null | undefined>> = [
        [1, null],
        [2, undefined],
        [3, null],
      ];
      const result = unzip(zipped);
      expect(result[0]).toEqual([1, 2, 3]);
      expect(result[1]).toEqual([null, undefined, null]);
    });
  });
});

describe("zip utilities integration", () => {
  it("demonstrates column-to-row transformation workflow", () => {
    const names = ["Alice", "Bob", "Charlie"];
    const ages = [25, 30, 35];
    const cities = ["NYC", "LA", "SF"];

    const rows = zip([names, ages, cities]);
    expect(rows).toEqual([
      ["Alice", 25, "NYC"],
      ["Bob", 30, "LA"],
      ["Charlie", 35, "SF"],
    ]);

    const columns = unzip(rows);
    expect(columns).toEqual([names, ages, cities]);
  });

  it("demonstrates data aggregation with zipWith", () => {
    const prices = [10, 20, 30];
    const quantities = [2, 3, 1];
    const discounts = [0, 5, 10];

    const totals = zipWith(
      [prices, quantities, discounts],
      (t) => (t[0] ?? 0) * (t[1] ?? 0) - (t[2] ?? 0),
    );
    expect(totals).toEqual([20, 55, 20]);
  });

  it("works with fillValue across all utilities", () => {
    const arr1 = [1, 2, 3, 4];
    const arr2 = [10, 20];

    const zipped = zip([arr1, arr2], { fillValue: 0 });
    expect(zipped).toEqual([
      [1, 10],
      [2, 20],
      [3, 0],
      [4, 0],
    ]);

    const sums = zipWith(
      [arr1, arr2],
      (t) => (t[0] ?? 0) + (t[1] ?? 0),
      { fillValue: 0 },
    );
    expect(sums).toEqual([11, 22, 3, 4]);

    const unzipped = unzip(zipped);
    expect(unzipped).toEqual([
      [1, 2, 3, 4],
      [10, 20, 0, 0],
    ]);
  });
});
