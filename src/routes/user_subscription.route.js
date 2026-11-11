import { Router } from "express";
import {
  subscribe,
  getMySubscription,
  cancelSubscription,
} from "../controllers/user_subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/subscribe/:planId").post(verifyJWT, subscribe);
router.route("/my-subscription").get(verifyJWT, getMySubscription);
router.route("/cancel").patch(verifyJWT, cancelSubscription);

export default router;