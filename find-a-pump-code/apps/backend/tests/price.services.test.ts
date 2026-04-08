import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../src/app.ts";
import * as priceService from "../src/services/price.services.ts";

describe("price routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /api/prices/fuel returns 400 when placeId is missing", async () => {
    const res = await request(app).get("/api/prices/fuel");

    expect(res.status).toBe(400);
  });

  it("GET /api/prices/fuel returns fuel prices for a valid placeId", async () => {
    vi.spyOn(priceService, "getFuelPricesByPlaceId").mockResolvedValue([
      {
        type: "REGULAR",
        units: 3,
        nanos: 450000000,
        updateTime: "2026-04-07T12:00:00Z",
      },
      {
        type: "DIESEL",
        units: 3,
        nanos: 990000000,
        updateTime: "2026-04-07T12:00:00Z",
      },
    ]);

    const res = await request(app).get("/api/prices/fuel?placeId=test-place-id");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        type: "REGULAR",
        units: 3,
        nanos: 450000000,
        updateTime: "2026-04-07T12:00:00Z",
      },
      {
        type: "DIESEL",
        units: 3,
        nanos: 990000000,
        updateTime: "2026-04-07T12:00:00Z",
      },
    ]);
  });

  it("GET /api/prices/fuel returns 500 when the service throws", async () => {
    vi.spyOn(priceService, "getFuelPricesByPlaceId").mockRejectedValue(
      new Error("Google API failed")
    );

    const res = await request(app).get("/api/prices/fuel?placeId=test-place-id");

    expect(res.status).toBe(500);
  });
});