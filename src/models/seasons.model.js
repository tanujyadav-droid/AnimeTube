import mongoose, { Schema } from "mongoose";

const seasonSchema = new Schema(
  {
    anime: {
      type: Schema.Types.ObjectId,
      ref: "Anime",
      required: true,
    },
    seasonNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    releaseDate: {
      type: Date,
    },
    posterUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

// one anime can't have two "season 1"s
seasonSchema.index({ anime: 1, seasonNumber: 1 }, { unique: true });

export const Season = mongoose.model("Season", seasonSchema);