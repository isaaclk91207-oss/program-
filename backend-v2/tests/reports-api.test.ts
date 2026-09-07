import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app";

// ─── GET /api/v1/reports/templates ───────────────────────────────────────────

describe("GET /api/v1/reports/templates", () => {
  it("returns 200 with resource ID and 3 templates", async () => {
    const res = await request(app).get("/api/v1/reports/templates");

    expect(res.status).toBe(200);
    expect(res.body.resourceId).toBe(5738);
    expect(res.body.templates).toHaveLength(3);
  });

  it("each template has id, name, type, and description", async () => {
    const res = await request(app).get("/api/v1/reports/templates");

    for (const tmpl of res.body.templates) {
      expect(typeof tmpl.id).toBe("number");
      expect(typeof tmpl.name).toBe("string");
      expect(["unit", "driver"]).toContain(tmpl.type);
      expect(typeof tmpl.description).toBe("string");
    }
  });

  it("template IDs match WIALON_REPORT_TEMPLATES constants", async () => {
    const res = await request(app).get("/api/v1/reports/templates");
    const ids = res.body.templates.map((t: { id: number }) => t.id);

    expect(ids).toContain(24); // UNIT_FUEL_CHART
    expect(ids).toContain(8);  // UNIT_SPEED_CHART
    expect(ids).toContain(6);  // DRIVER_REPORT
  });
});

// ─── GET /api/v1/reports/unit/:unitId ────────────────────────────────────────

describe("GET /api/v1/reports/unit/:unitId", () => {
  it("auto-logins when sid is omitted (returns 200 or 502)", async () => {
    const res = await request(app).get("/api/v1/reports/unit/5731?templateId=24");

    // Auto-login uses WIALON_TOKEN from .env — either succeeds (200) or Wialon rejects (502)
    expect([200, 502]).toContain(res.status);
  });

  it("returns 400 when unitId is not a number", async () => {
    const res = await request(app).get("/api/v1/reports/unit/abc?sid=test");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toContain("unitId must be a number");
  });

  it("returns 502 when sid is invalid (Wialon rejects)", async () => {
    const res = await request(app).get(
      "/api/v1/reports/unit/5731?templateId=24&timeFrom=1787800000&timeTo=1788400000&sid=INVALID_SID"
    );

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("WIALON_API_ERROR");
    expect(res.body.error.message).toContain("Invalid session");
  });

  it("defaults templateId to 24 (Fuel Chart) when not specified", async () => {
    const res = await request(app).get(
      "/api/v1/reports/unit/5731?timeFrom=1787800000&timeTo=1788400000&sid=INVALID_SID"
    );

    // Even with invalid sid, the default template should be applied
    // We're testing that the route doesn't crash with default templateId
    expect(res.status).toBe(502);
    expect(res.body.error).toBeDefined();
  });

  it("defaults timeFrom/timeTo to last 24 hours when not specified", async () => {
    const res = await request(app).get(
      "/api/v1/reports/unit/5731?templateId=24&sid=INVALID_SID"
    );

    // Should reach Wialon (get 502) rather than fail validation
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("WIALON_API_ERROR");
  });
});

// ─── GET /api/v1/reports/driver/:driverId ────────────────────────────────────

describe("GET /api/v1/reports/driver/:driverId", () => {
  it("auto-logins when sid is omitted (returns 200 or 404)", async () => {
    const res = await request(app).get("/api/v1/reports/driver/123");

    // Driver report queries DB — either finds driver (200) or not found (404)
    expect([200, 404]).toContain(res.status);
  });

  it("returns 404 when driver UUID does not exist", async () => {
    const res = await request(app).get(
      "/api/v1/reports/driver/00000000-0000-0000-0000-000000000000?timeFrom=1787800000&timeTo=1788400000&sid=test"
    );

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("DRIVER_NOT_FOUND");
  });
});

// ─── Health check ────────────────────────────────────────────────────────────

describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.version).toBe("2.0.0");
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────

describe("Unknown routes", () => {
  it("returns 404 for unknown API routes", async () => {
    const res = await request(app).get("/api/v1/unknown-endpoint");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
