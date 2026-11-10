import mongoose from "mongoose";
import { Episode } from "../models/episodes.model.js";
import { Season } from "../models/seasons.model.js";
import { WatchHistory } from "../models/watch_history.model.js";
import { Rating } from "../models/rating.model.js";
import { Review } from "../models/review.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { deleteImageByUrl, deleteVideoByUrl } from "../utils/fileHelpers.js";

const createEpisode = asyncHandler(async (req, res) => {
  const { seasonId, episodeNumber, title, description, releaseDate } = req.body;
  const videoLocalPath = req.files?.video?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!mongoose.isObjectIdOrHexString(seasonId)) {
    throw new ApiError(400, "A valid seasonId is required");
  }
  if (episodeNumber === undefined || episodeNumber === "") {
    throw new ApiError(400, "episodeNumber is required");
  }
  if (!title?.trim()) {
    throw new ApiError(400, "Episode title is required");
  }
  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Both video and thumbnail files are required");
  }
  if (!(await Season.exists({ _id: seasonId }))) {
    throw new ApiError(404, "Season not found");
  }

  // check for a duplicate BEFORE the slow upload, not after
  if (await Episode.exists({ season: seasonId, episodeNumber })) {
    throw new ApiError(409, "This season already has that episode number");
  }

  const [video, thumbnail] = await Promise.all([
    uploadOnCloudinary(videoLocalPath),
    uploadOnCloudinary(thumbnailLocalPath),
  ]);

  if (!video || !thumbnail) {
    if (video) await deleteFromCloudinary(video.public_id, "video");
    if (thumbnail) await deleteFromCloudinary(thumbnail.public_id);
    throw new ApiError(500, "Failed to upload episode files");
  }

  let episode;
  try {
    episode = await Episode.create({
      season: seasonId,
      episodeNumber,
      title,
      description,
      releaseDate,
      videoUrl: video.secure_url,
      thumbnailUrl: thumbnail.secure_url,
      duration: Math.round(video.duration), // Cloudinary measures it, we don't trust the client
    });
  } catch (error) {
    await deleteFromCloudinary(video.public_id, "video");
    await deleteFromCloudinary(thumbnail.public_id);
    throw error;
  }

  return res
    .status(201)
    .json(new ApiResponse(201, episode, "Episode created successfully"));
});

const updateEpisode = asyncHandler(async (req, res) => {
  const { episodeId } = req.params;
  const { episodeNumber, title, description, releaseDate } = req.body;
  const videoLocalPath = req.files?.video?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  const updates = {};
  if (episodeNumber !== undefined) updates.episodeNumber = episodeNumber;
  if (title !== undefined) {
    if (!title.trim()) throw new ApiError(400, "Episode title cannot be empty");
    updates.title = title;
  }
  if (description !== undefined) updates.description = description;
  if (releaseDate !== undefined) updates.releaseDate = releaseDate;

  if (Object.keys(updates).length === 0 && !videoLocalPath && !thumbnailLocalPath) {
    throw new ApiError(400, "Send at least one field or file to update");
  }

  const episode = await Episode.findById(episodeId).select("+videoUrl");
  if (!episode) {
    throw new ApiError(404, "Episode not found");
  }

  const oldVideoUrl = episode.videoUrl;
  const oldThumbnailUrl = episode.thumbnailUrl;

  const [video, thumbnail] = await Promise.all([
    uploadOnCloudinary(videoLocalPath),
    uploadOnCloudinary(thumbnailLocalPath),
  ]);

  // null can mean "no file sent" OR "upload failed", so check against the path
  if ((videoLocalPath && !video) || (thumbnailLocalPath && !thumbnail)) {
    if (video) await deleteFromCloudinary(video.public_id, "video");
    if (thumbnail) await deleteFromCloudinary(thumbnail.public_id);
    throw new ApiError(500, "Failed to upload episode files");
  }

  if (video) {
    updates.videoUrl = video.secure_url;
    updates.duration = Math.round(video.duration);
  }
  if (thumbnail) updates.thumbnailUrl = thumbnail.secure_url;

  let updatedEpisode;
  try {
    updatedEpisode = await Episode.findByIdAndUpdate(
      episodeId,
      { $set: updates },
      { new: true, runValidators: true }
    );
  } catch (error) {
    if (video) await deleteFromCloudinary(video.public_id, "video");
    if (thumbnail) await deleteFromCloudinary(thumbnail.public_id);
    throw error;
  }

  if (video) await deleteVideoByUrl(oldVideoUrl);
  if (thumbnail) await deleteImageByUrl(oldThumbnailUrl);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedEpisode, "Episode updated successfully"));
});

const deleteEpisode = asyncHandler(async (req, res) => {
  const { episodeId } = req.params;

  const episode = await Episode.findByIdAndDelete(episodeId).select("+videoUrl");
  if (!episode) {
    throw new ApiError(404, "Episode not found");
  }

  // user data about this episode means nothing without it
  await Promise.all([
    WatchHistory.deleteMany({ episode: episodeId }),
    Rating.deleteMany({ episode: episodeId }),
    Review.deleteMany({ episode: episodeId }),
  ]);

  await deleteVideoByUrl(episode.videoUrl);
  await deleteImageByUrl(episode.thumbnailUrl);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Episode deleted successfully"));
});

const getEpisodesBySeason = asyncHandler(async (req, res) => {
  const { seasonId } = req.params;

  if (!(await Season.exists({ _id: seasonId }))) {
    throw new ApiError(404, "Season not found");
  }

  const episodes = await Episode.find({ season: seasonId })
    .select("episodeNumber title description duration thumbnailUrl releaseDate views")
    .sort({ episodeNumber: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, episodes, "Episodes fetched successfully"));
});

const getEpisodeById = asyncHandler(async (req, res) => {
  const { episodeId } = req.params;

  // videoUrl is not here: it is select:false in the schema
  const episode = await Episode.findById(episodeId).populate(
    "season",
    "anime seasonNumber title"
  );
  if (!episode) {
    throw new ApiError(404, "Episode not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, episode, "Episode fetched successfully"));
});

export { createEpisode, updateEpisode, deleteEpisode, getEpisodesBySeason, getEpisodeById };