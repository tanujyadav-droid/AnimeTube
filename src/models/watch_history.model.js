import mongoose, { Schema } from "mongoose";

const watchHistorySchema = new Schema(
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
    progress: {
      type: Number, // seconds watched so far
      default: 0,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// one document per user per episode
watchHistorySchema.index({ user: 1, episode: 1 }, { unique: true });

export const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);