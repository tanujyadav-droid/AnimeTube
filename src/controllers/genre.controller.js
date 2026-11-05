import { Genre } from "../models/genre.model.js";
import { Anime } from "../models/anime.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createGenre = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Genre name is required");
  }

  const genre = await Genre.create({ name, description });

  return res
    .status(201)
    .json(new ApiResponse(201, genre, "Genre created successfully"));
});

const getAllGenres = asyncHandler(async (req, res) => {
  const genres = await Genre.find().sort({ name: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, genres, "Genres fetched successfully"));
});

const getGenreById = asyncHandler(async (req, res) => {
  const genre = await Genre.findById(req.params.genreId);

  if (!genre) {
    throw new ApiError(404, "Genre not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, genre, "Genre fetched successfully"));
});

const updateGenre = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const updates = {};
  if (name !== undefined) {
    if (!name.trim()) throw new ApiError(400, "Genre name cannot be empty");
    updates.name = name;
  }
  if (description !== undefined) updates.description = description;

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "Send at least one field to update");
  }

  const genre = await Genre.findByIdAndUpdate(
    req.params.genreId,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!genre) {
    throw new ApiError(404, "Genre not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, genre, "Genre updated successfully"));
});

const deleteGenre = asyncHandler(async (req, res) => {
  const { genreId } = req.params;

  const inUse = await Anime.exists({ genres: genreId });
  if (inUse) {
    throw new ApiError(409, "Genre is used by some anime, remove it from them first");
  }

  const genre = await Genre.findByIdAndDelete(genreId);
  if (!genre) {
    throw new ApiError(404, "Genre not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Genre deleted successfully"));
});

export { createGenre, getAllGenres, getGenreById, updateGenre, deleteGenre };