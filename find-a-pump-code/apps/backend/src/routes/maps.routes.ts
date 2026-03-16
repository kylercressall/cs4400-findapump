import { Router } from "express";
import * as mapsController from "../controllers/maps.controller";

const router = Router();

router.get("/nearby/cached", mapsController.getCachedStations);
router.get("/nearby", mapsController.getNearbyStations);

export default router;
