# Find A Pump Class Diagrams

These class diagrams model the current codebase and the additional classes implied by the SRS.

- `Implemented now` means the responsibility exists in the repository today.
- `SRS-required / not yet implemented` means the requirement appears in the SRS but no dedicated class or module exists yet.
- `Implemented inline` means the responsibility exists but as logic embedded in another component rather than a dedicated class.
- The frontend is a React application built with function components, so the UML uses architectural classes and stereotypes rather than literal TypeScript `class` declarations.

## Frontend Class Diagram

```mermaid
classDiagram
direction LR

class HomePage {
  <<component>>
  +render(): JSX.Element
}

class MapView {
  <<component>>
  -map: google.maps.Map | null
  -userLocation: LatLng | null
  -stations: Station[]
  -sortBy: SortOption
  -kindFilter: "all" | StationKind
  -isPanelCollapsed: boolean
  -selectedStationId: string | null
  -error: string | null
  +render(): JSX.Element
  +detectUserLocation(): void
  +loadStations(loc: LatLng): void
  +fetchFuelOptions(placeId: string): FuelPriceEntry[]
  +focusStation(stationId: string): void
}

class Station {
  <<type>>
  +id: string
  +name: string
  +position: LatLng
  +kind: StationKind
  +placeId: string?
  +address: string?
  +fuelPrices: FuelPriceEntry[]?
}

class StationRow {
  <<computed type>>
  +station: Station
  +distanceMiles: number
  +etaMinutes: number
  +lowestPrice: number | null
  +lowestPriceLabel: string
}

class FuelPriceEntry {
  <<type / implemented now>>
  +type: string
  +units: number
  +nanos: number
  +updateTime: string?
}

class LatLng {
  <<value object>>
  +lat: number
  +lng: number
}

class StationKind {
  <<enum>>
  gas
  ev
}

class SortOption {
  <<enum>>
  cheapest
  closest
  fastest
}

class DistanceHelpers {
  <<utility / implemented inline>>
  +getDistanceMiles(a: LatLng, b: LatLng): number
  +estimateEtaMinutes(distanceMiles: number): number
  +priceToNumber(units, nanos): number
  +getLowestFuelPrice(fuelPrices): number | null
  +formatFuelPrices(fuelPrices): string
}

class StationListPanel {
  <<implemented inline in MapView>>
  +renderRows(rows: StationRow[]): JSX.Element
  +onSelectStation(id: string): void
}

class SortFilterControls {
  <<implemented inline in MapView>>
  +sortBy: SortOption
  +kindFilter: "all" | StationKind
  +onSortChange(): void
  +onKindChange(): void
}

class SelectedStationDetail {
  <<implemented inline in MapView>>
  +selectedRow: StationRow
  +showDistance(): void
  +showETA(): void
  +showFuelPrices(): void
}

class ErrorBanner {
  <<implemented inline in MapView>>
  +message: string
  +render(): JSX.Element
}

class LoadingIndicator {
  <<implemented inline in MapView>>
  +show(): void
}

class LocationInputForm {
  <<SRS-required / not yet implemented>>
  +manualAddress: string
  +submitLocation(): void
}

class DiscountProgramStore {
  <<SRS-required / not yet implemented>>
  +createDiscount(): void
  +updateDiscount(): void
  +deleteDiscount(): void
  +applyDiscounts(): void
}

class FrontendCacheStore {
  <<SRS-required / not yet implemented>>
  +saveStations(): void
  +loadCachedStations(): Station[]
  +isOffline(): boolean
  +refreshWhenOnline(): void
}

HomePage --> MapView : renders
MapView --> Station : stores and displays markers for
MapView --> StationRow : computes via useMemo
MapView --> LatLng : stores
MapView --> StationKind : categorizes
MapView --> SortOption : sorts by
MapView --> FuelPriceEntry : fetches and stores
MapView --> StationListPanel : renders inline
MapView --> SortFilterControls : renders inline
MapView --> SelectedStationDetail : renders inline
MapView --> ErrorBanner : renders inline
MapView --> LoadingIndicator : renders inline
MapView ..> LocationInputForm : missing manual location entry
MapView ..> DiscountProgramStore : missing discount logic
MapView ..> FrontendCacheStore : missing offline/cache flow
StationRow --> Station : wraps
StationRow --> DistanceHelpers : computed using
SelectedStationDetail --> FuelPriceEntry : displays
```

### Frontend Review Against Current Code

