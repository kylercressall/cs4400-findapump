import { prisma } from "../prisma";

// Get all tasks
export const getAllTasks = async () => {
  return prisma.task.findMany({
    orderBy: { createdAt: "desc" },
  });
};

// Get a single task by ID
export const getTaskById = async (id: string) => {
  return prisma.task.findUnique({
    where: { id },
  });
};

// Create a new task
export const createTask = async (title: string) => {
  return prisma.task.create({
    data: { title },
  });
};

// Update a task
export const updateTask = async (id: string, data: { title?: string; done?: boolean }) => {
  return prisma.task.update({
    where: { id },
    data,
  });
};

// Delete a task
export const deleteTask = async (id: string) => {
  return prisma.task.delete({
    where: { id },
  });
};
