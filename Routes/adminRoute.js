import express from "express";
import { authMiddleware } from "../Middleswares/authMiddleware.js";
import { adminMiddleware } from "../Middleswares/adminMiddleware.js";
import {
  getDashboardOverview,
  getAllUsers,
  getUserDetails,
  toggleUserStatus,
  deleteUser,
  getAllEvents,
  getEventDetails,
  updateEventStatus,
  adminDeleteEvent,
  getTransactions,
  getTransactionDetails,
  processRefund,
  getRevenueReport,
  getEventPerformance,
  getPlatformStats,
} from "../Controllers/adminController.js";

const adminRoute = express.Router();

adminRoute.use(authMiddleware, adminMiddleware);

// Dashboard
adminRoute.get("/dashboard", getDashboardOverview);

// Users
adminRoute.get("/users", getAllUsers);
adminRoute.get("/users/:id", getUserDetails);
adminRoute.patch("/users/:id/status", toggleUserStatus);
adminRoute.delete("/users/:id", deleteUser);

// Events
adminRoute.get("/events", getAllEvents);
adminRoute.get("/events/:id", getEventDetails);
adminRoute.put("/events/:id/status", updateEventStatus);
adminRoute.delete("/events/:id", adminDeleteEvent);

// Transactions
adminRoute.get("/transactions", getTransactions);
adminRoute.get("/transactions/:id", getTransactionDetails);
adminRoute.patch("/transactions/:id/refund", processRefund);

// Reports
adminRoute.get("/reports/revenue", getRevenueReport);
adminRoute.get("/reports/event/:id", getEventPerformance);
adminRoute.get("/reports/stats", getPlatformStats);

export default adminRoute;
