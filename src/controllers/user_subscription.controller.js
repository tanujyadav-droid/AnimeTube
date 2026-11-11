import { Subscription } from "../models/subscription.model.js";
import { UserSubscription } from "../models/user_subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getActiveSubscription } from "../utils/subscriptionHelpers.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const subscribe = asyncHandler(async (req, res) => {
  const { planId } = req.params;

  const plan = await Subscription.findById(planId);
  if (!plan) {
    throw new ApiError(404, "Plan not found");
  }

  // only one active subscription at a time (the model's partial unique index
  // also enforces this if two requests arrive at the same moment)
  if (await getActiveSubscription(req.user._id)) {
    throw new ApiError(409, "You already have an active subscription, cancel it first");
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + plan.duration * DAY_IN_MS);

  const subscription = await UserSubscription.create({
    user: req.user._id,
    plan: plan._id,
    startDate,
    endDate,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, subscription, "Subscribed successfully"));
});

const getMySubscription = asyncHandler(async (req, res) => {
  const subscription = await getActiveSubscription(req.user._id);

  if (!subscription) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "You have no active subscription"));
  }

  await subscription.populate("plan");

  return res
    .status(200)
    .json(new ApiResponse(200, subscription, "Subscription fetched successfully"));
});

const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await getActiveSubscription(req.user._id);

  if (!subscription) {
    throw new ApiError(404, "You have no active subscription");
  }

  subscription.status = "CANCELLED";
  await subscription.save();

  return res
    .status(200)
    .json(new ApiResponse(200, subscription, "Subscription cancelled successfully"));
});

export { subscribe, getMySubscription, cancelSubscription };