- Implemented now:
  - `HomePage` renders `MapView`.
  - `MapView` uses `@react-google-maps/api` for map rendering, browser geolocation, loads the fallback area immediately, and re-fetches when the user's actual coordinates arrive.
  - Station list panel is rendered inline within `MapView` with sort (cheapest/closest/fastest ETA) and kind (all/gas/EV) filter controls.
  - Selected-station detail strip shows distance, ETA, and per-fuel-type prices for the highlighted station.
  - `MapView` now fetches stations from the backend (`/api/maps/nearby/cached` with a background refresh via `/api/maps/nearby`) instead of calling Google Places directly.
  - Fuel prices per station are fetched from the backend (`/api/prices/fuel?placeId=`) and shown in the detail strip for gas stations.
  - `Station`, `LatLng`, `StationKind`, `FuelPriceEntry`, `StationRow`, and `SortOption` exist as local TypeScript types.
  - Distance and ETA helpers (`getDistanceMiles`, `estimateEtaMinutes`) are implemented as inline utility functions.
  - Inline error banner and "Loading map..." loading state exist.
- Missing relative to the SRS:
  - Manual location input (`LocationInputForm`).
  - No EV charging directions or navigation link.
  - Discount program CRUD and discount application (`DiscountProgramStore`).
  - Offline caching and cached fallback behavior in the frontend (`FrontendCacheStore`).
  - Dedicated accessibility-focused `LoadingIndicator` component (currently just inline text).

## Backend Class Diagram

```mermaid
classDiagram
direction LR

class ExpressApp {
  <<application>>
  +useRoutes(): void
  +configureCors(): void
  +configureJson(): void
}

class StationRoutes {
  <<route>>
  +GET /api/stations
  +GET /api/stations/nearby
  +GET /api/stations/:id
}

class MapsRoutes {
  <<route>>
  +GET /api/maps/nearby
  +GET /api/maps/nearby/cached
}

class PriceRoutes {
  <<route>>
  +GET /api/prices
  +GET /api/prices/fuel
}

class StationController {
  <<controller>>
  +getAllStations(req, res): Promise~void~
  +getStationById(req, res): Promise~void~
  +getStationsNearby(req, res): Promise~void~
}

class MapsController {
  <<controller>>
  +getNearbyStations(req, res): Promise~void~
  +getCachedStations(req, res): Promise~void~
  -parseParams(req): CoordinatesQuery
}

class PriceController {
  <<controller>>
  +getAllPrices(req, res): Promise~void~
  +getFuelPricesByPlaceId(req, res): Promise~void~
}

class StationService {
  <<service>>
  +getStationsWithPrices(): Promise~Station[]~
  +getStationById(id): Promise~Station~
  +getStationsByLocation(lat, lng, radiusMiles): Promise~Station[]~
}

class MapsService {
  <<service>>
  +getNearbyStations(lat, lng, radius): Promise~NearbyStation[]~
  +getCachedNearbyStations(lat, lng, radius): Promise~NearbyStation[]~
  -searchNearby(lat, lng, radius, type, kind): Promise~NearbyStation[]~
  -upsertAllStations(stations): Promise~void~
  -dbStationsToNearby(stations): NearbyStation[]
  -parseVicinity(vicinity): AddressParts
  -PRICE_MAX_AGE_MS: number
}

class PriceService {
  <<service>>
  +getAllPrices(): Promise~object~
  +getFuelPricesByPlaceId(placeId): Promise~FuelPriceEntry[]~
  -upsertFuelPrices(placeId, prices): Promise~void~
}

class PrismaClient {
  <<infrastructure>>
}

class GooglePlacesNearbyAPI {
  <<external service>>
  +nearbysearch(lat, lng, radius, type): PlaceResult[]
}

class GooglePlacesDetailsAPI {
  <<external service>>
  +getPlace(placeId, fieldMask): PlaceDetail
}

class User {
  <<entity>>
  +id: string
  +username: string?
}

class UserConfig {
  <<entity>>
  +id: string
  +userId: string
  +fuelPreferenceId: string?
}

class FuelType {
  <<entity>>
  +id: string
  +name: string
}

class FuelPrice {
  <<entity>>
  +id: string
  +stationId: string
  +fuelTypeId: string
  +fuelUnit: string?
  +fuelPrice: number?
  +createdAt: DateTime
}

class Station {
  <<entity>>
  +id: string
  +locationId: string
  +stationBrandId: string?
  +placeId: string?
  +kind: string?
}

class Location {
  <<entity>>
  +id: string
  +googleMapsUrl: string?
  +street: string?
  +city: string?
  +zip: string?
  +country: string?
  +lat: number?
  +long: number?
}

class StationBrand {
  <<entity>>
  +id: string
  +brandName: string
  +logoUrl: string?
}

class NearbyStation {
  <<DTO>>
  +place_id: string
  +name: string
  +kind: StationKind
  +lat: number
  +lng: number
  +vicinity: string
  +fuelPrices: FuelPriceEntry[]?
}

class FuelPriceEntry {
  <<DTO>>
  +type: string
  +units: number
  +nanos: number
  +updateTime: string?
}

class DiscountProgramService {
  <<SRS-required / not yet implemented>>
  +createDiscount(): void
  +updateDiscount(): void
  +deleteDiscount(): void
  +applyDiscounts(): void
}

class CacheRefreshJob {
  <<SRS-required / not yet implemented>>
  +refreshCachedData(): void
  +syncAfterDowntime(): void
}

class ValidationMiddleware {
  <<SRS-required / not yet implemented>>
  +validateQuery(): void
  +validateBody(): void
}

class RateLimitMiddleware {
  <<SRS-required / not yet implemented>>
  +limitRequests(): void
}

class MonitoringLogger {
  <<SRS-required / partial logging only>>
  +logError(): void
  +logMetric(): void
  +notifyCriticalFailure(): void
}

class BackupRecoveryService {
  <<SRS-required / not yet implemented>>
  +performDailyBackup(): void
  +verifyBackup(): void
  +restoreData(): void
}

ExpressApp --> StationRoutes : mounts
ExpressApp --> MapsRoutes : mounts
ExpressApp --> PriceRoutes : mounts
ExpressApp ..> ValidationMiddleware : should use
ExpressApp ..> RateLimitMiddleware : should use
ExpressApp ..> MonitoringLogger : should use

StationRoutes --> StationController : delegates to
MapsRoutes --> MapsController : delegates to
PriceRoutes --> PriceController : delegates to

StationController --> StationService : uses
MapsController --> MapsService : uses
PriceController --> PriceService : uses

StationService --> PrismaClient : queries through
MapsService --> PrismaClient : reads/writes through
MapsService --> GooglePlacesNearbyAPI : calls for live data
MapsService --> NearbyStation : returns
MapsService --> FuelPriceEntry : embeds in NearbyStation

PriceService --> GooglePlacesDetailsAPI : fetches fuel options from
PriceService --> PrismaClient : upserts FuelPrice via
PriceService --> FuelPriceEntry : returns

User "1" --> "0..*" UserConfig : has
FuelType "1" --> "0..*" UserConfig : preferred by
Station "1" --> "1" Location : located at
StationBrand "1" --> "0..*" Station : brands
Station "1" --> "0..*" FuelPrice : has
FuelType "1" --> "0..*" FuelPrice : typed by

MapsService ..> CacheRefreshJob : should coordinate with
StationService ..> DiscountProgramService : should apply price adjustments from
BackupRecoveryService ..> PrismaClient : protects persisted data
MonitoringLogger ..> PrismaClient : should record operational events around
```

