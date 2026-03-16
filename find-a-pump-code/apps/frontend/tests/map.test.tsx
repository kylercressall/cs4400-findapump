// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useEffect } from "react";
import Map from "../app/components/Map";

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
    expect(markerProps.map((m) => m.title)).toContain("Shell");
    expect(markerProps.map((m) => m.title)).toContain("Tesla Supercharger");
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
    expect(markerProps.map((m) => m.title)).toContain("Chevron");
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
});