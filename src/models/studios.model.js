import mongoose, { Schema } from "mongoose";

const studioSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    websiteUrl: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Studio = mongoose.model("Studio", studioSchema);