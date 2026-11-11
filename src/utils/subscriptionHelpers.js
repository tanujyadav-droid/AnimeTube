import { UserSubscription } from "../models/user_subscription.model.js";

// A subscription can still say ACTIVE in the database after its endDate has
// passed, because nothing runs by itself when a date passes. So whenever we
// look for someone's active subscription, we first mark the stale ones EXPIRED.
const getActiveSubscription = async (userId) => {
  await UserSubscription.updateMany(
    { user: userId, status: "ACTIVE", endDate: { $lte: new Date() } },
    { $set: { status: "EXPIRED" } }
  );

  return UserSubscription.findOne({ user: userId, status: "ACTIVE" });
};

// Cheaper check for the playback gate: one read, no write. A stale ACTIVE row
// (endDate already passed) just doesn't match, so it doesn't count.
const hasActiveSubscription = async (userId) =>
  UserSubscription.exists({
    user: userId,
    status: "ACTIVE",
    endDate: { $gt: new Date() },
  });

export { getActiveSubscription, hasActiveSubscription };