### Backend Review Against Current Code

- Implemented now:
  - Express app wiring with CORS (allowlist + private-network pattern) and JSON middleware.
  - Route, controller, and service separation for stations, maps, and prices.
  - `MapsService` calls the Google Places Nearby Search API, returns nearby gas and EV stations, and asynchronously upserts station/location/brand cache data into Prisma. `getCachedNearbyStations` now includes fresh fuel prices (within 24 h) from the DB when returning cached results.
  - `StationService` returns stations with `Location`, `StationBrand`, and sorted `FuelPrice` relations. `getStationsByLocation` performs a bounding-box query using lat/long deltas.
  - `PriceService` now has a functioning `getFuelPricesByPlaceId` that calls the Google Places Details API (v1), returns the fuel price breakdown, and asynchronously upserts the results into `FuelPrice` and `FuelType` rows via Prisma.
  - `PriceRoutes` exposes a new `GET /api/prices/fuel?placeId=` endpoint backed by `PriceController.getFuelPricesByPlaceId`.
  - Prisma entities exist for users, user config, fuel types, fuel prices (with a `(stationId, fuelTypeId)` unique constraint), stations, locations, and brands.
  - `NearbyStation` DTO now carries an optional `fuelPrices` array of `FuelPriceEntry`.
  - Basic automated tests exist for the frontend map component and the station controller/service layers.
- Partial or missing relative to the SRS:
  - `PriceService.getAllPrices()` is still a stub returning an empty object.
  - No backend discount-program model or CRUD endpoints (`DiscountProgramService`).
  - No dedicated cache refresh scheduler or stale-data synchronization job (`CacheRefreshJob`).
  - Input validation is limited to numeric query checks in `MapsController` and a string check in `PriceController`; no shared `ValidationMiddleware`.
  - No API rate limiting (`RateLimitMiddleware`).
  - Logging is ad hoc `console` calls plus a Google Maps API log file; no full monitoring/alerting (`MonitoringLogger`).
  - No backup/recovery module in application code (`BackupRecoveryService`).

## Summary

The repository now supports a complete end-to-end station discovery and price display flow:

- detect user location (with immediate fallback area load),
- show a map with gas and EV markers,
- fetch nearby stations from the backend (with background live refresh and DB-cached fast path),
- display a sortable/filterable station list panel (by price, distance, ETA; by gas/EV/all),
- show per-station fuel prices fetched from the Google Places Details API and persisted in the DB,
- display a selected-station detail strip with distance, ETA, and per-fuel-type price breakdown.

The largest remaining SRS gaps are manual location input, detailed navigation links, discount management, offline/cache orchestration on the frontend, shared validation/security middleware, and operational services such as rate limiting, monitoring, and backup/recovery.
