import { Router } from "express";
import * as stationController from "../controllers/station.controller";

const router = Router();

router.get("/", stationController.getAllStations);
router.get("/nearby", stationController.getStationsNearby);
router.get("/:id", stationController.getStationById);

export default router;
