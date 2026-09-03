import { describe, it, expect } from "vitest";
import {
  parseCell,
  extractCellMeta,
  parseRow,
  mapWialonError,
  createError,
} from "../src/services/wialon-reports";
import { ReportRow } from "../src/types";

// ─── parseCell ───────────────────────────────────────────────────────────────

describe("parseCell", () => {
  it("returns string as-is", () => {
    expect(parseCell("hello")).toBe("hello");
  });

  it("returns number as-is", () => {
    expect(parseCell(42)).toBe(42);
  });

  it("returns 0 as-is", () => {
    expect(parseCell(0)).toBe(0);
  });

  it("extracts .t from cell object with text", () => {
    expect(parseCell({ t: "03:10:14", v: 123 })).toBe("03:10:14");
  });

  it("extracts .v from cell object without .t", () => {
    expect(parseCell({ v: 123 })).toBe(123);
  });

  it("extracts .t over .v when both present", () => {
    expect(parseCell({ t: "text", v: 999 })).toBe("text");
  });

  it("extracts .t from cell with coordinates", () => {
    const cell = { t: "16.823, 96.183", v: 0, y: 16.823, x: 96.183, u: 5731 };
    expect(parseCell(cell)).toBe("16.823, 96.183");
  });

  it("handles empty string", () => {
    expect(parseCell("")).toBe("");
  });

  it("handles negative numbers", () => {
    expect(parseCell(-5)).toBe(-5);
  });

  it("handles decimal numbers", () => {
    expect(parseCell(3.14)).toBe(3.14);
  });
});

// ─── extractCellMeta ─────────────────────────────────────────────────────────

describe("extractCellMeta", () => {
  it("returns undefined for string cells", () => {
    expect(extractCellMeta("hello")).toBeUndefined();
  });

  it("returns undefined for number cells", () => {
    expect(extractCellMeta(42)).toBeUndefined();
  });

  it("extracts lat/lon from location cell", () => {
    const cell = { t: "Location", v: 0, y: 16.823, x: 96.183 };
    const meta = extractCellMeta(cell);
    expect(meta).toEqual({ lat: 16.823, lon: 96.183, numericValue: 0 });
  });

  it("extracts only lat when lon missing", () => {
    const cell = { t: "Location", v: 0, y: 16.823 };
    const meta = extractCellMeta(cell);
    expect(meta).toEqual({ lat: 16.823, numericValue: 0 });
  });

  it("extracts only lon when lat missing", () => {
    const cell = { t: "Location", v: 0, x: 96.183 };
    const meta = extractCellMeta(cell);
    expect(meta).toEqual({ lon: 96.183, numericValue: 0 });
  });

  it("extracts numericValue when present", () => {
    const cell = { t: "text", v: 123 };
    const meta = extractCellMeta(cell);
    expect(meta).toEqual({ numericValue: 123 });
  });

  it("extracts lat, lon, and numericValue together", () => {
    const cell = { t: "text", v: 456, y: 16.8, x: 96.1 };
    const meta = extractCellMeta(cell);
    expect(meta).toEqual({ lat: 16.8, lon: 96.1, numericValue: 456 });
  });

  it("returns undefined for empty cell object", () => {
    const cell = { t: "text" };
    const meta = extractCellMeta(cell);
    expect(meta).toBeUndefined();
  });

  it("returns undefined for array cells", () => {
    const cell = [1, 2, 3] as unknown as { t: string; v: number };
    expect(extractCellMeta(cell)).toBeUndefined();
  });

  it("returns undefined for null", () => {
    expect(extractCellMeta(null as unknown as string)).toBeUndefined();
  });
});

// ─── parseRow ────────────────────────────────────────────────────────────────

