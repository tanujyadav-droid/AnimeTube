import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { WatchHistory } from "../models/watch_history.model.js";
import { Episode } from "../models/episodes.model.js";

const updateWatchHistory = asyncHandler(async (req, res) => {
  const { episodeId } = req.params;
  const userId = req.user._id;
  const progress = req.body?.progress;

  if (progress === undefined) {
    throw new ApiError(400, "progress is required");
  }

  if (typeof progress !== "number" || progress < 0) {
    throw new ApiError(400, "Invalid progress value.");
  }

  const episode = await Episode.findById(episodeId).select("duration");
  if (!episode) {
    throw new ApiError(404, "Episode not found");
  }

  // cap progress at the episode length
  const clampedProgress = Math.min(progress, episode.duration);
  const completed = clampedProgress >= episode.duration;

  const watchHistory = await WatchHistory.findOneAndUpdate(
    { user: userId, episode: episodeId },
    { $set: { progress: clampedProgress, completed } },
    { upsert: true, new: true, runValidators: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, watchHistory, "Watch history updated successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {

  let page = parseInt(req.query.page);
  let limit = parseInt(req.query.limit);

  if (!page || page < 1) page = 1;
  if (!limit || limit < 1) limit = 10;
  if (limit > 50) limit = 50; 

  const filter = { user: req.user._id }; 

  const [history, total] = await Promise.all([
    WatchHistory.find(filter)
      .sort({ updatedAt: -1 }) 
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: "episode",
        select: "title episodeNumber duration thumbnailUrl season",
        populate: {
          path: "season",
          select: "title seasonNumber anime",
          populate: {
            path: "anime",
            select: "title posterUrl",
          },
        },
      }),
    WatchHistory.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        history,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Watch history fetched successfully"
    )
  );
});

const removeOneEntry = asyncHandler(async (req, res) => {
  const { episodeId } = req.params;

  const result = await WatchHistory.deleteOne({
    user: req.user._id,
    episode: episodeId,
  });

  if (result.deletedCount === 0) {
    throw new ApiError(404, "This episode is not in your watch history");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Removed from watch history"));
});

const clearWatchHistory = asyncHandler(async (req, res) => {
  const { deletedCount } = await WatchHistory.deleteMany({
    user: req.user._id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { deletedCount }, "Watch history cleared successfully")
    );
});

export {
  updateWatchHistory,
  getWatchHistory,
  removeOneEntry,
  clearWatchHistory,
};
