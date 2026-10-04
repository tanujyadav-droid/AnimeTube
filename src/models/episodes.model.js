import mongoose, { Schema } from "mongoose";

const episodeSchema = new Schema(
  {
    season: {
      type: Schema.Types.ObjectId,
      ref: "Season",
      required: true,
    },
    episodeNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number, // in seconds
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    releaseDate: {
      type: Date,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// the same season can't have two "episode 1"s
episodeSchema.index({ season: 1, episodeNumber: 1 }, { unique: true });

export const Episode = mongoose.model("Episode", episodeSchema);