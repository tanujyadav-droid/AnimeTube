import mongoose from "mongoose";
import { Rating } from "../models/rating.model.js";
import { Episode } from "../models/episodes.model.js";
import { Season } from "../models/seasons.model.js";
import { Anime } from "../models/anime.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// average + count of every rating whose episode is in episodeIds
const summarize = async (episodeIds) => {
  const [result] = await Rating.aggregate([
    { $match: { episode: { $in: episodeIds } } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  return {
    average: result ? Math.round(result.average * 10) / 10 : null,
    count: result?.count ?? 0,
  };
};

const rateEpisode = asyncHandler(async (req, res) => {
  const { episodeId } = req.params;
  const rating = req.body?.rating;

  if (rating === undefined) {
    throw new ApiError(400, "rating is required");
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 10) {
    throw new ApiError(400, "rating must be a number between 1 and 10");
  }

  if (!(await Episode.exists({ _id: episodeId }))) {
    throw new ApiError(404, "Episode not found");
  }

  // one rating per user per episode: update it if it exists, create it if not
  const saved = await Rating.findOneAndUpdate(
    { user: req.user._id, episode: episodeId },
    { $set: { rating } },
    { upsert: true, new: true, runValidators: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, saved, "Rating saved successfully"));
});

const getMyRating = asyncHandler(async (req, res) => {
  const { episodeId } = req.params;

  const myRating = await Rating.findOne({
    user: req.user._id,
    episode: episodeId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        myRating,
        myRating ? "Rating fetched successfully" : "You have not rated this episode yet"
      )
    );
});

const removeRating = asyncHandler(async (req, res) => {
  const { episodeId } = req.params;

  const result = await Rating.deleteOne({
    user: req.user._id,
    episode: episodeId,
  });

  if (result.deletedCount === 0) {
    throw new ApiError(404, "You have not rated this episode");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Rating removed successfully"));
});

const getEpisodeRating = asyncHandler(async (req, res) => {
  const { episodeId } = req.params;

  if (!mongoose.isObjectIdOrHexString(episodeId)) {
    throw new ApiError(400, "Invalid episode id");
  }
  if (!(await Episode.exists({ _id: episodeId }))) {
    throw new ApiError(404, "Episode not found");
  }

  // aggregate() does not cast strings to ObjectIds like find() does,
  // so the id has to be converted by hand
  const summary = await summarize([new mongoose.Types.ObjectId(episodeId)]);

  return res
    .status(200)
    .json(new ApiResponse(200, summary, "Episode rating fetched successfully"));
});

const getSeasonRating = asyncHandler(async (req, res) => {
  const { seasonId } = req.params;

  if (!mongoose.isObjectIdOrHexString(seasonId)) {
    throw new ApiError(400, "Invalid season id");
  }
  if (!(await Season.exists({ _id: seasonId }))) {
    throw new ApiError(404, "Season not found");
  }

  const episodeIds = await Episode.distinct("_id", { season: seasonId });
  const summary = await summarize(episodeIds);

  return res
    .status(200)
    .json(new ApiResponse(200, summary, "Season rating fetched successfully"));
});

const getAnimeRating = asyncHandler(async (req, res) => {
  const { animeId } = req.params;

  if (!mongoose.isObjectIdOrHexString(animeId)) {
    throw new ApiError(400, "Invalid anime id");
  }
  if (!(await Anime.exists({ _id: animeId }))) {
    throw new ApiError(404, "Anime not found");
  }

  const seasonIds = await Season.distinct("_id", { anime: animeId });
  const episodeIds = await Episode.distinct("_id", { season: { $in: seasonIds } });
  const summary = await summarize(episodeIds);

  return res
    .status(200)
    .json(new ApiResponse(200, summary, "Anime rating fetched successfully"));
});

export {
  rateEpisode,
  getMyRating,
  removeRating,
  getEpisodeRating,
  getSeasonRating,
  getAnimeRating,
};