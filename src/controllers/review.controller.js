import { Review } from "../models/review.model.js";
import { Anime } from "../models/anime.model.js";
import { Season } from "../models/seasons.model.js";
import { Episode } from "../models/episodes.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// the URL says which kind of thing is being reviewed, this maps it to a model
const TARGET_MODELS = {
  anime: Anime,
  season: Season,
  episode: Episode,
};

// returns the model for "anime" / "season" / "episode", or throws a 400
const getTargetModel = (targetType) => {
  // Object.hasOwn so that a type like "constructor" is not accepted
  if (!Object.hasOwn(TARGET_MODELS, targetType)) {
    throw new ApiError(400, "Reviews can only be for anime, season or episode");
  }
  return TARGET_MODELS[targetType];
};

const addReview = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.params;
  const content = req.body?.content;

  const TargetModel = getTargetModel(targetType);

  if (typeof content !== "string" || !content.trim()) {
    throw new ApiError(400, "Review content is required");
  }

  if (!(await TargetModel.exists({ _id: targetId }))) {
    throw new ApiError(404, `${targetType} not found`);
  }

  // [targetType] becomes the key "anime", "season" or "episode"
  const review = await Review.create({
    user: req.user._id,
    [targetType]: targetId,
    content,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, review, "Review added successfully"));
});

const getReviews = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.params;

  const TargetModel = getTargetModel(targetType);

  if (!(await TargetModel.exists({ _id: targetId }))) {
    throw new ApiError(404, `${targetType} not found`);
  }

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

  const filter = { [targetType]: targetId };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .select("user content isEdited createdAt updatedAt")
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
      "Reviews fetched successfully"
    )
  );
});

const editReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const content = req.body?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new ApiError(400, "Review content is required");
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // authorization: logged in is not enough, it has to be THEIR review
  if (!review.user.equals(req.user._id)) {
    throw new ApiError(403, "You can only edit your own review");
  }

  review.content = content;
  review.isEdited = true;
  await review.save();

  return res
    .status(200)
    .json(new ApiResponse(200, review, "Review updated successfully"));
});

const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  if (!review.user.equals(req.user._id)) {
    throw new ApiError(403, "You can only delete your own review");
  }

  await review.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Review deleted successfully"));
});

export { addReview, getReviews, editReview, deleteReview };