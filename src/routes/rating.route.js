import { Router } from "express";
import {
  rateEpisode,
  getMyRating,
  removeRating,
  getEpisodeRating,
  getSeasonRating,
  getAnimeRating,
} from "../controllers/rating.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// logged-in user's own rating
router.route("/rate-episode/:episodeId").post(verifyJWT, rateEpisode);
router.route("/get-my-rating/:episodeId").get(verifyJWT, getMyRating);
router.route("/remove-rating/:episodeId").delete(verifyJWT, removeRating);

// public averages
router.route("/get-episode-rating/:episodeId").get(getEpisodeRating);
router.route("/get-season-rating/:seasonId").get(getSeasonRating);
router.route("/get-anime-rating/:animeId").get(getAnimeRating);

export default router;