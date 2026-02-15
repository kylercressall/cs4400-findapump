import { Request, Response } from 'express';
import * as stationService from '../services/station.service';

export const getAllStations = async (req: Request, res: Response) => {
  try {
    const stations = await stationService.getStationsWithPrices();
    console.log("Status:", res.statusCode);
    console.log("Results:", stations);
    res.json(stations);
  } catch (error) {
    console.log("Status:", 500);
    console.log("Error:", error);
    res.status(500).json({ error: 'Failed to fetch stations' });
  }
};

export const getStationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const station = await stationService.getStationById(id);
    console.log("Status:", station ? 200 : 404);
    console.log("Results:", station);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    res.json(station);
  } catch (error) {
    console.log("Status:", 500);
    console.log("Error:", error);
    res.status(500).json({ error: 'Failed to fetch station' });
  }
};

export const getStationsNearby = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radius } = req.query;
    const stations = await stationService.getStationsByLocation(
      Number(latitude),
      Number(longitude),
      Number(radius) || 10
    );
    console.log("Status:", res.statusCode);
    console.log("Results:", stations);
    res.json(stations);
  } catch (error) {
    console.log("Status:", 500);
    console.log("Error:", error);
    res.status(500).json({ error: 'Failed to fetch stations' });
  }
};