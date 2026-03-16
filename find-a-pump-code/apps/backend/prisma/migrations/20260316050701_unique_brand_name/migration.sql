/*
  Warnings:

  - Made the column `brand_name` on table `StationBrand` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StationBrand" (
    "station_brand_id" TEXT NOT NULL PRIMARY KEY,
    "brand_name" TEXT NOT NULL,
    "logo_url" TEXT
);
INSERT INTO "new_StationBrand" ("brand_name", "logo_url", "station_brand_id") SELECT "brand_name", "logo_url", "station_brand_id" FROM "StationBrand";
DROP TABLE "StationBrand";
ALTER TABLE "new_StationBrand" RENAME TO "StationBrand";
CREATE UNIQUE INDEX "StationBrand_brand_name_key" ON "StationBrand"("brand_name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
