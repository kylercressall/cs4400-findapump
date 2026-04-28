# Software Requirements Specification (SRS)

## Functional Requirements

### 1.1 Core Display (FR-CD)

FR-CD-1: The system shall request device geolocation permission on initial map load.

FR-CD-2: If geolocation permission is granted, the system shall center the map on the detected latitude and longitude.

FR-CD-3: If geolocation is unavailable or denied, the system shall display stations for a predefined fallback location.

FR-CD-4: The system shall allow manual location search by city, street address, or ZIP code.

FR-CD-5: The system shall default the search radius to exactly 5 miles when no user-selected radius exists.

FR-CD-6: The system shall allow radius selection from 1 through 25 miles in 1-mile increments.

FR-CD-7: The system shall render each returned station as one map marker at the station latitude and longitude.

FR-CD-8: The system shall use a distinct visual marker style for EV charging stations.

FR-CD-9: Selecting a map marker shall open a station summary containing station name and at least one price value when price data exists.

FR-CD-10: Selecting a station from the list shall pan the map to that station.

FR-CD-11: Selecting a station from the list shall set map zoom to the station-focus zoom level.

FR-CD-12: The detailed station panel shall display station name.

FR-CD-13: The detailed station panel shall display station street address when available.

FR-CD-14: The detailed station panel shall display distance in miles from current search center to station.

FR-CD-15: The detailed station panel shall display estimated travel time in minutes.

FR-CD-16: The detailed station panel shall display fuel types only from this set: REGULAR_UNLEADED, MIDGRADE, PREMIUM, DIESEL.

FR-CD-17: The detailed station panel shall display the numeric price for each available fuel type.

FR-CD-18: The detailed station panel shall display the last price update timestamp for each available fuel type.

FR-CD-19: The detailed station panel shall provide a control that opens Google Maps turn-by-turn directions to the selected station.

FR-CD-20: When any detailed field is missing, the system shall display Data unavailable for that field only.

FR-CD-21: The UI shall include a visible legend describing gas and EV marker meanings.

### 1.2 Search and Filtering (FR-SF)

FR-SF-1: The system shall provide a list view showing station name, distance, and lowest available price label per station.

FR-SF-2: The system shall allow users to toggle between map-focused view and list-focused view without full page reload.

FR-SF-3: The system shall allow users to collapse and expand the station list panel.

FR-SF-4: The system shall support sort options: cheapest price, closest distance, and fastest ETA.

FR-SF-5: The system shall apply cheapest-price sorting in ascending order.

FR-SF-6: The system shall apply closest-distance sorting in ascending order.

FR-SF-7: The system shall apply fastest-ETA sorting in ascending order.

FR-SF-8: The system shall support station-type filter values: all, gas, ev.

FR-SF-9: The system shall support fuel-grade filter values: all, REGULAR_UNLEADED, MIDGRADE, PREMIUM, DIESEL.

FR-SF-10: When a selected fuel grade is unavailable at a station, that station shall display N/A for grade-based price.

FR-SF-11: Search and filter updates shall be reflected in rendered list order within 1 second for datasets up to 500 stations.

FR-SF-12: The system shall allow a user to create a discount program entry containing station identifier, fuel type, and discount value.

FR-SF-13: The system shall persist discount program entries across application restarts.

FR-SF-14: The system shall apply stored discounts to displayed prices for matching station and fuel type.

FR-SF-15: The system shall allow updating an existing discount entry.

FR-SF-16: The system shall allow deleting an existing discount entry.

### 1.3 Data Handling (FR-DH)

FR-DH-1: The system shall store retrieved nearby station data in local persistence.

FR-DH-2: The system shall expose a cached-data retrieval path that returns stations without requiring a live third-party call.

FR-DH-3: The system shall expose a live-data retrieval path that refreshes station data from external providers.

FR-DH-4: The system shall invoke live-data refresh in the background when cached results are shown.

FR-DH-5: The system shall store a retrieval timestamp for each cached fuel price record.

FR-DH-6: The system shall suppress cached fuel prices older than 24 hours from user-visible price displays.

FR-DH-7: The system shall keep station place identifiers unique in storage.

FR-DH-8: The system shall keep station-brand names unique in storage.

FR-DH-9: The system shall keep fuel price records unique per station and fuel type.

FR-DH-10: The system shall return cached station records when external station APIs fail and valid cache exists.

