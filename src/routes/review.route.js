import { Router } from "express";
import {
  addReview,
  getReviews,
  editReview,
  deleteReview,
} from "../controllers/review.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// targetType is "anime", "season" or "episode"
router.route("/add-review/:targetType/:targetId").post(verifyJWT, addReview);
router.route("/get-reviews/:targetType/:targetId").get(getReviews);

router.route("/edit-review/:reviewId").patch(verifyJWT, editReview);
router.route("/delete-review/:reviewId").delete(verifyJWT, deleteReview);

export default router;