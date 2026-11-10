import { Anime } from "../models/anime.model.js";
import { Genre } from "../models/genre.model.js";
import { Studio } from "../models/studios.model.js";
import { Season } from "../models/seasons.model.js";
import { Review } from "../models/review.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { deleteImageByUrl,
         ensureExist,
         parseIds
 } from "../utils/fileHelpers.js";

// ---------- controllers ----------

const createAnime = asyncHandler(async (req, res) => {
  const { title, description, releaseDate, status, ageRating, trailerUrl, genres, studios } = req.body;
  const posterLocalPath = req.files?.poster?.[0]?.path;
  const bannerLocalPath = req.files?.banner?.[0]?.path;

  if (!title?.trim()) {
    throw new ApiError(400, "Anime title is required");
  }

  let genreIds, studioIds;
  if (genres !== undefined) {
    genreIds = parseIds(genres, "genre");
    await ensureExist(Genre, genreIds, "genres");
  }
  if (studios !== undefined) {
    studioIds = parseIds(studios, "studio");
    await ensureExist(Studio, studioIds, "studios");
  }

  // both uploads run at the same time; each one deletes its own temp file
  const [poster, banner] = await Promise.all([
    uploadOnCloudinary(posterLocalPath),
    uploadOnCloudinary(bannerLocalPath),
  ]);

  // null can mean "no file sent" OR "upload failed", so check against the path
  if ((posterLocalPath && !poster) || (bannerLocalPath && !banner)) {
    if (poster) await deleteFromCloudinary(poster.public_id);
    if (banner) await deleteFromCloudinary(banner.public_id);
    throw new ApiError(500, "Failed to upload images");
  }

  let anime;
  try {
    anime = await Anime.create({
      title,
      description,
      releaseDate,
      status,
      ageRating,
      trailerUrl,
      genres: genreIds,
      studios: studioIds,
      posterUrl: poster?.secure_url,
      bannerUrl: banner?.secure_url,
    });
  } catch (error) {
    if (poster) await deleteFromCloudinary(poster.public_id);
    if (banner) await deleteFromCloudinary(banner.public_id);
    throw error;
  }

  return res
    .status(201)
    .json(new ApiResponse(201, anime, "Anime created successfully"));
});

const updateAnime = asyncHandler(async (req, res) => {
  const { animeId } = req.params;
  const { title, description, releaseDate, status, ageRating, trailerUrl, genres, studios } = req.body;
  const posterLocalPath = req.files?.poster?.[0]?.path;
  const bannerLocalPath = req.files?.banner?.[0]?.path;

  const updates = {};
  if (title !== undefined) {
    if (!title.trim()) throw new ApiError(400, "Anime title cannot be empty");
    updates.title = title;
  }
  if (description !== undefined) updates.description = description;
  if (releaseDate !== undefined) updates.releaseDate = releaseDate;
  if (status !== undefined) updates.status = status;
  if (ageRating !== undefined) updates.ageRating = ageRating;
  if (trailerUrl !== undefined) updates.trailerUrl = trailerUrl;

  if (genres !== undefined) {
    const ids = parseIds(genres, "genre");
    await ensureExist(Genre, ids, "genres");
    updates.genres = ids;
  }
  if (studios !== undefined) {
    const ids = parseIds(studios, "studio");
    await ensureExist(Studio, ids, "studios");
    updates.studios = ids;
  }

  if (Object.keys(updates).length === 0 && !posterLocalPath && !bannerLocalPath) {
    throw new ApiError(400, "Send at least one field or image to update");
  }

  const anime = await Anime.findById(animeId);
  if (!anime) {
    throw new ApiError(404, "Anime not found");
  }

  // grab the old URLs BEFORE the DB overwrites them
  const oldPosterUrl = anime.posterUrl;
  const oldBannerUrl = anime.bannerUrl;

  const [poster, banner] = await Promise.all([
    uploadOnCloudinary(posterLocalPath),
    uploadOnCloudinary(bannerLocalPath),
  ]);

  if ((posterLocalPath && !poster) || (bannerLocalPath && !banner)) {
    if (poster) await deleteFromCloudinary(poster.public_id);
    if (banner) await deleteFromCloudinary(banner.public_id);
    throw new ApiError(500, "Failed to upload images");
  }

  if (poster) updates.posterUrl = poster.secure_url;
  if (banner) updates.bannerUrl = banner.secure_url;

  let updatedAnime;
  try {
    updatedAnime = await Anime.findByIdAndUpdate(
      animeId,
      { $set: updates },
      { new: true, runValidators: true }
    );
  } catch (error) {
    // DB failed, so the NEW images are the orphans
    if (poster) await deleteFromCloudinary(poster.public_id);
    if (banner) await deleteFromCloudinary(banner.public_id);
    throw error;
  }

  // DB succeeded, so now it's safe to remove the replaced images
  if (poster) await deleteImageByUrl(oldPosterUrl);
  if (banner) await deleteImageByUrl(oldBannerUrl);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedAnime, "Anime updated successfully"));
});

const deleteAnime = asyncHandler(async (req, res) => {
  const { animeId } = req.params;

  // don't orphan seasons (and through them, episodes)
  const hasSeasons = await Season.exists({ anime: animeId });
  if (hasSeasons) {
    throw new ApiError(409, "Anime has seasons, delete them first");
  }

  const anime = await Anime.findByIdAndDelete(animeId);
  if (!anime) {
    throw new ApiError(404, "Anime not found");
  }

  // reviews written on this anime mean nothing without it
  await Review.deleteMany({ anime: animeId });

  await deleteImageByUrl(anime.posterUrl);
  await deleteImageByUrl(anime.bannerUrl);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Anime deleted successfully"));
});

const getAllAnime = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const [animeList, total] = await Promise.all([
    Anime.find()
      .select("title posterUrl status ageRating releaseDate views genres studios")
      .populate("genres", "name")
      .populate("studios", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Anime.countDocuments(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        anime: animeList,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
      "Anime fetched successfully"
    )
  );
});

const getAnimeById = asyncHandler(async (req, res) => {
  const { animeId } = req.params;

  const [anime, seasons] = await Promise.all([
    Anime.findById(animeId)
      .populate("genres", "name")
      .populate("studios", "name logoUrl"),
    Season.find({ anime: animeId })
      .select("seasonNumber title description posterUrl releaseDate views")
      .sort({ seasonNumber: 1 }),
  ]);

  if (!anime) {
    throw new ApiError(404, "Anime not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { anime, seasons }, "Anime fetched successfully"));
});

export { createAnime, updateAnime, deleteAnime, getAllAnime, getAnimeById };