import { Router } from "express";
import * as priceController from "../controllers/price.controllers";

const router = Router();

// GET all current prices
router.get("/", priceController.getAllPrices);

router.get("/fuel", priceController.getFuelPricesByPlaceId)

export default router;
