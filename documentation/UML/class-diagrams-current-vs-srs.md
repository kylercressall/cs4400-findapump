# Find A Pump Class Diagrams

These class diagrams reflect the current repository implementation and the remaining SRS-required responsibilities.

- Implemented now: responsibility exists in code today.
- Implemented inline: logic exists but is embedded (not a dedicated module/class).
- SRS-required / not yet implemented: requirement appears in SRS but no dedicated implementation exists.

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
  -fuelGrade: FuelGradeOption
  -isPanelCollapsed: boolean
  -selectedStationId: string | null
  -error: string | null
  +render(): JSX.Element
  +loadStations(loc: LatLng): void
  +fetchFuelOptions(placeId: string): Promise~FuelPriceEntry[]~
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

class FuelGradeOption {
  <<enum>>
  all
  REGULAR_UNLEADED
  MIDGRADE
  PREMIUM
  DIESEL
}

class DistanceAndPriceHelpers {
  <<utility / implemented inline>>
  +getDistanceMiles(a, b): number
  +estimateEtaMinutes(distanceMiles): number
  +priceToNumber(units, nanos): number
  +getLowestFuelPrice(fuelPrices, grade): number | null
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
  +fuelGrade: FuelGradeOption
  +onSortChange(): void
  +onKindChange(): void
  +onFuelGradeChange(): void
}

class SelectedStationDetail {
  <<implemented inline in MapView>>
  +selectedRow: StationRow
  +showDistance(): void
  +showETA(): void
  +showFuelPrices(): void
}

class LegendPanel {
  <<implemented inline in MapView>>
  +showGasMarker(): void
  +showEVMarker(): void
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
MapView --> StationKind : filters by
MapView --> SortOption : sorts by
MapView --> FuelGradeOption : filters cheapest price by
MapView --> FuelPriceEntry : fetches and stores
MapView --> StationListPanel : renders inline
MapView --> SortFilterControls : renders inline
MapView --> SelectedStationDetail : renders inline
MapView --> LegendPanel : renders inline
MapView --> ErrorBanner : renders inline
MapView --> LoadingIndicator : renders inline
MapView ..> LocationInputForm : missing manual location entry
MapView ..> DiscountProgramStore : missing discount logic
MapView ..> FrontendCacheStore : missing offline/cache flow
StationRow --> Station : wraps
StationRow --> DistanceAndPriceHelpers : computed using
SelectedStationDetail --> FuelPriceEntry : displays
```

### Frontend Review Against Current Code

- Implemented now:
  - Home page renders the map component full-screen.
  - Map loads fallback area immediately, then re-fetches using geolocation if permission is granted.
  - Nearby stations are loaded from backend cached endpoint while backend refresh is fired in background.
  - Sort/filter controls include sort mode, station type, and fuel grade.
  - Selected station detail includes distance, ETA, lowest price, and per-grade gas prices.
  - Marker info window for selected station shows station details and gas price rows.
  - Inline legend and inline error/loading states are implemented.
- Missing relative to SRS:
  - Manual location entry form.
  - Navigation/directions links (especially EV routing flow).
  - Discount program CRUD and application logic.
  - Frontend offline cache store and sync strategy.

## Backend Class Diagram

```mermaid
classDiagram
direction LR

class ExpressApp {
  <<application>>
  +configureCors(): void
  +configureJson(): void
  +mountRoutes(): void
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
  -parseParams(req): CoordinatesQueryOrNull
}

class PriceController {
  <<controller>>
  +getAllPrices(req, res): Promise~void~
  +getFuelPricesByPlaceId(req, res): Promise~void~
}

class StationService {
  <<service>>
  +getStationsWithPrices(): Promise~Station[]~
  +getStationById(id): Promise~StationOrNull~
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
  -log(label, data): void
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

class GoogleMapsLogFile {
  <<infrastructure / implemented now>>
  +append(entry): void
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
  <<SRS-required / partial only>>
  +validateQuery(): void
  +validateBody(): void
}

class RateLimitMiddleware {
  <<SRS-required / not yet implemented>>
  +limitRequests(): void
}

class MonitoringLogger {
  <<SRS-required / partial only>>
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
ExpressApp ..> ValidationMiddleware : should use shared middleware
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
MapsService --> GoogleMapsLogFile : appends raw API logs
MapsService --> NearbyStation : returns
MapsService --> FuelPriceEntry : embeds in NearbyStation

PriceService --> GooglePlacesDetailsAPI : fetches fuel options from
PriceService --> PrismaClient : upserts FuelPrice/FuelType via
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
  - Express app with CORS allowlist + private-network pattern and JSON middleware.
  - Route/controller/service separation for station, map, and price APIs.
  - Maps service fetches gas and EV places, returns combined results, and persists station/location/brand cache asynchronously.
  - Cached map endpoint reads local DB and includes fresh fuel prices (24h threshold).
  - Price service calls Google Places Details API (v1), normalizes fuel prices, and upserts FuelType/FuelPrice rows asynchronously.
  - Station service returns related location/brand/fuel data, with fuel prices sorted ascending.
  - Prisma entities for user config, fuel types, stations, locations, brands, and fuel prices are in schema.
- Partial/missing relative to SRS:
  - `getAllPrices()` still returns a stub object. 
  - No discount-program domain model or CRUD endpoints.
  - No scheduled cache refresh worker/service.
  - Validation is handler-local only (no shared validation middleware layer).
  - No rate limiting middleware.
  - Logging is ad hoc (`console` plus append-to-file), not full monitoring/alerting.
  - No backup/recovery application module.

## Summary

The current implementation supports end-to-end nearby discovery, sorting/filtering, and station-level fuel-price display with DB-backed caching. The largest SRS gaps remain manual location entry, discount management, frontend offline strategy, and backend operational hardening (shared validation, rate limiting, monitoring, backup/recovery).
