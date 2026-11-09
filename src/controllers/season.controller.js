import mongoose from "mongoose";
import { Season } from "../models/seasons.model.js";
import { Anime } from "../models/anime.model.js";
import { Episode } from "../models/episodes.model.js";
import { Review } from "../models/review.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { removeTempFile, deleteImageByUrl } from "../utils/fileHelpers.js";

const createSeason = asyncHandler(async (req, res) => {
  const { animeId, seasonNumber, title, description, releaseDate } = req.body;

  try {
    if (!mongoose.isObjectIdOrHexString(animeId)) {
      throw new ApiError(400, "A valid animeId is required");
    }
    if (seasonNumber === undefined || seasonNumber === "") {
      throw new ApiError(400, "seasonNumber is required");
    }
    if (!(await Anime.exists({ _id: animeId }))) {
      throw new ApiError(404, "Anime not found");
    }
  } catch (error) {
    removeTempFile(req.file);
    throw error;
  }

  let poster;
  if (req.file?.path) {
    poster = await uploadOnCloudinary(req.file.path);
    if (!poster) {
      throw new ApiError(500, "Failed to upload poster");
    }
  }

  let season;
  try {
    // a duplicate (anime + seasonNumber) hits your unique index -> error 11000
    season = await Season.create({
      anime: animeId,
      seasonNumber,
      title,
      description,
      releaseDate,
      posterUrl: poster?.secure_url,
    });
  } catch (error) {
    if (poster) await deleteFromCloudinary(poster.public_id);
    throw error;
  }

  return res
    .status(201)
    .json(new ApiResponse(201, season, "Season created successfully"));
});

const updateSeason = asyncHandler(async (req, res) => {
  const { seasonId } = req.params;
  const { seasonNumber, title, description, releaseDate } = req.body;

  const updates = {};
  let season;
  try {
    if (seasonNumber !== undefined) updates.seasonNumber = seasonNumber;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (releaseDate !== undefined) updates.releaseDate = releaseDate;

    if (Object.keys(updates).length === 0 && !req.file) {
      throw new ApiError(400, "Send at least one field or a new poster to update");
    }

    season = await Season.findById(seasonId);
    if (!season) {
      throw new ApiError(404, "Season not found");
    }
  } catch (error) {
    removeTempFile(req.file);
    throw error;
  }

  const oldPosterUrl = season.posterUrl;

  let poster;
  if (req.file?.path) {
    poster = await uploadOnCloudinary(req.file.path);
    if (!poster) {
      throw new ApiError(500, "Failed to upload poster");
    }
    updates.posterUrl = poster.secure_url;
  }

  let updatedSeason;
  try {
    updatedSeason = await Season.findByIdAndUpdate(
      seasonId,
      { $set: updates },
      { new: true, runValidators: true }
    );
  } catch (error) {
    if (poster) await deleteFromCloudinary(poster.public_id);
    throw error;
  }

  if (poster) await deleteImageByUrl(oldPosterUrl);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedSeason, "Season updated successfully"));
});

const deleteSeason = asyncHandler(async (req, res) => {
  const { seasonId } = req.params;

  const hasEpisodes = await Episode.exists({ season: seasonId });
  if (hasEpisodes) {
    throw new ApiError(409, "Season has episodes, delete them first");
  }

  const season = await Season.findByIdAndDelete(seasonId);
  if (!season) {
    throw new ApiError(404, "Season not found");
  }

  await Review.deleteMany({ season: seasonId });
  await deleteImageByUrl(season.posterUrl);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Season deleted successfully"));
});

export { createSeason, updateSeason, deleteSeason };