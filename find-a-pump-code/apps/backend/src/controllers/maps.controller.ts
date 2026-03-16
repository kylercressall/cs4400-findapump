import { Request, Response } from "express";
import * as mapsService from "../services/maps.service";

function parseParams(req: Request): { lat: number; lng: number; radius: number } | null {
  const { lat, lng, radius } = req.query;
  if (!lat || !lng) return null;
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (isNaN(latNum) || isNaN(lngNum)) return null;
  return { lat: latNum, lng: lngNum, radius: Number(radius) || 5000 };
}

// GET /api/maps/nearby/cached?lat=&lng=&radius=
export const getCachedStations = async (req: Request, res: Response) => {
  const params = parseParams(req);
  if (!params) {
    res.status(400).json({ error: "lat and lng are required numbers" });
    return;
  }
  try {
    const stations = await mapsService.getCachedNearbyStations(params.lat, params.lng, params.radius);
    res.json(stations);
  } catch (error) {
    console.error("Maps cache error:", error);
    res.status(500).json({ error: "Failed to fetch cached stations" });
  }
};

// GET /api/maps/nearby?lat=&lng=&radius=
export const getNearbyStations = async (req: Request, res: Response) => {
  const params = parseParams(req);
  if (!params) {
    res.status(400).json({ error: "lat and lng are required numbers" });
    return;
  }
  try {
    const stations = await mapsService.getNearbyStations(params.lat, params.lng, params.radius);
    res.json(stations);
  } catch (error) {
    console.error("Maps service error:", error);
    res.status(500).json({ error: "Failed to fetch nearby stations" });
  }
};
