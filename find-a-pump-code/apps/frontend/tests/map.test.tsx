// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useEffect } from "react";
import Map from "../app/components/Map";
import * as GoogleMapsApi from "@react-google-maps/api";

const mockPanTo = vi.fn();
const nearbySearchMock = vi.fn();
let markerProps: any[] = [];

vi.mock("@react-google-maps/api", () => ({
  useJsApiLoader: vi.fn(() => ({ isLoaded: true })),
  GoogleMap: ({ children, onLoad }: any) => {
    useEffect(() => {
      onLoad?.({ panTo: mockPanTo });
    }, [onLoad]);

    return <div data-testid="google-map">{children}</div>;
  },
  Marker: (props: any) => {
    markerProps.push(props);
    return <div data-testid="marker" data-title={props.title || ""} />;
  },
}));

describe("Map", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    markerProps = [];
    nearbySearchMock.mockReset();

    vi.mocked(GoogleMapsApi.useJsApiLoader).mockReturnValue({ isLoaded: true } as any);

    Object.defineProperty(global.navigator, "geolocation", {
      value: {
        getCurrentPosition: vi.fn(),
      },
      configurable: true,
    });

    (globalThis as any).google = {
      maps: {
        places: {
          PlacesServiceStatus: {
            OK: "OK",
            ZERO_RESULTS: "ZERO_RESULTS",
          },
          PlacesService: vi.fn(() => ({
            nearbySearch: nearbySearchMock,
          })),
        },
      },
    };

    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ fuelOptions: { fuelPrices: [] } }),
    }));

    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-key";
  });

  it("shows loading state before the map API is loaded", () => {
    vi.mocked(GoogleMapsApi.useJsApiLoader).mockReturnValue({ isLoaded: false } as any);

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

  it("detects user location and displays nearby stations", async () => {
    (navigator.geolocation.getCurrentPosition as any).mockImplementation(
      (success: any) => {
        success({
          coords: {
            latitude: 40.25,
            longitude: -111.65,
          },
        });
      }
    );

    nearbySearchMock
      .mockImplementationOnce((_request: any, callback: any) => {
        callback(
          [
            {
              place_id: "gas1",
              name: "Shell",
              geometry: {
                location: {
                  lat: () => 40.251,
                  lng: () => -111.651,
                },
              },
            },
          ],
          "OK"
        );
      })
      .mockImplementationOnce((_request: any, callback: any) => {
        callback(
          [
            {
              place_id: "ev1",
              name: "Tesla Supercharger",
              geometry: {
                location: {
                  lat: () => 40.252,
                  lng: () => -111.652,
                },
              },
            },
          ],
          "OK"
        );
      });

    render(<Map />);

    await waitFor(() => {
      expect(mockPanTo).toHaveBeenCalledWith({
        lat: 40.25,
        lng: -111.65,
      });
    });

    await waitFor(() => {
      expect(screen.getAllByTestId("marker")).toHaveLength(3);
    });

    expect(nearbySearchMock).toHaveBeenCalledTimes(2);
    expect(markerProps.map((m) => m.title).some((title) => title?.includes("Shell"))).toBe(
      true
    );
    expect(
      markerProps
        .map((m) => m.title)
        .some((title) => title?.includes("Tesla Supercharger"))
    ).toBe(true);
  });

  it("shows no station markers when both searches return zero results", async () => {
    (navigator.geolocation.getCurrentPosition as any).mockImplementation(
      (success: any) => {
        success({
          coords: {
            latitude: 40.25,
            longitude: -111.65,
          },
        });
      }
    );

    nearbySearchMock
      .mockImplementationOnce((_request: any, callback: any) => {
        callback([], "ZERO_RESULTS");
      })
      .mockImplementationOnce((_request: any, callback: any) => {
        callback([], "ZERO_RESULTS");
      });

    render(<Map />);

    await waitFor(() => {
      expect(mockPanTo).toHaveBeenCalledWith({
        lat: 40.25,
        lng: -111.65,
      });
    });

    await waitFor(() => {
      expect(screen.getAllByTestId("marker")).toHaveLength(1);
    });

    expect(screen.queryByText("Unable to load nearby stations.")).not.toBeInTheDocument();
    expect(screen.queryByText("Some nearby stations could not be loaded.")).not.toBeInTheDocument();
  });

  it("shows an error when location permission is denied", async () => {
    (navigator.geolocation.getCurrentPosition as any).mockImplementation(
      (_success: any, error: any) => {
        error();
      }
    );

    render(<Map />);

    expect(
      await screen.findByText("Location permission denied. Showing the default area.")
    ).toBeInTheDocument();

    expect(screen.queryAllByTestId("marker")).toHaveLength(0);
    expect(nearbySearchMock).not.toHaveBeenCalled();
  });

  it("shows an error when geolocation is not supported", async () => {
    Object.defineProperty(global.navigator, "geolocation", {
      value: undefined,
      configurable: true,
    });

    render(<Map />);

    expect(
      await screen.findByText("Geolocation is not supported by this browser.")
    ).toBeInTheDocument();

    expect(screen.queryAllByTestId("marker")).toHaveLength(0);
    expect(nearbySearchMock).not.toHaveBeenCalled();
  });

  it("shows partial error when one station search fails", async () => {
    (navigator.geolocation.getCurrentPosition as any).mockImplementation(
      (success: any) => {
        success({
          coords: {
            latitude: 40.25,
            longitude: -111.65,
          },
        });
      }
    );

    nearbySearchMock
      .mockImplementationOnce((_request: any, callback: any) => {
        callback(
          [
            {
              place_id: "gas1",
              name: "Chevron",
              geometry: {
                location: {
                  lat: () => 40.255,
                  lng: () => -111.655,
                },
              },
            },
          ],
          "OK"
        );
      })
      .mockImplementationOnce((_request: any, callback: any) => {
        callback([], "ERROR");
      });

    render(<Map />);

    expect(
      await screen.findByText("Some nearby stations could not be loaded.")
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByTestId("marker")).toHaveLength(2);
    });

    expect(mockPanTo).toHaveBeenCalledWith({
      lat: 40.25,
      lng: -111.65,
    });
    expect(
      markerProps.map((m) => m.title).some((title) => title?.includes("Chevron"))
    ).toBe(true);
  });

  it("shows an error when both station searches fail", async () => {
    (navigator.geolocation.getCurrentPosition as any).mockImplementation(
      (success: any) => {
        success({
          coords: {
            latitude: 40.25,
            longitude: -111.65,
          },
        });
      }
    );

    nearbySearchMock
      .mockImplementationOnce((_request: any, callback: any) => {
        callback([], "ERROR");
      })
      .mockImplementationOnce((_request: any, callback: any) => {
        callback([], "ERROR");
      });

    render(<Map />);

    expect(
      await screen.findByText("Unable to load nearby stations.")
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByTestId("marker")).toHaveLength(1);
    });

    expect(mockPanTo).toHaveBeenCalledWith({
      lat: 40.25,
      lng: -111.65,
    });
  });

  it("collapses and expands the left station panel", async () => {
    (navigator.geolocation.getCurrentPosition as any).mockImplementation(
      (success: any) => {
        success({
          coords: {
            latitude: 40.25,
            longitude: -111.65,
          },
        });
      }
    );

    nearbySearchMock
      .mockImplementationOnce((_request: any, callback: any) => {
        callback(
          [
            {
              place_id: "gas1",
              name: "Shell",
              geometry: {
                location: {
                  lat: () => 40.251,
                  lng: () => -111.651,
                },
              },
            },
          ],
          "OK"
        );
      })
      .mockImplementationOnce((_request: any, callback: any) => {
        callback([], "ZERO_RESULTS");
      });

    render(<Map />);

    expect(await screen.findByText("Nearby Stations")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Collapse station panel" }));
    expect(screen.queryByText("Nearby Stations")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand station panel" }));
    expect(screen.getByText("Nearby Stations")).toBeInTheDocument();
  });

  it("sorts gas stations by cheapest price by default", async () => {
    (navigator.geolocation.getCurrentPosition as any).mockImplementation(
      (success: any) => {
        success({
          coords: {
            latitude: 40.25,
            longitude: -111.65,
          },
        });
      }
    );

    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (url.includes("gas1")) {
        return {
          ok: true,
          json: async () => ({
            fuelOptions: {
              fuelPrices: [
                { type: "Regular", price: { units: 3, nanos: 500000000 } },
              ],
            },
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({
          fuelOptions: {
            fuelPrices: [
              { type: "Regular", price: { units: 2, nanos: 900000000 } },
            ],
          },
        }),
      };
    });

    nearbySearchMock
      .mockImplementationOnce((_request: any, callback: any) => {
        callback(
          [
            {
              place_id: "gas1",
              name: "Expensive Fuel",
              geometry: {
                location: {
                  lat: () => 40.251,
                  lng: () => -111.651,
                },
              },
            },
            {
              place_id: "gas2",
              name: "Budget Fuel",
              geometry: {
                location: {
                  lat: () => 40.252,
                  lng: () => -111.652,
                },
              },
            },
          ],
          "OK"
        );
      })
      .mockImplementationOnce((_request: any, callback: any) => {
        callback([], "ZERO_RESULTS");
      });

    render(<Map />);

    await screen.findByText("Budget Fuel");

    await waitFor(() => {
      const stationRows = screen.getAllByTestId("station-row");
      expect(stationRows).toHaveLength(2);
      expect(stationRows[0]).toHaveTextContent("Budget Fuel");
      expect(stationRows[1]).toHaveTextContent("Expensive Fuel");
    });
  });
});