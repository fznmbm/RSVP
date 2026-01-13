import mongoose from "mongoose";

const RsvpSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide your name"],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, "Please provide your phone number"],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  under5: {
    type: Number,
    default: 0,
    min: 0,
  },
  age5to12: {
    type: Number,
    default: 0,
    min: 0,
  },
  age12plus: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  paymentReference: {
    type: String,
    trim: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "confirmed"],
    default: "pending",
  },
  notes: {
    type: String,
    trim: true,
  },

  mealSelectionToken: {
    type: String,
    unique: true,
    sparse: true, // Allows null values
  },
  mealSelectionComplete: {
    type: Boolean,
    default: false,
  },
  mealSelectionDeadline: {
    type: Date,
    default: () => new Date("2026-01-17T22:00:00Z"), // Jan 12, 2026, 10 PM
  },
  mealSelections: [
    {
      ageCategory: {
        type: String,
        enum: ["under5", "age5to12", "age12plus"], // ✅ UPDATED
      },
      personIndex: Number, // Which person in that category (1, 2, 3...)
      mealChoice: {
        type: String,
        enum: ["nuggets-chips", "not-required", "rice-curry", "burger-meal"],
      },
    },
  ],
  dietaryRestrictions: String,
  mealSelectionSubmittedAt: Date,

  // QR Check-in fields (NEW)
  checkInCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  checkedIn: {
    type: Boolean,
    default: false,
  },
  checkInTime: {
    type: Date,
  },
  checkInBy: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate total amount AND generate QR code before saving
RsvpSchema.pre("save", function (next) {
  // Calculate total amount
  this.totalAmount = this.age5to12 * 10 + this.age12plus * 15;

  // Generate QR code if payment status is paid and code doesn't exist
  if (this.paymentStatus === "paid" && !this.checkInCode) {
    this.checkInCode = `AHHC${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 5)
      .toUpperCase()}`;
  }

  next();
});

export default mongoose.models.Rsvp || mongoose.model("Rsvp", RsvpSchema);
