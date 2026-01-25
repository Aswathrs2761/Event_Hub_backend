import User from "../Models/userSchema.js";
import Organizer from "../Models/organizerSchema.js";
import Ticket from "../Models/ticketSchema.js";

// DASHBOARD OVERVIEW
export const getDashboardOverview = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEvents = await Organizer.countDocuments();
    const pendingEvents = await Organizer.countDocuments({ status: "pending" });
    const approvedEvents = await Organizer.countDocuments({ status: "approved" });
    const totalTickets = await Ticket.countDocuments();
    const successfulTickets = await Ticket.countDocuments({ status: "success" });

    const tickets = await Ticket.find({ status: "success" });
    const totalRevenue = tickets.reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
      data: {
        totalUsers,
        totalEvents,
        pendingEvents,
        approvedEvents,
        totalTickets,
        successfulTickets,
        totalRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(filter)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET USER DETAILS WITH EVENTS
export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const events = await Organizer.find({ user: user._id });
    const tickets = await Ticket.find({ user: user._id });

    res.status(200).json({
      data: { user, events, tickets },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// TOGGLE USER STATUS
export const toggleUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: `User ${status}`, data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await Organizer.deleteMany({ user: userId });
    await Ticket.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL EVENTS
export const getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const events = await Organizer.find(filter)
      .populate("user", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Organizer.countDocuments(filter);

    res.status(200).json({
      data: events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET EVENT DETAILS
export const getEventDetails = async (req, res) => {
  try {
    const event = await Organizer.findById(req.params.id).populate(
      "user",
      "name email"
    );
    if (!event) return res.status(404).json({ message: "Event not found" });

    const tickets = await Ticket.find({ event: event._id });
    const totalSold = tickets.length;
    const revenue = tickets
      .filter((t) => t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
      data: { event, totalTicketsSold: totalSold, revenue, tickets },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// APPROVE / REJECT / SUSPEND EVENT
export const updateEventStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "suspended", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const event = await Organizer.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!event) return res.status(404).json({ message: "Event not found" });

    res.status(200).json({ message: `Event ${status}`, data: event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE EVENT
export const adminDeleteEvent = async (req, res) => {
  try {
    const event = await Organizer.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    await Ticket.deleteMany({ event: event._id });

    res.status(200).json({ message: "Event deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL TRANSACTIONS/TICKETS
export const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = status ? { status } : {};

    const transactions = await Ticket.find(filter)
      .populate("user", "name email")
      .populate("event", "eventtitle")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Ticket.countDocuments(filter);

    res.status(200).json({
      data: transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET TRANSACTION DETAILS
export const getTransactionDetails = async (req, res) => {
  try {
    const transaction = await Ticket.findById(req.params.id)
      .populate("user", "name email")
      .populate("organizer", "name email")
      .populate("event", "eventtitle");

    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    res.status(200).json({ data: transaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PROCESS REFUND
export const processRefund = async (req, res) => {
  try {
    const transaction = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status: "refunded" },
      { new: true }
    );

    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    res.status(200).json({ message: "Refund processed", data: transaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REVENUE REPORT
export const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { status: "success" };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const tickets = await Ticket.find(filter);
    const totalRevenue = tickets.reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
      data: {
        totalRevenue,
        transactionCount: tickets.length,
        averageTransactionValue:
          tickets.length > 0 ? totalRevenue / tickets.length : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// EVENT PERFORMANCE REPORT
export const getEventPerformance = async (req, res) => {
  try {
    const event = await Organizer.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const tickets = await Ticket.find({ event: req.params.id });
    const successfulTickets = tickets.filter((t) => t.status === "success");
    const revenue = successfulTickets.reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
      data: {
        eventTitle: event.eventtitle,
        totalTicketsSold: tickets.length,
        successfulTickets: successfulTickets.length,
        revenue,
        refundedTickets: tickets.filter((t) => t.status === "refunded").length,
        failedTransactions: tickets.filter((t) => t.status === "failed").length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PLATFORM STATISTICS
export const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEvents = await Organizer.countDocuments();
    const totalTickets = await Ticket.countDocuments();
    
    const tickets = await Ticket.find();
    const totalRevenue = tickets
      .filter((t) => t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
      data: {
        totalUsers,
        totalEvents,
        totalTickets,
        totalRevenue,
        activeEvents: await Organizer.countDocuments({ status: "approved" }),
        pendingEvents: await Organizer.countDocuments({ status: "pending" }),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
