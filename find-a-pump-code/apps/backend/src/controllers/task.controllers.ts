import { Request, Response } from "express";
import * as taskServices from "../services/task.services";

// GET /api/tasks
export const getAllTasks = async (_req: Request, res: Response) => {
  try {
    const tasks = await taskServices.getAllTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

// GET /api/tasks/:id
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const task = await taskServices.getTaskById(req.params.id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch task" });
  }
};

// POST /api/tasks
export const createTask = async (req: Request, res: Response) => {
  const { title } = req.body;
  if (!title) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  try {
    const task = await taskServices.createTask(title);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to create task" });
  }
};

// PATCH /api/tasks/:id
export const updateTask = async (req: Request, res: Response) => {
  const { title, done } = req.body;

  try {
    const task = await taskServices.updateTask(req.params.id, { title, done });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to update task" });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req: Request, res: Response) => {
  try {
    await taskServices.deleteTask(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete task" });
  }
};
