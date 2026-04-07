import express from "express";
import cors from "cors";
import priceRoutes from "./routes/price.routes";
import stationRoutes from "./routes/station.routes";
import mapsRoutes from "./routes/maps.routes";

const app = express();

const configuredOrigins = (process.env.FRONTEND_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set<string>([
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  ...configuredOrigins,
]);

// Allow common RFC1918 LAN origins so frontend can be opened from other devices in development.
const privateNetworkOriginPattern =
  /^http:\/\/(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?::\d{1,5})?$/;

function isAllowedOrigin(origin?: string) {
  if (!origin) return true;
  return allowedOrigins.has(origin) || privateNetworkOriginPattern.test(origin);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS: Origin not allowed"));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).send("hello from root");
});

// Routes:
//   routes (url to controller, no logic) ->
//   controller (input validation, status codes) ->
//   services (business logic, db calls)
// app.use("/api/tasks", taskRoutes);

app.use("/api/prices", priceRoutes);
app.use("/api/stations", stationRoutes);
app.use("/api/maps", mapsRoutes);

export default app;
