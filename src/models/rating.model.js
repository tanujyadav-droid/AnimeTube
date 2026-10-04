import mongoose, { Schema } from "mongoose";

const ratingSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    episode: {
      type: Schema.Types.ObjectId,
      ref: "Episode",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
  },
  { timestamps: true }
);

// a user can rate an episode only once (changing it updates the same document)
ratingSchema.index({ user: 1, episode: 1 }, { unique: true });

export const Rating = mongoose.model("Rating", ratingSchema);