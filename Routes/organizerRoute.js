// Routes/organizerRoute.js
import express from "express";
import {
  createEvent,
  deleteEvent,
  EventsforOrg,
  getAllEvents,
  getEventsById,
  updateEvent,
} from "../Controllers/organizerController.js";
import { authMiddleware } from "../Middleswares/authMiddleware.js";
// import { upload } from "../Middleswares/uploadMiddleware.js"; // ✅ KEEP ONLY THIS

const Orgroute = express.Router();

Orgroute.post(
  "/createEvent",
  authMiddleware,
  createEvent
);

Orgroute.get("/getallevents", getAllEvents);
Orgroute.get("/getEventsById/:id", getEventsById);

Orgroute.put(
  "/updateEvent/:id",
  authMiddleware,
  updateEvent
);

Orgroute.delete("/deleteEvent/:id", authMiddleware, deleteEvent);
Orgroute.get("/EventforOrg", authMiddleware, EventsforOrg);

export default Orgroute;
