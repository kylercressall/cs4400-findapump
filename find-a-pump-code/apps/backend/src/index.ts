import express from "express";
import cors from "cors";
import taskRoutes from "./routes/task.routes";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).send("Hello from Express backend!");
});

// Routes:
//   routes (url to controller, no logic) ->
//   controller (input validation, status codes) ->
//   services (business logic, db calls)
app.use("/api/tasks", taskRoutes);

export default app;
