import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { WatchHistory } from "../models/watch_history.model.js";
import { Episode } from "../models/episodes.model.js";
import { Season } from "../models/seasons.model.js";
import { Anime } from "../models/anime.model.js";

// views = unique users who started watching, so this only runs the FIRST time
// a user watches an episode. The season / anime only count it if the user
// has not watched any other episode of that season / anime before.
const countFirstView = async (userId, episode) => {
  const season = await Season.findById(episode.season).select("anime");
  const seasonIds = await Season.distinct("_id", { anime: season.anime });

  // the other episodes of this season / anime (not counting this one)
  const [seasonEpisodeIds, animeEpisodeIds] = await Promise.all([
    Episode.distinct("_id", { season: episode.season, _id: { $ne: episode._id } }),
    Episode.distinct("_id", { season: { $in: seasonIds }, _id: { $ne: episode._id } }),
  ]);

  const [seenSeason, seenAnime] = await Promise.all([
    WatchHistory.exists({ user: userId, episode: { $in: seasonEpisodeIds } }),
    WatchHistory.exists({ user: userId, episode: { $in: animeEpisodeIds } }),
  ]);

  await Promise.all([
    Episode.updateOne({ _id: episode._id }, { $inc: { views: 1 } }),
    !seenSeason && Season.updateOne({ _id: episode.season }, { $inc: { views: 1 } }),
    !seenAnime && Anime.updateOne({ _id: season.anime }, { $inc: { views: 1 } }),
  ]);
};

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

  const episode = await Episode.findById(episodeId).select("duration season");
  if (!episode) {
    throw new ApiError(404, "Episode not found");
  }

  // cap progress at the episode length
  const clampedProgress = Math.min(progress, episode.duration);
  const completed = clampedProgress >= episode.duration;

  const result = await WatchHistory.findOneAndUpdate(
  { user: userId, episode: episodeId },
  { $set: { progress: clampedProgress, completed } },
  { upsert: true, new: true, runValidators: true, includeResultMetadata: true }
);
const watchHistory = result.value;

// updatedExisting is false when the upsert had to create the document,
// which means this is the first time this user watches this episode
if (!result.lastErrorObject.updatedExisting) {
  await countFirstView(userId, episode);
}

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