FR-DH-11: The system shall return cached station records when the client has no internet connectivity and valid cache exists.

FR-DH-12: Fuel price data returned to the client shall include type, units, nanos, and updateTime fields.

### 1.4 Error Handling (FR-EH)

FR-EH-1: If geolocation cannot be obtained, the system shall display a user-facing message instructing manual location input.

FR-EH-2: If no stations match active filters, the system shall display a No matching results message.

FR-EH-3: If a required query parameter is missing for station or map search endpoints, the API shall return HTTP 400 with an error payload.

FR-EH-4: If an internal service failure occurs in station, map, or price endpoints, the API shall return HTTP 500 with an error payload.

FR-EH-5: If fuel price fetch for a single station fails, the system shall keep the station visible and omit only unavailable price fields.

FR-EH-6: The UI shall not crash when station payloads omit optional fields such as address, prices, or update time.

FR-EH-7: When cached and live station retrieval both fail, the system shall display an Unable to load nearby stations message.

FR-EH-8: CORS-rejected requests from disallowed origins shall return an explicit origin-not-allowed error.

### 1.5 API and Integration Behavior (FR-API)

FR-API-1: The backend shall provide GET /api/stations to return all stored stations.

FR-API-2: The backend shall provide GET /api/stations/:id to return one station by internal station ID.

FR-API-3: The backend shall provide GET /api/stations/nearby to return nearby stored stations from query coordinates.

FR-API-4: The backend shall provide GET /api/maps/nearby/cached to return cached nearby station results by lat, lng, and radius.

FR-API-5: The backend shall provide GET /api/maps/nearby to return live nearby station results by lat, lng, and radius.

FR-API-6: The backend shall provide GET /api/prices/fuel?placeId=`<id>` to return normalized fuel price entries for that place.

FR-API-7: The backend root endpoint GET / shall return HTTP 200 health response.

FR-API-8: All API responses shall be encoded as application/json except GET / health response.

---

## Non-Functional Requirements

### 2.1 Performance (NFR-PR)

NFR-PR-1: Under normal load, average backend response time for GET /api/stations shall be less than or equal to 500 ms.

NFR-PR-2: For load-smoke test defaults (100 requests, concurrency 10), GET /api/stations shall achieve p95 latency less than or equal to 700 ms.

NFR-PR-3: For load-smoke test defaults, GET /api/stations error rate shall be less than or equal to 5%.

NFR-PR-4: Map plus station list initial render shall complete within 2 seconds after search initiation on broadband (>=25 Mbps) desktop connection.

NFR-PR-5: Cached nearby station retrieval from persistent storage shall complete within 200 ms for datasets up to 10,000 cached stations.

### 2.2 Reliability and Availability (NFR-RA)

NFR-RA-1: During 60-second availability test runs at 200 ms polling interval, endpoint error rate shall be less than or equal to 1%.

NFR-RA-2: During 60-second reliability soak runs at 250 ms interval, endpoint error rate shall be less than or equal to 3%.

NFR-RA-3: If live nearby station retrieval fails, cached results shall still be returned when cache exists.

NFR-RA-4: A server process crash shall recover to successful health-check response within 60 seconds when supervised restart is enabled.

NFR-RA-5: External API failures shall not terminate active backend process execution.

### 2.3 Usability and User Experience (NFR-UX)

NFR-UX-1: A new user shall be able to identify nearby stations and open one station detail view within three interactions from initial page load.

NFR-UX-2: Loading states shall display visible feedback while map script or station data is pending.

NFR-UX-3: Error messages shall include both issue description and next action (for example, manual location input).

NFR-UX-4: Station markers shall remain visually distinguishable by type at 100%, 150%, and 200% browser zoom.

NFR-UX-5: The station panel controls for sort, type, and grade shall remain usable on viewports from 360 px to 1920 px width.

NFR-UX-6: The UI shall maintain responsive layout without horizontal overflow at viewport widths of 360 px, 768 px, and 1280 px.

### 2.4 Scalability (NFR-SC)

NFR-SC-1: Scalability test levels of 1, 5, 10, 25, and 50 concurrent requests shall complete with successful HTTP responses.

NFR-SC-2: Total latency degradation at each scalability level shall not exceed 12x single-request baseline in default scalability test.

NFR-SC-3: The backend architecture shall support horizontal scaling through stateless API instances behind a load balancer.

