import { Subscription } from "../models/subscription.model.js";
import { UserSubscription } from "../models/user_subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const PLAN_FIELDS = [
  "planName",
  "price",
  "duration",
  "maxDevices",
  "videoQuality",
  "downloadAllowed",
];

const createPlan = asyncHandler(async (req, res) => {
  const { planName, price, duration, maxDevices, videoQuality, downloadAllowed } = req.body;

  // missing or invalid fields are rejected by the schema (400),
  // and a repeated planName by the unique index (409)
  const plan = await Subscription.create({
    planName,
    price,
    duration,
    maxDevices,
    videoQuality,
    downloadAllowed,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, plan, "Plan created successfully"));
});

const getAllPlans = asyncHandler(async (req, res) => {
  const plans = await Subscription.find().sort({ price: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, plans, "Plans fetched successfully"));
});

const getPlanById = asyncHandler(async (req, res) => {
  const plan = await Subscription.findById(req.params.planId);

  if (!plan) {
    throw new ApiError(404, "Plan not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, plan, "Plan fetched successfully"));
});

const updatePlan = asyncHandler(async (req, res) => {
  const updates = {};
  for (const field of PLAN_FIELDS) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "Send at least one field to update");
  }

  const plan = await Subscription.findByIdAndUpdate(
    req.params.planId,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!plan) {
    throw new ApiError(404, "Plan not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, plan, "Plan updated successfully"));
});

const deletePlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;

  const inUse = await UserSubscription.exists({ plan: planId });
  if (inUse) {
    throw new ApiError(409, "Users have subscribed to this plan, it cannot be deleted");
  }

  const plan = await Subscription.findByIdAndDelete(planId);
  if (!plan) {
    throw new ApiError(404, "Plan not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Plan deleted successfully"));
});

export { createPlan, getAllPlans, getPlanById, updatePlan, deletePlan };