import { Request, Response } from "express";
import * as priceServices from "../services/price.services";

// GET /api/price
export const getAllPrices = async (_req: Request, res: Response) => {
  try {
    const prices = await priceServices.getAllPrices();
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch all prices" });
  }
};

export const getFuelPricesByPlaceId = async(req: Request, res: Response) => {
  try {
    const { placeId } = req.query;
    if (!placeId || typeof placeId !== "string") {
      res.status(400).json({ error: "placeId is required" });
      return;
    }
    const data = await priceServices.getFuelPricesByPlaceId(placeId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch prices by place id" });
  }
}