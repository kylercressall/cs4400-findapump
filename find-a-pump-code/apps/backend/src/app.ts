import express from "express";
import cors from "cors";
import priceRoutes from "./routes/price.routes";
import stationRoutes from "./routes/station.routes";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
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

export default app;