NFR-SC-4: Database queries for nearby station retrieval shall remain indexable and support growth to at least 1,000,000 station records.

NFR-SC-5: Sensitive runtime configuration shall be supplied through environment variables and not hardcoded in source files.

### 2.5 Security (NFR-SE)

NFR-SE-1: Google Maps API keys shall be provided only through environment variables.

NFR-SE-2: API endpoints accepting user-provided query input shall validate numeric ranges and types before service execution.

NFR-SE-3: The backend shall reject browser requests from origins not in configured allowlist or approved private-network pattern.

NFR-SE-4: The production deployment shall enforce API request rate limiting on public endpoints.

NFR-SE-5: The system shall avoid logging full secret values in console or log files.

### 2.6 Maintainability (NFR-MA)

NFR-MA-1: Backend code shall preserve layered structure of routes, controllers, and services.

NFR-MA-2: The repository shall include up-to-date run, setup, and test documentation.

NFR-MA-3: Automated unit/integration tests shall execute via package scripts for backend and frontend.

NFR-MA-4: Non-functional test scripts shall execute via package scripts and return non-zero exit code on threshold failure.

NFR-MA-5: Source code formatting and linting standards shall be enforceable through project tooling configuration.

### 2.7 Portability and Compatibility (NFR-PC)

NFR-PC-1: The frontend shall function on current stable Chrome, Firefox, Safari, and Edge releases.

NFR-PC-2: Development environment shall run on Windows and macOS using pnpm workspace commands.

NFR-PC-3: Containerized development shall run through docker compose with frontend and backend services.

NFR-PC-4: The web client shall require no browser plugins.

NFR-PC-5: The layout shall adapt to mobile and desktop screen sizes without feature loss.

### 2.8 Data Accuracy and Integrity (NFR-DI)

NFR-DI-1: External fuel data shall be normalized to numeric units and nanos before storage.

NFR-DI-2: All persisted fuel price records shall include created-at timestamp values.

NFR-DI-3: Unique constraints shall prevent duplicate station place IDs, duplicate brand names, and duplicate station+fuel-type price rows.

NFR-DI-4: Price cache freshness threshold shall be 24 hours maximum age for user-visible prices.

NFR-DI-5: When displayed price data is older than freshness threshold and retained for diagnostics, the UI shall mark it as outdated.

### 2.9 Accessibility (NFR-AC)

NFR-AC-1: The UI shall conform to WCAG 2.1 Level AA for color contrast and text alternatives.

NFR-AC-2: All interactive controls shall be reachable and operable through keyboard-only navigation.

NFR-AC-3: Screen readers shall announce purpose for interactive controls including panel toggle, sort, filter, and directions button.

NFR-AC-4: All marker legend icons and control inputs shall include accessible labels or equivalent ARIA attributes.

NFR-AC-5: Focus indicators shall remain visible for keyboard users across all actionable controls.

### 2.10 Logging and Monitoring (NFR-LM)

NFR-LM-1: The backend shall log system-level errors with timestamp and severity.

NFR-LM-2: External Google Maps API requests and response statuses shall be logged for diagnostics.

NFR-LM-3: Non-functional performance scripts shall output latency and error-rate metrics per run.

NFR-LM-4: Critical backend failures shall generate administrator-visible alert events in production monitoring.

NFR-LM-5: Persisted log files shall use a consistent, parseable timestamp format (ISO 8601).

### 2.11 Backup and Recovery (NFR-BR)

NFR-BR-1: Persistent database backups shall run at least once per 24-hour period in production.

NFR-BR-2: Backup integrity verification shall run at least once every 7 days.

NFR-BR-3: Full data restoration from backup shall be executable through documented runbook steps.

NFR-BR-4: Backup artifacts shall be encrypted at rest.

NFR-BR-5: Recovery testing shall confirm restored data includes stations, fuel types, and fuel prices.

### 2.12 Legal and Compliance (NFR-LC)

NFR-LC-1: All Google Maps platform usage shall comply with current Google Maps Platform Terms and API policies.

NFR-LC-2: Fuel data acquisition and display shall comply with provider licensing terms.

NFR-LC-3: The system shall process location data in compliance with applicable privacy law for deployment jurisdiction.

NFR-LC-4: The project shall publish an accessible privacy policy covering collected data and retention practices.

NFR-LC-5: Personally identifiable information shall not be stored without explicit user consent and legal basis.
