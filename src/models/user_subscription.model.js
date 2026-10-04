import mongoose, { Schema } from "mongoose";

const userSubscriptionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "CANCELLED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

// // a user can have many past subscriptions, but only ONE active at a time
// userSubscriptionSchema.index(
//   { user: 1 },
//   { unique: true, partialFilterExpression: { status: "ACTIVE" } }
// );

export const UserSubscription = mongoose.model(
  "UserSubscription",
  userSubscriptionSchema
);