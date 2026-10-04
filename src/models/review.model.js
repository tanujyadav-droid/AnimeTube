import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    anime: {
      type: Schema.Types.ObjectId,
      ref: "Anime",
    },
    season: {
      type: Schema.Types.ObjectId,
      ref: "Season",
    },
    episode: {
      type: Schema.Types.ObjectId,
      ref: "Episode",
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// a review must be attached to exactly one of anime / season / episode
reviewSchema.pre("validate", function () {
  const targets = [this.anime, this.season, this.episode].filter(Boolean);
  if (targets.length !== 1) {
    throw new Error("A review must belong to exactly one of anime, season or episode");
  }
});

// so "get all reviews of this anime/season/episode" stays fast
reviewSchema.index({ anime: 1 });
reviewSchema.index({ season: 1 });
reviewSchema.index({ episode: 1 });

export const Review = mongoose.model("Review", reviewSchema);