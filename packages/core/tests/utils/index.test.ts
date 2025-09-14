import { describe, it, expect } from "vitest";
import {
  interpolateQuery,
  formatSqlQuery,
  isStaticFile,
  stripBeforeAssetsPath,
  prepareIgnoredPaths,
  prettyHrTime,
} from "../../src/utils/index";
import { DateTime } from "luxon";

describe("utils", () => {
  describe("interpolateQuery", () => {
    // Array-based ?
    it("should replace ? placeholders with array values", () => {
      const query = "SELECT * FROM users WHERE id = ? AND name = ?";
      const bindings = [1, "John Doe"];
      const expected = "SELECT * FROM users WHERE id = 1 AND name = 'John Doe'";
      expect(interpolateQuery(query, bindings)).toBe(expected);
    });

    it("should throw if not enough array bindings", () => {
      const query = "SELECT * FROM users WHERE id = ? AND name = ?";
      const bindings = [1];
      expect(() => interpolateQuery(query, bindings)).toThrow(
        "Not enough bindings for placeholders",
      );
    });

    it("should handle null and undefined", () => {
      const query = "SELECT * FROM users WHERE id = ? AND name = ?";
      const bindings = [null, undefined];
      const expected = "SELECT * FROM users WHERE id = NULL AND name = NULL";
      expect(interpolateQuery(query, bindings)).toBe(expected);
    });

    it("should handle DateTime and Date objects", () => {
      const query =
        "SELECT * FROM users WHERE created_at > ? AND updated_at > ?";
      const dateTime = DateTime.fromISO("2025-01-01T00:00:00.000Z");
      const date = new Date("2025-01-02T00:00:00.000Z");
      const bindings = [dateTime, date];
      const expected = `SELECT * FROM users WHERE created_at > '${dateTime.toISO()}' AND updated_at > '${date.toISOString()}'`;
      expect(interpolateQuery(query, bindings)).toBe(expected);
    });

    it("should handle arrays", () => {
      const query = "SELECT * FROM users WHERE id IN (?)";
      const bindings = [[1, 2, 3]];
      const expected = "SELECT * FROM users WHERE id IN (1, 2, 3)";
      expect(interpolateQuery(query, bindings)).toBe(expected);
    });

    it("should handle objects", () => {
      const query = "SELECT * FROM users WHERE meta = ?";
      const bindings = [{ key: "value" }];
      const expected = `SELECT * FROM users WHERE meta = '${JSON.stringify({ key: "value" })}'`;
      expect(interpolateQuery(query, bindings)).toBe(expected);
    });

    // Named / numeric placeholders
    it("should replace $1 numeric placeholder", () => {
      const query = "INSERT INTO users (id, name) VALUES (NULL, $1);";
      const bindings = { $1: "John Doe" };
      const expected =
        "INSERT INTO users (id, name) VALUES (NULL, 'John Doe');";
      expect(interpolateQuery(query, bindings)).toBe(expected);
    });

    it("should replace $name named placeholder", () => {
      const query = "UPDATE users SET name = $name WHERE id = $id;";
      const bindings = { name: "Alice", id: 42 };
      const expected = "UPDATE users SET name = 'Alice' WHERE id = 42;";
      expect(interpolateQuery(query, bindings)).toBe(expected);
    });

    it("should replace :name named placeholder", () => {
      const query = "DELETE FROM users WHERE id = :id;";
      const bindings = { id: 7 };
      const expected = "DELETE FROM users WHERE id = 7;";
      expect(interpolateQuery(query, bindings)).toBe(expected);
    });

    it("should throw if named placeholder is missing", () => {
      const query = "SELECT * FROM users WHERE id = :id;";
      const bindings = {};
      expect(() => interpolateQuery(query, bindings)).toThrow(
        "Missing binding for :id",
      );
    });
  });

  describe("formatSqlQuery", () => {
    it("should format the SQL query", () => {
      const query = "select * from users where id = 1";
      const expected = "SELECT\n  *\nFROM\n  users\nWHERE\n  id = 1";
      expect(formatSqlQuery(query, "mysql")).toBe(expected);
    });
  });

  // describe("sqlDateTime", () => {
  //   it("should return the current time in SQL format if no time is provided", () => {
  //     const now = DateTime.now();
  //     const expected = now.toSQL({ includeOffset: false });
  //     // Since the exact time will differ, we check the format and length
  //     expect(sqlDateTime()).toMatch(
  //       /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/,
  //     );
  //     expect(sqlDateTime()?.length).toBe(expected?.length);
  //   });
  //
  //   it("should return the provided time in SQL format", () => {
  //     const dateTime = DateTime.fromISO("2025-01-01T00:00:00.000Z", {
  //       zone: "utc",
  //     });
  //     const expected = "2025-01-01 00:00:00.000";
  //     expect(sqlDateTime(dateTime)).toBe(expected);
  //   });
  // });

  describe("isStaticFile", () => {
    it('should return true if "assets" is in the params', () => {
      expect(isStaticFile(["users", "1", "assets"])).toBe(true);
    });

    it('should return false if "assets" is not in the params', () => {
      expect(isStaticFile(["users", "1", "profile"])).toBe(false);
    });
  });

  describe("stripBeforeAssetsPath", () => {
    it('should return the path from "assets" onwards', () => {
      const url = "/users/1/assets/image.png";
      const expected = "assets/image.png";
      expect(stripBeforeAssetsPath(url)).toBe(expected);
    });

    it('should return the original url if "assets" is not present', () => {
      const url = "/users/1/profile";
      expect(stripBeforeAssetsPath(url)).toBe(url);
    });
  });

  describe("prepareIgnoredPaths", () => {
    it("should return the normalized path and the ignored paths", () => {
      const path = "/api";
      const ignoredPaths = [/^\/admin/];
      const { normalizedPath, ignoredPaths: newIgnoredPaths } =
        prepareIgnoredPaths(path, ignoredPaths);
      expect(normalizedPath).toBe("api");
      expect(newIgnoredPaths).toHaveLength(5);
      newIgnoredPaths[0] &&
        expect(newIgnoredPaths[0].toString()).toBe("/^\\/admin/");
      newIgnoredPaths[1] &&
        expect(newIgnoredPaths[1].toString()).toBe("/^\\/?api(\\/|$)/");
    });
  });

  describe("prettyHrTime", () => {
    it("should format high-resolution time in milliseconds", () => {
      const hrtime: [number, number] = [0, 123456789]; // ~123.45 ms
      expect(prettyHrTime(hrtime)).toBe("123 ms");
    });

    it("should format high-resolution time in seconds", () => {
      const hrtime: [number, number] = [1, 500000000]; // 1.5s
      expect(prettyHrTime(hrtime)).toBe("1.5 s");
    });

    it("should format high-resolution time verbosely", () => {
      const hrtime: [number, number] = [0, 123456789]; // ~123.45 ms
      expect(prettyHrTime(hrtime, true)).toBe("123.457 ms");

      const secondsHrTime: [number, number] = [2, 123456789];
      expect(prettyHrTime(secondsHrTime, true)).toBe("2.12s");

      const minutesHrTime: [number, number] = [65, 123456789];
      expect(prettyHrTime(minutesHrTime, true)).toBe("1m 5s");
    });
  });
});
