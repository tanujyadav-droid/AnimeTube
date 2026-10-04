import mongoose, { Schema } from "mongoose";

const genreSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export const Genre = mongoose.model("Genre", genreSchema);