# Frontend (Find A Pump)

This app renders the interactive map and nearby station experience.

## Features

- Google Map with user location and nearby gas/EV stations
- Collapsible left station panel
- Station list sorting: cheapest, closest, fastest ETA
- Station details: distance, ETA, best price, rating, address, open status
- Marker and panel selection sync

## Environment

Create `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## Run (Workspace)

From `find-a-pump-code`:

```bash
pnpm --filter frontend dev
```

Open `http://localhost:3000`.

## Run (Docker)

From `find-a-pump-code`:

```bash
docker compose up --build frontend
```

Open `http://localhost:3000`.

## Tests

From `find-a-pump-code`:

```bash
pnpm --filter frontend test
```

Test file for map and panel behavior:

- `apps/frontend/tests/map.test.tsx`
