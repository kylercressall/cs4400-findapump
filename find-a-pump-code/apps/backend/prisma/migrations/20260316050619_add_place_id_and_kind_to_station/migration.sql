-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Station" (
    "station_id" TEXT NOT NULL PRIMARY KEY,
    "location_id" TEXT NOT NULL,
    "station_brand_id" TEXT,
    "place_id" TEXT,
    "kind" TEXT,
    CONSTRAINT "Station_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "Location" ("location_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Station_station_brand_id_fkey" FOREIGN KEY ("station_brand_id") REFERENCES "StationBrand" ("station_brand_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Station" ("location_id", "station_brand_id", "station_id") SELECT "location_id", "station_brand_id", "station_id" FROM "Station";
DROP TABLE "Station";
ALTER TABLE "new_Station" RENAME TO "Station";
CREATE UNIQUE INDEX "Station_place_id_key" ON "Station"("place_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
