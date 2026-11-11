import { Router } from "express";
import { createEpisode, updateEpisode, deleteEpisode, getEpisodeById, getEpisodePlayback } from "../controllers/episode.controller.js";
import { checkSubscription } from "../middlewares/subscription.middleware.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";
import { uploadEpisodeFiles } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, verifyAdmin, uploadEpisodeFiles, createEpisode);

router.route("/:episodeId/watch").get(verifyJWT, checkSubscription, getEpisodePlayback);

router.route("/:episodeId")
  .get(getEpisodeById)
  .patch(verifyJWT, verifyAdmin, uploadEpisodeFiles, updateEpisode)
  .delete(verifyJWT, verifyAdmin, deleteEpisode);

export default router;