import express from "express";
import cors from "cors";
import priceRoutes from "./routes/price.routes";
import stationRoutes from "./routes/station.routes";
import mapsRoutes from "./routes/maps.routes";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
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
