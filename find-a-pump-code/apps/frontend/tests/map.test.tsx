// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useEffect } from "react";
import Map from "../app/components/Map";
import * as GoogleMapsApi from "@react-google-maps/api";

const mockPanTo = vi.fn();
const mockSetZoom = vi.fn();

type FuelPriceEntry = {
  type: string;
  units: number;
  nanos: number;
  updateTime?: string;
};

type BackendStation = {
  place_id: string;
  name: string;
  kind: "gas" | "ev";
  lat: number;
  lng: number;
  vicinity: string;
  fuelPrices?: FuelPriceEntry[];
};

const fallbackCoords = { lat: 40.2338, lng: -111.6585 };
const userCoords = { lat: 40.25, lng: -111.65 };

function jsonResponse(data: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: async () => data,
  });
}

function makeParams(lat: number, lng: number) {
  return `lat=${lat}&lng=${lng}&radius=5000`;
}

const fallbackStations: BackendStation[] = [
  {
    place_id: "fallback-gas",
    name: "Fallback Fuel",
    kind: "gas",
    lat: 40.234,
    lng: -111.659,
    vicinity: "Fallback Ave",
    fuelPrices: [{ type: "REGULAR_UNLEADED", units: 3, nanos: 199000000 }],
  },
];

const userStations: BackendStation[] = [
  {
    place_id: "gas-1",
    name: "Budget Fuel",
    kind: "gas",
    lat: 40.251,
    lng: -111.651,
    vicinity: "123 Main St",
    fuelPrices: [{ type: "REGULAR_UNLEADED", units: 2, nanos: 900000000 }],
  },
  {
    place_id: "gas-2",
    name: "Premium Fuel",
    kind: "gas",
    lat: 40.252,
    lng: -111.652,
    vicinity: "456 Oak St",
    fuelPrices: [{ type: "REGULAR_UNLEADED", units: 3, nanos: 500000000 }],
  },
  {
    place_id: "ev-1",
    name: "Tesla Supercharger",
    kind: "ev",
    lat: 40.253,
    lng: -111.653,
    vicinity: "789 Pine St",
  },
];

function installDefaultFetchMock() {
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes(`/api/maps/nearby?${makeParams(fallbackCoords.lat, fallbackCoords.lng)}`)) {
      return jsonResponse({ refreshed: true });
    }

    if (url.includes(`/api/maps/nearby?${makeParams(userCoords.lat, userCoords.lng)}`)) {
      return jsonResponse({ refreshed: true });
    }

    if (
      url.includes(`/api/maps/nearby/cached?${makeParams(fallbackCoords.lat, fallbackCoords.lng)}`)
    ) {
      return jsonResponse(fallbackStations);
    }

    if (
      url.includes(`/api/maps/nearby/cached?${makeParams(userCoords.lat, userCoords.lng)}`)
    ) {
      return jsonResponse(userStations);
    }

    if (url.includes("/api/prices/fuel?placeId=")) {
      return jsonResponse([
        { type: "REGULAR_UNLEADED", units: 3, nanos: 299000000 },
      ]);
    }

    return jsonResponse({ message: "Not found" }, false, 404);
  }) as any;
}

function getComboboxes() {
  return screen.getAllByRole("combobox");
  // [0] sort, [1] type, [2] grade
}

function getStationRows() {
  return screen.queryAllByTestId("station-row");
}

function getRowByName(name: string) {
  return getStationRows().find((row) => within(row).queryByText(name));
}

async function waitForRow(name: string) {
  await waitFor(() => {
    expect(getRowByName(name)).toBeTruthy();
  });
}

async function waitForUserRows() {
  await waitFor(() => {
    expect(getRowByName("Budget Fuel")).toBeTruthy();
    expect(getRowByName("Premium Fuel")).toBeTruthy();
    expect(getRowByName("Tesla Supercharger")).toBeTruthy();
  });
}

vi.mock("@react-google-maps/api", () => ({
  useJsApiLoader: vi.fn(() => ({ isLoaded: true })),
  GoogleMap: ({ children, onLoad }: any) => {
    useEffect(() => {
      onLoad?.({
        panTo: mockPanTo,
        setZoom: mockSetZoom,
      });
    }, [onLoad]);

    return <div data-testid="google-map">{children}</div>;
  },
  Marker: () => <div data-testid="user-marker" />,
  MarkerF: ({ onClick }: any) => (
    <button type="button" data-testid="station-marker" onClick={onClick}>
      marker
    </button>
  ),
  InfoWindowF: ({ children }: any) => (
    <div data-testid="info-window">{children}</div>
  ),
}));

