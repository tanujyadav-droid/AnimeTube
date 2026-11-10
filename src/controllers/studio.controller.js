import { Studio } from "../models/studios.model.js";
import { Anime } from "../models/anime.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { deleteImageByUrl } from "../utils/fileHelpers.js";

const createStudio = asyncHandler(async (req, res) => {
  const { name, description, country, websiteUrl } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Studio name is required");
  }

  let logo;
  if (req.file?.path) {
    logo = await uploadOnCloudinary(req.file.path);
    if (!logo) {
      throw new ApiError(500, "Failed to upload logo");
    }
  }

  let studio;
  try {
    studio = await Studio.create({
      name,
      description,
      country,
      websiteUrl,
      logoUrl: logo?.secure_url,
    });
  } catch (error) {
    if (logo) await deleteFromCloudinary(logo.public_id);
    throw error;
  }

  return res
    .status(201)
    .json(new ApiResponse(201, studio, "Studio created successfully"));
});

const getAllStudios = asyncHandler(async (req, res) => {
  const studios = await Studio.find().sort({ name: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, studios, "Studios fetched successfully"));
});

const getStudioById = asyncHandler(async (req, res) => {
  const studio = await Studio.findById(req.params.studioId);

  if (!studio) {
    throw new ApiError(404, "Studio not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, studio, "Studio fetched successfully"));
});

const updateStudio = asyncHandler(async (req, res) => {
  const { studioId } = req.params;
  const { name, description, country, websiteUrl } = req.body;

  const updates = {};
  if (name !== undefined) {
    if (!name.trim()) throw new ApiError(400, "Studio name cannot be empty");
    updates.name = name;
  }
  if (description !== undefined) updates.description = description;
  if (country !== undefined) updates.country = country;
  if (websiteUrl !== undefined) updates.websiteUrl = websiteUrl;

  if (Object.keys(updates).length === 0 && !req.file) {
    throw new ApiError(400, "Send at least one field or a new logo to update");
  }

  const studio = await Studio.findById(studioId);
  if (!studio) {
    throw new ApiError(404, "Studio not found");
  }

  const oldLogoUrl = studio.logoUrl;

  let logo;
  if (req.file?.path) {
    logo = await uploadOnCloudinary(req.file.path);
    if (!logo) {
      throw new ApiError(500, "Failed to upload logo");
    }
    updates.logoUrl = logo.secure_url;
  }

  let updatedStudio;
  try {
    updatedStudio = await Studio.findByIdAndUpdate(
      studioId,
      { $set: updates },
      { new: true, runValidators: true }
    );
  } catch (error) {
    if (logo) await deleteFromCloudinary(logo.public_id);
    throw error;
  }

  if (logo) await deleteImageByUrl(oldLogoUrl);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedStudio, "Studio updated successfully"));
});

const deleteStudio = asyncHandler(async (req, res) => {
  const { studioId } = req.params;

  const inUse = await Anime.exists({ studios: studioId });
  if (inUse) {
    throw new ApiError(
      409,
      "Studio is used by some anime, remove it from them first"
    );
  }

  const studio = await Studio.findByIdAndDelete(studioId);
  if (!studio) {
    throw new ApiError(404, "Studio not found");
  }

  await deleteImageByUrl(studio.logoUrl);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Studio deleted successfully"));
});

export {
  createStudio,
  getAllStudios,
  getStudioById,
  updateStudio,
  deleteStudio,
};
