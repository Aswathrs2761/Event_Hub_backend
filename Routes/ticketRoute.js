import express from "express";
import { authMiddleware } from "../Middleswares/authMiddleware.js";
import { createStripePayment } from "../Controllers/stripeController.js";
import { buyTickets, getChartData, getEventsByOrganizer, getOrganizerTotal, getRecentSales, getTotalTicketsSold, getUserTickets, cancelTicket, suspendEvent, updateEvent, confirmTicket, getUserNameAndEmail } from "../Controllers/ticketController.js";
// import upload from "../Config/Multer.js";

const router = express.Router();

router.post("/create-payment", authMiddleware, createStripePayment );
router.post("/buy-Tickets", authMiddleware, buyTickets);
router.post("/confirm-ticket", authMiddleware, confirmTicket);
router.get("/my-tickets", authMiddleware, getUserTickets);
router.delete("/cancel-ticket/:ticketId", authMiddleware, cancelTicket);
router.get("/organizer-total", authMiddleware, getOrganizerTotal);
router.get("/tickets-sold", authMiddleware, getTotalTicketsSold);
router.get("/my-events", authMiddleware, getEventsByOrganizer);
router.patch("/suspend/:id", authMiddleware, suspendEvent);
router.put("/edit-event/:id", authMiddleware,  updateEvent);
router.get("/recent-sales", authMiddleware, getRecentSales);
router.get("/chart-data", authMiddleware, getChartData);
router.get("/users/detail", authMiddleware, getUserNameAndEmail);





export default router;
