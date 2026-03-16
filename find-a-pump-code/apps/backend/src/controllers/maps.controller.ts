import { Request, Response } from "express";
import * as mapsService from "../services/maps.service";

// GET /api/maps/nearby?lat=&lng=&radius=
export const getNearbyStations = async (req: Request, res: Response) => {
  const { lat, lng, radius } = req.query;

  if (!lat || !lng) {
    res.status(400).json({ error: "lat and lng are required" });
    return;
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);
  const radiusNum = Number(radius) || 5000;

  if (isNaN(latNum) || isNaN(lngNum)) {
    res.status(400).json({ error: "lat and lng must be numbers" });
    return;
  }

  try {
    const stations = await mapsService.getNearbyStations(latNum, lngNum, radiusNum);
    res.json(stations);
  } catch (error) {
    console.error("Maps service error:", error);
    res.status(500).json({ error: "Failed to fetch nearby stations" });
  }
};
