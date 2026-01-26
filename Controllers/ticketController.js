import organizer from "../Models/organizerSchema.js";
import ticket from "../Models/ticketSchema.js";
import mongoose from "mongoose";
import sendmail from "../Utils/mailer.js";
import Stripe from "stripe";
import userSchema from "../Models/userSchema.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);



export const buyTickets = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email;

    const { eventId, ticketType, quantity, price } = req.body;

    if (!eventId || !quantity || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const event = await organizer.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const totalAmount = quantity * price;

    // Only create PaymentIntent (do NOT save ticket here)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: "inr",
      receipt_email: userEmail,
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: userId.toString(),
        eventId: eventId.toString(),
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("BUY TICKET ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};



export const confirmTicket = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email;
    const userName = req.user.name;

    const { eventId, ticketType, quantity, price, paymentIntentId } = req.body;

    const event = await organizer.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const qty = Number(quantity);
    const totalAmount = qty * price;

    // 1️⃣ Verify payment
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    // 2️⃣ Reduce quantity for the selected ticket type
    const updatedEvent = await organizer.findOneAndUpdate(
      {
        _id: eventId,
        "tickets.ticketType": ticketType,
        "tickets.quantity": { $gte: qty }, // ensure enough tickets exist
      },
      {
        $inc: { "tickets.$.quantity": -qty },
      },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(400).json({
        message: "Not enough tickets available for this type",
      });
    }

    // 3️⃣ Create ticket record
    const newTicket = await ticket.create({
      organizer: event.user,
      user: userId,
      event: event._id,
      amount: totalAmount,
      paymentMethod: "stripe",
      status: "success",
      paymentIntentId,
      tickets: [
        {
          ticketType,
          quantity: qty,
          price,
        },
      ],
    });

    const message = `
Hi ${userName},

Your ticket has been booked successfully!

Event: ${event.eventtitle}
Ticket Type: ${ticketType}
Quantity: ${qty}
Total Paid: ₹${totalAmount}
`;

    await sendmail(userEmail, "Ticket Booking Confirmation", message);

    res.status(201).json({
      message: "Ticket booked successfully",
      data: newTicket,
    });
  } catch (error) {
    console.error("CONFIRM TICKET ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};




// Get User's Purchased Tickets

export const getUserTickets = async (req, res) => {
  try {
    const userId = req.user._id;

    const userTickets = await ticket.find({ user: userId, status: "success" })
      .populate('event', 'eventtitle description startDate startTime venueName address city state')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "User tickets retrieved successfully",
      tickets: userTickets,
    });
    // console.log("datas", userTickets);

  } catch (error) {
    console.error("GET USER TICKETS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// Cancel Ticket and Process Refund

export const cancelTicket = async (req, res) => {
  try {
    const userId = req.user._id;
    const { ticketId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }

    const ticketData = await ticket.findById(ticketId)
      .populate("user", "name email")
      .populate("event", "eventtitle");

    if (!ticketData) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticketData.user._id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized: This ticket doesn't belong to you" });
    }

    if (ticketData.status === "refunded") {
      return res.status(400).json({ message: "Ticket has already been refunded" });
    }

    if (ticketData.status !== "success") {
      return res
        .status(400)
        .json({ message: "Can only refund successfully purchased tickets" });
    }

    // 🔴 Stripe refund
    try {
      const refund = await stripe.refunds.create({
        payment_intent: ticketData.paymentIntentId,
      });

      if (refund.status !== "succeeded") {
        return res.status(400).json({ message: "Refund failed. Please try again." });
      }
    } catch (stripeError) {
      console.error("Stripe Refund Error:", stripeError);
      return res
        .status(500)
        .json({ message: "Refund processing failed: " + stripeError.message });
    }

    // Mark ticket as refunded
    const updatedTicket = await ticket.findByIdAndUpdate(
      ticketId,
      { status: "refunded" },
      { new: true }
    );

    // 🔁 Restore quantities in the event for each ticket type
    for (const t of ticketData.tickets) {
      await organizer.findOneAndUpdate(
        {
          _id: ticketData.event,
          "tickets.ticketType": t.ticketType,
        },
        {
          $inc: { "tickets.$.quantity": t.quantity },
        }
      );
    }

    const refundMessage = `
Hi ${ticketData.user.name},

Your ticket cancellation has been processed successfully!

Event: ${ticketData.event.eventtitle}
Refund Amount: ₹${ticketData.amount}
Refund Status: Completed

The amount will be credited back to your original payment method within 5–7 business days.

Thank you!
`;

    await sendmail(
      ticketData.user.email,
      "Ticket Cancellation & Refund Confirmation",
      refundMessage
    );

    res.status(200).json({
      message: "Ticket cancelled and refund processed successfully",
      data: updatedTicket,
    });
  } catch (error) {
    console.error("CANCEL TICKET ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
// Get Organizer Total Amount and Orders


export const getOrganizerTotal = async (req, res) => {
  try {
    const organizerId = req.user._id;

    if (!organizerId || !mongoose.Types.ObjectId.isValid(organizerId)) {
      return res.status(400).json({ message: "Invalid organizer id" });
    }

    const result = await ticket.aggregate([
      {
        $match: {
          organizer: new mongoose.Types.ObjectId(organizerId),
          status: "success",
        },
      },
      {
        $group: {
          _id: "$organizer",
          totalAmount: { $sum: "$amount" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      return res.json({ totalAmount: 0, totalOrders: 0 });
    }

    res.json({
      totalAmount: result[0].totalAmount,
      totalOrders: result[0].totalOrders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// getTotal Tickets Sold for an Event

export const getTotalTicketsSold = async (req, res) => {
  try {
    const organizerId = req.user._id;

    const result = await ticket.aggregate([
      {
        $match: {
          organizer: organizerId,
          status: "success",
        },
      },
      {
        $unwind: "$tickets",
      },
      {
        $group: {
          _id: "$organizer",
          totalTicketsSold: { $sum: "$tickets.quantity" },
        },
      },
    ]);

    const totalTicketsSold =
      result.length > 0 ? result[0].totalTicketsSold : 0;

    res.json({ totalTicketsSold });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//get all events by organizer id

export const getEventsByOrganizer = async (req, res) => {
  try {
    // console.log("Logged in user:", req.user._id);

    const all = await organizer.find();
    // console.log("All events in DB:", all);

    const events = await organizer.find({ user: req.user._id });
    // console.log("Matched events:", events);

    res.status(200).json({ events });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// suspendEvent 

export const suspendEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const event = await organizer.findOneAndUpdate(
      { _id: id, user: userId },
      { status: "suspended" },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({ message: "Event suspended", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// updateEvent
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const event = await organizer.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not allowed to edit this event" });
    }

    const updateData = {
      eventtitle: req.body.eventtitle,
      description: req.body.description,
      category: req.body.category,
      startDate: req.body.startDate,
      startTime: req.body.startTime,
      endDate: req.body.endDate,
      endTime: req.body.endTime,
      venueName: req.body.venueName,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
    };

    if (req.body.imageUrl) {
      updateData.imageUrl = req.body.imageUrl;
    }

    const updatedEvent = await organizer.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.status(200).json({
      message: "Event updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Update Event Error:", error);
    res.status(500).json({ message: error.message });
  }
};


// fetching recent sales report 

export const getRecentSales = async (req, res) => {
  try {
    const organizerId = req.user._id;

    const sales = await ticket.aggregate([
      {
        $match: {
          organizer: new mongoose.Types.ObjectId(organizerId),
          status: "success",
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },

      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "buyer",
        },
      },
      { $unwind: "$buyer" },

      {
        $lookup: {
          from: "organizers",
          localField: "event",
          foreignField: "_id",
          as: "event",
        },
      },
      { $unwind: "$event" },

      {
        $project: {
          buyerName: "$buyer.name",
          buyerEmail: "$buyer.email",
          eventTitle: "$event.eventtitle",
          amount: 1,
          tickets: 1,
          createdAt: 1,
        },
      },
    ]);

    const formatted = sales.map((s) => ({
      buyerName: s.buyerName,
      buyerEmail: s.buyerEmail,
      eventTitle: s.eventTitle,
      amount: s.amount,
      totalTickets: s.tickets.reduce((a, b) => a + b.quantity, 0),
      createdAt: s.createdAt,
    }));

    res.status(200).json({ sales: formatted });
  } catch (error) {
    console.error("Recent Sales Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// get chart data for last 7 days sales
export const getChartData = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const salesData = await ticket.aggregate([
      {
        $match: {
          organizer: new mongoose.Types.ObjectId(organizerId),
          status: "success",
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalAmount: { $sum: "$amount" },
          totalTickets: { $sum: { $reduce: { input: "$tickets", initialValue: 0, in: { $add: ["$$value", "$$this.quantity"] } } } },
        },
      },
      {
        $sort: { "_id": 1 },
      },
    ]);

    res.status(200).json({ chartData: salesData });
  } catch (error) {
    console.error("Chart Data Error:", error);
    res.status(500).json({ message: error.message });
  }
};


export const getUserNameAndEmail = async (req, res) => {
  try {
    const userId = req.user._id;
    const users = await userSchema.findById(userId).select("name email -_id");
    res.status(200).json({ data: users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};