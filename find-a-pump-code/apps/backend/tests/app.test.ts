import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/app";

describe("App", () => {
  it("GET / should return hello from root", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.text).toBe("hello from root");
  });

  it("allows localhost origin", async () => {
    const res = await request(app)
      .get("/")
      .set("Origin", "http://localhost:3000");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000"
    );
  });

  it("blocks disallowed origin", async () => {
    const res = await request(app)
      .get("/")
      .set("Origin", "http://evil.com");

    // Express + CORS will usually throw → 500
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});