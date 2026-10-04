import mongoose, { Schema } from "mongoose";

const animeSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    studios: [
      {
        type: Schema.Types.ObjectId,
        ref: "Studio",
      },
    ],
    genres: [
      {
        type: Schema.Types.ObjectId,
        ref: "Genre",
      },
    ],
    description: {
      type: String,
      trim: true,
    },
    releaseDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["UPCOMING", "ONGOING", "COMPLETED", "HIATUS"],
      default: "UPCOMING",
    },
    views: {
      type: Number,
      default: 0,
    },
    ageRating: {
      type: String,
      trim: true,
    },
    posterUrl: {
      type: String,
    },
    bannerUrl: {
      type: String,
    },
    trailerUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Anime = mongoose.model("Anime", animeSchema);