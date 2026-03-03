import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getAllStations,
  getStationById,
  getStationsNearby,
} from "../../src/controllers/station.controller";
import * as stationService from "../../src/services/station.service";

vi.mock("../../src/services/station.service", () => ({
  getStationsWithPrices: vi.fn(),
  getStationById: vi.fn(),
  getStationsByLocation: vi.fn(),
}));

type MockRes = {
  statusCode: number;
  body: any;
  status: (code: number) => MockRes;
  json: (payload: any) => MockRes;
};

function createRes(): MockRes {
  const res: MockRes = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe("FN-WB station.controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("FN-WB-SC-001: getAllStations success path", async () => {
    vi.mocked(stationService.getStationsWithPrices).mockResolvedValueOnce([
      { id: "s1" },
    ] as any);
    const req = {} as any;
    const res = createRes();

    await getAllStations(req, res as any);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: "s1" }]);
  });

  it("FN-WB-SC-102: getStationById not-found branch", async () => {
    vi.mocked(stationService.getStationById).mockResolvedValueOnce(null as any);
    const req = { params: { id: "missing" } } as any;
    const res = createRes();

    await getStationById(req, res as any);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toContain("Station not found");
  });

  it("FN-WB-SC-202: getStationsNearby default radius branch", async () => {
    vi.mocked(stationService.getStationsByLocation).mockResolvedValueOnce([] as any);
    const req = {
      query: { latitude: "40.23", longitude: "-111.65" },
    } as any;
    const res = createRes();

    await getStationsNearby(req, res as any);

    expect(stationService.getStationsByLocation).toHaveBeenCalledWith(
      40.23,
      -111.65,
      10
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });
});