describe("Map", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(GoogleMapsApi.useJsApiLoader).mockReturnValue({
      isLoaded: true,
    } as any);

    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:4000";

    Object.defineProperty(global.navigator, "geolocation", {
      value: {
        getCurrentPosition: vi.fn(),
      },
      configurable: true,
    });

    installDefaultFetchMock();
  });

  it("shows loading state before the map API is loaded", () => {
    vi.mocked(GoogleMapsApi.useJsApiLoader).mockReturnValue({
      isLoaded: false,
    } as any);

    render(<Map />);

    expect(screen.getByText("Loading map...")).toBeInTheDocument();
    expect(screen.queryByTestId("google-map")).not.toBeInTheDocument();
  });

  it("renders the map legend", () => {
    render(<Map />);

    expect(screen.getByText("Legend")).toBeInTheDocument();
    expect(screen.getByText("Gas Station")).toBeInTheDocument();
    expect(screen.getByText("EV Charging Station")).toBeInTheDocument();
  });

  it("loads fallback stations immediately", async () => {
    render(<Map />);

    await waitForRow("Fallback Fuel");

    expect(getRowByName("Fallback Fuel")).toBeTruthy();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/maps/nearby?")
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/maps/nearby/cached?")
      );
    });
  });

  it("detects user location, pans the map, and reloads stations for that location", async () => {
    (navigator.geolocation.getCurrentPosition as any).mockImplementation((success: any) => {
      success({
        coords: {
          latitude: userCoords.lat,
          longitude: userCoords.lng,
        },
      });
    });

    render(<Map />);

    await waitFor(() => {
      expect(mockPanTo).toHaveBeenCalledWith(userCoords);
    });

    await waitForUserRows();

    await waitFor(() => {
      expect(getStationRows()).toHaveLength(3);
    });
  });

  it("shows a permission denied message and keeps the fallback area when location access fails", async () => {
    (navigator.geolocation.getCurrentPosition as any).mockImplementation(
      (_success: any, error: any) => {
        setTimeout(() => error({ code: 1, message: "Permission denied" }), 0);
      }
    );
  
    render(<Map />);
  
    await waitFor(() => {
      expect(
        screen.getByText("Location permission denied. Showing the default area.")
      ).toBeInTheDocument();
    });
  
    await waitForRow("Fallback Fuel");
    expect(mockPanTo).not.toHaveBeenCalled();
  });

  it("still loads fallback stations when geolocation is unavailable", async () => {
    Object.defineProperty(global.navigator, "geolocation", {
      value: undefined,
      configurable: true,
    });

    render(<Map />);

    await waitForRow("Fallback Fuel");

    expect(
      screen.queryByText("Geolocation is not supported by this browser.")
    ).not.toBeInTheDocument();
  });

  it("shows an error when the cached nearby stations request fails", async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/maps/nearby?")) {
        return jsonResponse({ refreshed: true });
      }

      if (url.includes("/api/maps/nearby/cached?")) {
        return jsonResponse({ message: "server error" }, false, 500);
      }

      return jsonResponse({ message: "Not found" }, false, 404);
    }) as any;

    render(<Map />);

    expect(
      await screen.findByText("Unable to load nearby stations.")
    ).toBeInTheDocument();
  });

  it("collapses and expands the left station panel", async () => {
    render(<Map />);

    expect(await screen.findByText("Nearby Stations")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Collapse station panel" }));
    expect(screen.queryByText("Nearby Stations")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand station panel" }));
    expect(screen.getByText("Nearby Stations")).toBeInTheDocument();
  });

  it("sorts stations by cheapest price by default", async () => {
    (navigator.geolocation.getCurrentPosition as any).mockImplementation((success: any) => {
      success({
        coords: {
          latitude: userCoords.lat,
          longitude: userCoords.lng,
        },
      });
    });

    render(<Map />);
    await waitForUserRows();

    await waitFor(() => {
      const rows = getStationRows();
      expect(rows).toHaveLength(3);
      expect(rows[0]).toHaveTextContent("Budget Fuel");
      expect(rows[1]).toHaveTextContent("Premium Fuel");
    });
  });

  it("filters stations by type", async () => {
    (navigator.geolocation.getCurrentPosition as any).mockImplementation((success: any) => {
      success({
        coords: {
          latitude: userCoords.lat,
          longitude: userCoords.lng,
        },
      });
    });

    render(<Map />);
    await waitForUserRows();

    const [, typeSelect] = getComboboxes();
    fireEvent.change(typeSelect, { target: { value: "ev" } });

    await waitFor(() => {
      const rows = getStationRows();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent("Tesla Supercharger");
    });
  });

  it("filters gas stations by fuel grade and shows N/A when the selected grade is unavailable", async () => {
    (navigator.geolocation.getCurrentPosition as any).mockImplementation((success: any) => {
      success({
        coords: {
          latitude: userCoords.lat,
          longitude: userCoords.lng,
        },
      });
    });

    render(<Map />);
    await waitForUserRows();

    const [, , gradeSelect] = getComboboxes();
    fireEvent.change(gradeSelect, { target: { value: "PREMIUM" } });

    await waitFor(() => {
      const budgetRow = getRowByName("Budget Fuel");
      expect(budgetRow).toBeTruthy();
      expect(budgetRow!).toHaveTextContent("N/A");
    });
  });

  it("sorts by closest when the sort option changes", async () => {
    (navigator.geolocation.getCurrentPosition as any).mockImplementation((success: any) => {
      success({
        coords: {
          latitude: userCoords.lat,
          longitude: userCoords.lng,
        },
      });
    });

    render(<Map />);
    await waitForUserRows();

    const [sortSelect] = getComboboxes();
    fireEvent.change(sortSelect, { target: { value: "closest" } });

    await waitFor(() => {
      const rows = getStationRows();
      expect(rows[0]).toHaveTextContent("Budget Fuel");
    });
  });

  it("focuses a station when its row is clicked", async () => {
    (navigator.geolocation.getCurrentPosition as any).mockImplementation((success: any) => {
      success({
        coords: {
          latitude: userCoords.lat,
          longitude: userCoords.lng,
        },
      });
    });

    render(<Map />);
    await waitForUserRows();

    const premiumRow = getRowByName("Premium Fuel");
    expect(premiumRow).toBeTruthy();

    fireEvent.click(premiumRow!);

    await waitFor(() => {
      expect(mockPanTo).toHaveBeenCalledWith({
        lat: 40.252,
        lng: -111.652,
      });
      expect(mockSetZoom).toHaveBeenCalledWith(14);
    });
  });
});