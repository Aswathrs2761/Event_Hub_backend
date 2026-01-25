import Organizer from "../Models/organizerSchema.js";


// Create Event
export const createEvent = async (req, res) => {
  try {
    if (req.user.role !== "organizer") {
      return res
        .status(403)
        .json({ message: "Only organizers can create events" });
    }


    const {
      eventtitle,
      description,
      category,
      otherCategory,
      startDate,
      startTime,
      endDate,
      endTime,
      venueName,
      address,
      city,
      state,
      zipCode,
      tickets,
      imageUrl,
    } = req.body;


    if (!eventtitle || !description || !startDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }


    const eventData = {
      eventtitle,
      description,
      category,
      otherCategory,
      startDate,
      startTime,
      endDate,
      endTime,
      venueName,
      address,
      city,
      state,
      zipCode,
      tickets,
      user: req.user._id,
      imageUrl: imageUrl || "https://via.placeholder.com/150",
    };


    // ✅ Use your existing model
    const newEvent = await Organizer.create(eventData);


    res
      .status(201)
      .json({ message: "Event Created Successfully", data: newEvent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};



// Get all events
export const getAllEvents = async (req, res) => {
  try {
    const events = await Organizer.find({ status: "approved" })

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get all events with role-based filtering

// export const getAllEventsbyrole = async (req, res) => {
//   try {
//     let events = [];

//     // If logged in and organizer → only his events
//     if (req.user && req.user.role === "organizer") {
//       events = await Organizer.find({ user: req.user._id })
//         .sort({ createdAt: -1 });
//     } 
//     // User / admin / fallback → all events
//     else {
//       events = await Organizer.find()
//         .sort({ createdAt: -1 });
//     }

//     return res.status(200).json({
//       success: true,
//       data: events,
//     });
//   } catch (error) {
//     console.error("getAllEventsbyrole error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch events",
//       error: error.message,
//     });
//   }
// };



// Get event by ID
export const getEventsById = async (req, res) => {
  try {
    const event = await Organizer.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Event
export const updateEvent = async (req, res) => {
  try {
    const event = await Organizer.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You cannot edit this event" });
    }

    const { title, description, date } = req.body;
    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = date;
    if (req.file) event.imageUrl = req.file.path;

    await event.save();

    res.json({ message: "Event Updated Successfully", data: event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Event
export const deleteEvent = async (req, res) => {
  try {
    const event = await Organizer.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You cannot delete this event" });
    }

    await event.remove();
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get events for logged-in organizer
export const EventsforOrg = async (req, res) => {
  try {
    const events = await Organizer.find({ user: req.user._id });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};