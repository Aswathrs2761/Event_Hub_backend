import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organizer",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["stripe"],
      required: true,
    },

    // 🔴 ADD THIS FIELD
    paymentIntentId: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },

    tickets: [
      {
        ticketType: String,
        quantity: Number,
        price: Number,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("ticket", ticketSchema);