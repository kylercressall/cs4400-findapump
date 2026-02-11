/*
  Warnings:

  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Task";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "User" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT
);

-- CreateTable
CREATE TABLE "FuelType" (
    "fuel_type_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT
);

-- CreateTable
CREATE TABLE "UserConfig" (
    "config_id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "fuel_preference_id" TEXT,
    CONSTRAINT "UserConfig_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserConfig_fuel_preference_id_fkey" FOREIGN KEY ("fuel_preference_id") REFERENCES "FuelType" ("fuel_type_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StationBrand" (
    "station_brand_id" TEXT NOT NULL PRIMARY KEY,
    "brand_name" TEXT,
    "logo_url" TEXT
);

-- CreateTable
CREATE TABLE "Location" (
    "location_id" TEXT NOT NULL PRIMARY KEY,
    "google_maps_url" TEXT,
    "street" TEXT,
    "city" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "lat" REAL,
    "long" REAL
);

-- CreateTable
CREATE TABLE "Station" (
    "station_id" TEXT NOT NULL PRIMARY KEY,
    "location_id" TEXT NOT NULL,
    "station_brand_id" TEXT NOT NULL,
    CONSTRAINT "Station_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "Location" ("location_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Station_station_brand_id_fkey" FOREIGN KEY ("station_brand_id") REFERENCES "StationBrand" ("station_brand_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FuelPrice" (
    "fuel_price_id" TEXT NOT NULL PRIMARY KEY,
    "station_id" TEXT NOT NULL,
    "fuel_type_id" TEXT NOT NULL,
    "fuel_unit" TEXT,
    "fuel_price" REAL,
    "created_at" DATETIME NOT NULL,
    CONSTRAINT "FuelPrice_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "Station" ("station_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FuelPrice_fuel_type_id_fkey" FOREIGN KEY ("fuel_type_id") REFERENCES "FuelType" ("fuel_type_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
