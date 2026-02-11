import { prisma } from "../prisma";

// Create a new task
export const getAllPrices = async () => {
    // use prisma (safe) const prices = prisma.fuelPrice.findMany()
    // use raw sql (unsafe but probably fine for the scope of this project)
    //  const prices = prisma.$queryRawUnsafe('SELECT * FROM')
    
    const prices = {}
    // sql goes here
    return prices
};