describe("parseRow", () => {
  const headers = ["Date", "Start", "End", "Mileage"];

  it("maps cells to header names", () => {
    const row: ReportRow = {
      n: 0,
      i1: 0,
      i2: 100,
      t1: 1787800000,
      t2: 1787820000,
      d: 5,
      c: ["2026-08-27", "03:10:14", "09:42:04", "77.89 km"],
    };

    const result = parseRow(row, headers);

    expect(result["Date"]).toBe("2026-08-27");
    expect(result["Start"]).toBe("03:10:14");
    expect(result["End"]).toBe("09:42:04");
    expect(result["Mileage"]).toBe("77.89 km");
  });

  it("adds _rowIndex metadata", () => {
    const row: ReportRow = {
      n: 3,
      i1: 0,
      i2: 100,
      t1: 1787800000,
      t2: 1787820000,
      d: 0,
      c: ["a", "b"],
    };

    const result = parseRow(row, ["col1", "col2"]);
    expect(result["_rowIndex"]).toBe(3);
  });

  it("adds _messageRange metadata", () => {
    const row: ReportRow = {
      n: 0,
      i1: 50,
      i2: 200,
      t1: 0,
      t2: 0,
      d: 0,
      c: [],
    };

    const result = parseRow(row, []);
    expect(result["_messageRange"]).toBe("50-200");
  });

  it("adds _timeRange metadata", () => {
    const row: ReportRow = {
      n: 0,
      i1: 0,
      i2: 0,
      t1: 1787800000,
      t2: 1787820000,
      d: 0,
      c: [],
    };

    const result = parseRow(row, []);
    expect(result["_timeRange"]).toBe("1787800000-1787820000");
  });

  it("adds _childCount metadata", () => {
    const row: ReportRow = {
      n: 0,
      i1: 0,
      i2: 0,
      t1: 0,
      t2: 0,
      d: 12,
      c: [],
    };

    const result = parseRow(row, []);
    expect(result["_childCount"]).toBe(12);
  });

  it("extracts lat/lon from location cells", () => {
    const row: ReportRow = {
      n: 0,
      i1: 0,
      i2: 0,
      t1: 0,
      t2: 0,
      d: 0,
      c: [
        "2026-08-27",
        { t: "03:10:14", v: 1787800214, y: 16.823, x: 96.183, u: 5731 },
      ],
    };

    const result = parseRow(row, ["Date", "Start"]);
    expect(result["Start"]).toBe("03:10:14");
    expect(result["Start_lat"]).toBe(16.823);
    expect(result["Start_lon"]).toBe(96.183);
  });

  it("handles empty header — no cells mapped (loop skipped)", () => {
    const row: ReportRow = {
      n: 0,
      i1: 0,
      i2: 0,
      t1: 0,
      t2: 0,
      d: 0,
      c: ["a", "b"],
    };

    const result = parseRow(row, []);
    // With empty header, loop condition i < header.length fails immediately
    // so no cells are mapped. Only metadata fields are present.
    expect(result["_rowIndex"]).toBe(0);
    expect(result["col_0"]).toBeUndefined();
  });

  it("handles more cells than headers", () => {
    const row: ReportRow = {
      n: 0,
      i1: 0,
      i2: 0,
      t1: 0,
      t2: 0,
      d: 0,
      c: ["a", "b", "c", "d"],
    };

    const result = parseRow(row, ["col1", "col2"]);
    expect(result["col1"]).toBe("a");
    expect(result["col2"]).toBe("b");
    // Extra cells are ignored
    expect(result["col_2"]).toBeUndefined();
  });

  it("handles more headers than cells", () => {
    const row: ReportRow = {
      n: 0,
      i1: 0,
      i2: 0,
      t1: 0,
      t2: 0,
      d: 0,
      c: ["a"],
    };

    const result = parseRow(row, ["col1", "col2", "col3"]);
    expect(result["col1"]).toBe("a");
    expect(result["col2"]).toBeUndefined();
    expect(result["col3"]).toBeUndefined();
  });
});

// ─── mapWialonError ──────────────────────────────────────────────────────────

describe("mapWialonError", () => {
  it("returns 'Success' for code 0", () => {
    expect(mapWialonError(0)).toBe("Success");
  });

  it("returns 'Invalid session' for code 1", () => {
    expect(mapWialonError(1)).toBe("Invalid session");
  });

  it("returns 'Invalid service name' for code 2", () => {
    expect(mapWialonError(2)).toBe("Invalid service name");
  });

  it("returns 'Access denied' for code 7", () => {
    expect(mapWialonError(7)).toBe("Access denied");
  });

  it("returns 'Invalid user name or password' for code 8", () => {
    expect(mapWialonError(8)).toBe("Invalid user name or password");
  });

  it("returns 'No messages for the given interval' for code 1001", () => {
    expect(mapWialonError(1001)).toBe("No messages for the given interval");
  });

  it("returns 'Your IP has changed or session has expired' for code 1011", () => {
    expect(mapWialonError(1011)).toBe("Your IP has changed or session has expired");
  });

  it("returns fallback message for unknown codes", () => {
    expect(mapWialonError(9999)).toBe("Wialon error code: 9999");
  });

  it("returns fallback message for negative codes", () => {
    expect(mapWialonError(-1)).toBe("Wialon error code: -1");
  });
});

// ─── createError ─────────────────────────────────────────────────────────────

describe("createError", () => {
  it("creates error with all fields", () => {
    const err = createError(502, "WIALON_API_ERROR", "Invalid session");
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe("WIALON_API_ERROR");
    expect(err.message).toBe("Invalid session");
  });

  it("creates error with empty message", () => {
    const err = createError(400, "VALIDATION", "");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION");
    expect(err.message).toBe("");
  });
});
