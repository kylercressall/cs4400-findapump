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

