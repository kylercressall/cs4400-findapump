# Find A Pump Class Diagrams

These class diagrams model the current codebase and the additional classes implied by the SRS.

- `Implemented now` means the responsibility exists in the repository today.
- `SRS-required / not yet implemented` means the requirement appears in the SRS but no dedicated class or module exists yet.
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
  -error: string | null
  +render(): JSX.Element
  +loadGoogleMaps(): void
  +detectUserLocation(): void
  +searchNearbyStations(): void
}

class Station {
  <<entity>>
  +id: string
  +name: string
  +position: LatLng
  +kind: StationKind
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

class GooglePlacesClient {
  <<external service>>
  +nearbySearch(type, radius, location): PlaceResult[]
}

class StationListView {
  <<SRS-required / not yet implemented>>
  +renderStations(stations: Station[]): JSX.Element
}

class FilterPanel {
  <<SRS-required / not yet implemented>>
  +distanceRadius: number
  +fuelType: string
  +priceSort: string
  +evOnly: boolean
  +applyFilters(): void
}

class StationDetailView {
  <<SRS-required / not yet implemented>>
  +selectedStation: StationDetail
  +showAddress(): void
  +showFuelTypes(): void
  +showLastUpdated(): void
  +openGoogleMapsDirections(): void
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

class StationApiClient {
  <<recommended service>>
  +getNearbyStations(lat, lng, radius): Station[]
  +getCachedStations(lat, lng, radius): Station[]
  +getStationDetails(id): StationDetail
}

class LocationInputForm {
  <<SRS-required / not yet implemented>>
  +manualAddress: string
  +submitLocation(): void
}

class LoadingIndicator {
  <<SRS-required / not yet implemented>>
  +show(): void
  +hide(): void
}

class ErrorBanner {
  <<implemented now>>
  +message: string
  +render(): JSX.Element
}

class StationDetail {
  <<SRS-required / not yet implemented>>
  +id: string
  +name: string
  +address: string
  +fuelPrices: FuelPrice[]
  +fuelTypes: string[]
  +lastUpdated: Date
  +navigationUrl: string
  +evAvailable: boolean
}

class FuelPrice {
  <<SRS-required / partial backend support>>
  +fuelType: string
  +price: number
  +discountedPrice: number
  +lastUpdated: Date
}

HomePage --> MapView : renders
MapView --> Station : displays markers for
MapView --> LatLng : stores
MapView --> StationKind : categorizes
MapView --> GooglePlacesClient : currently queries directly
MapView --> ErrorBanner : shows
MapView ..> StationApiClient : should use backend for SRS alignment
MapView ..> FilterPanel : missing UI dependency
MapView ..> StationListView : missing toggle/list view
MapView ..> StationDetailView : missing detail flow
MapView ..> FrontendCacheStore : missing offline/cache flow
MapView ..> LoadingIndicator : missing user-facing loading state
MapView ..> LocationInputForm : missing manual location entry
StationDetailView --> StationDetail : presents
StationDetail --> FuelPrice : contains
FilterPanel ..> DiscountProgramStore : discounted result logic
StationApiClient ..> StationDetail : fetches
StationApiClient ..> Station : fetches
```

### Frontend Review Against Current Code

- Implemented now:
  - `HomePage` only renders `MapView`.
  - `MapView` loads Google Maps, reads browser geolocation, searches nearby gas and EV stations, renders markers, and shows a simple error banner.
  - `Station`, `LatLng`, and `StationKind` exist as local TypeScript types in the map component.
- Missing relative to the SRS:
  - Manual location input.
  - List view and map/list toggle.
  - Distance, fuel type, and price filters.
  - Marker selection summary and detailed station view.
  - Fuel price display per station.
  - Discount program CRUD and discount application.
  - Offline caching and cached fallback behavior in the frontend.
  - Explicit loading indicator component and accessibility-focused UI modules.

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
}

class StationService {
  <<service>>
  +getStationsWithPrices(): Promise~Station[]~
  +getStationById(id): Promise~Station~
  +getStationsByLocation(lat, lng, radius): Promise~Station[]~
}

class MapsService {
  <<service>>
  +getNearbyStations(lat, lng, radius): Promise~NearbyStation[]~
  +getCachedNearbyStations(lat, lng, radius): Promise~NearbyStation[]~
  -searchNearby(lat, lng, radius, type, kind): Promise~NearbyStation[]~
  -upsertAllStations(stations): Promise~void~
  -parseVicinity(vicinity): AddressParts
}

class PriceService {
  <<service / stub>>
  +getAllPrices(): Promise~object~
}

class PrismaClient {
  <<infrastructure>>
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
  +name: string?
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
PriceService --> PrismaClient : intended dependency
MapsService --> NearbyStation : returns

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
  - Express app wiring with CORS and JSON middleware.
  - Route, controller, and service separation for stations, maps, and prices.
  - `MapsService` calls the Google Places API, returns nearby gas and EV stations, and asynchronously upserts station/location/brand cache data into Prisma.
  - `StationService` returns stations with `Location`, `StationBrand`, and sorted `FuelPrice` relations.
  - Prisma entities exist for users, user config, fuel types, fuel prices, stations, locations, and brands.
  - Basic automated tests exist for the frontend map component and the station controller/service layers.
- Partial or missing relative to the SRS:
  - `PriceService` is still a stub and does not expose real pricing logic.
  - No backend discount-program model or CRUD endpoints.
  - No dedicated cache refresh scheduler, offline synchronization job, or stale-data policy.
  - Input validation is limited to a few numeric query checks in `MapsController`; there is no shared validation middleware.
  - No API rate limiting.
  - Logging is ad hoc `console` logging plus a Google Maps API log file, not full monitoring/alerting.
  - No backup/recovery module in the application code.

## Summary

The repository currently supports the beginning of the SRS core display flow:

- detect user location,
- show a map,
- show gas and EV markers,
- query nearby station data,
- persist basic station cache data on the backend.

The largest SRS gaps are search/filter UX, detailed station pricing presentation, discount management, offline/cache orchestration, validation/security middleware, and operational services such as rate limiting, monitoring, and backup/recovery.