// Example code

import { Router } from "express";
import * as taskController from "../controllers/task.controllers";

const router = Router();

// GET all tasks
router.get("/", taskController.getAllTasks);

// GET single task by ID
router.get("/:id", taskController.getTaskById);

// POST create new task
router.post("/", taskController.createTask);

// PATCH update task
router.patch("/:id", taskController.updateTask);

// DELETE task
router.delete("/:id", taskController.deleteTask);

export default router;
