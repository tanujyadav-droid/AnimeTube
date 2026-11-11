import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { hasActiveSubscription } from "../utils/subscriptionHelpers.js";

// must run AFTER verifyJWT, because it needs req.user
export const checkSubscription = asyncHandler(async (req, _res, next) => {
  if (!(await hasActiveSubscription(req.user._id))) {
    throw new ApiError(403, "An active subscription is required to watch this");
  }
  next();
});