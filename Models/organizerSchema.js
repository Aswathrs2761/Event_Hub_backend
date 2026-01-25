import mongoose from "mongoose";

const OrganizerEvent = new mongoose.Schema(
  {
    eventtitle: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Music",
        "Tech",
        "Business",
        "Sports",
        "Art",
        "Food",
        "Health",
        "Other"
      ]
    },
    otherCategory: {
      type: String,
      required: function () {
        return this.category === "Other";
      }
    },
    imageUrl: {
      type: String
    },

    startDate: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/
    },
    endDate: {
      type: Date,
      required: true
    },
    endTime: {
      type: String,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/
    },

    venueName: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: String,
    state: String,
    zipCode: String,

    // ✅ MULTIPLE TICKETS
    tickets: [
      {
        ticketType: {
          type: String,
          enum: ["VIP", "Platinum", "Gold", "Silver"],
          required: true
        },
        price: {
          type: Number,
          required: true,
          min: 0
        },
        quantity: {
          type: Number,
          required: true,
          min: 0
        }
      }
    ],

    status: {
      type: String,
      enum: ["pending", "approved", "suspended"],
      default: "pending"
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Organizer", OrganizerEvent);
