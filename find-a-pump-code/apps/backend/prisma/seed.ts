import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const user = await prisma.user.create({
    data: {
      username: "test-user",
    },
  });

  // Create fuel types
  const regular = await prisma.fuelType.create({
    data: { name: "Regular" },
  });
  const midgrade = await prisma.fuelType.create({
    data: { name: "Mid-Grade" },
  });
  const premium = await prisma.fuelType.create({
    data: { name: "Premium" },
  });
  const diesel = await prisma.fuelType.create({
    data: { name: "Diesel" },
  });
  const electric = await prisma.fuelType.create({
    data: { name: "Electric" },
  });

  // Create station brands
  const maveric = await prisma.stationBrand.create({
    data: {
      brandName: "Maverick",
      logoUrl: "https://example.com/maverick-logo.png",
    },
  });
  const chevron = await prisma.stationBrand.create({
    data: {
      brandName: "Chevron",
      logoUrl: "https://example.com/chevron-logo.png",
    },
  });
  const shell = await prisma.stationBrand.create({
    data: {
      brandName: "Shell",
      logoUrl: "https://example.com/shell-logo.png",
    },
  });

  // Create locations
  // maveric
  const loc1 = await prisma.location.create({
    data: {
      street: "1249 S Geneva Rd",
      city: "Orem",
      zip: "84048",
      country: "USA",
      lat: 40.27447122839266,
      long: -111.72620075135104,
      googleMapsUrl: "https://maps.app.goo.gl/yuKGgMXfFjj3w2SLA",
    },
  });
  const loc2 = await prisma.location.create({
    data: {
      street: "1308 W University Pkwy",
      city: "Orem",
      zip: "84058",
      country: "USA",
      lat: 40.275568069486035,
      long: -111.72714976579307,
      googleMapsUrl: "https://maps.app.goo.gl/hr46fAaG9hAQxNDZ9",
    },
  });
  const loc3 = await prisma.location.create({
    data: {
      street: "1520 S State St",
      city: "Orem",
      zip: "84097",
      country: "USA",
      lat: 40.269707948155435,
      long: -111.6837372813783,
      googleMapsUrl: "https://maps.app.goo.gl/KopZrxUjEk1Sjon89",
    },
  });

  // Create stations
  const station1 = await prisma.station.create({
    data: {
      locationId: loc1.id,
      stationBrandId: maveric.id,
    },
  });
  const station2 = await prisma.station.create({
    data: {
      locationId: loc2.id,
      stationBrandId: chevron.id,
    },
  });
  const station3 = await prisma.station.create({
    data: {
      locationId: loc3.id,
      stationBrandId: shell.id,
    },
  });

  // Create fuel prices for station 1
  await prisma.fuelPrice.createMany({
    data: [
      {
        stationId: station1.id,
        fuelTypeId: regular.id,
        fuelUnit: "gallon",
        fuelPrice: 4.59,
        createdAt: new Date(),
      },
      {
        stationId: station1.id,
        fuelTypeId: midgrade.id,
        fuelUnit: "gallon",
        fuelPrice: 4.89,
        createdAt: new Date(),
      },
      {
        stationId: station1.id,
        fuelTypeId: premium.id,
        fuelUnit: "gallon",
        fuelPrice: 5.19,
        createdAt: new Date(),
      },
    ],
  });

  // Create fuel prices for station 2
  await prisma.fuelPrice.createMany({
    data: [
      {
        stationId: station2.id,
        fuelTypeId: regular.id,
        fuelUnit: "gallon",
        fuelPrice: 4.49,
        createdAt: new Date(),
      },
      {
        stationId: station2.id,
        fuelTypeId: midgrade.id,
        fuelUnit: "gallon",
        fuelPrice: 4.79,
        createdAt: new Date(),
      },
      {
        stationId: station2.id,
        fuelTypeId: premium.id,
        fuelUnit: "gallon",
        fuelPrice: 5.09,
        createdAt: new Date(),
      },
      {
        stationId: station2.id,
        fuelTypeId: electric.id,
        fuelUnit: "kWh",
        fuelPrice: 0.45,
        createdAt: new Date(),
      },
    ],
  });

  // Create fuel prices for station 3
  await prisma.fuelPrice.createMany({
    data: [
      {
        stationId: station3.id,
        fuelTypeId: regular.id,
        fuelUnit: "gallon",
        fuelPrice: 4.69,
        createdAt: new Date(),
      },
      {
        stationId: station3.id,
        fuelTypeId: midgrade.id,
        fuelUnit: "gallon",
        fuelPrice: 4.99,
        createdAt: new Date(),
      },
      {
        stationId: station3.id,
        fuelTypeId: premium.id,
        fuelUnit: "gallon",
        fuelPrice: 5.29,
        createdAt: new Date(),
      },
    ],
  });

  // Create user config
  await prisma.userConfig.create({
    data: {
      userId: user.id,
      fuelPreferenceId: regular.id,
    },
  });

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
