import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    planName: {
      type: String,
      enum: ["FREE", "BASIC", "PREMIUM"],
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number, // in days
      required: true,
      min: 1,
    },
    maxDevices: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    videoQuality: {
      type: String,
      enum: ["480p", "720p", "1080p", "4K"],
      required: true,
    },
    downloadAllowed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);