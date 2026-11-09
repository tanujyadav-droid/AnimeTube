import { Router } from "express";
import { createEpisode, updateEpisode, deleteEpisode } from "../controllers/episode.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";
import { uploadEpisodeFiles } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, verifyAdmin, uploadEpisodeFiles, createEpisode);

router.route("/:episodeId")
  .patch(verifyJWT, verifyAdmin, uploadEpisodeFiles, updateEpisode)
  .delete(verifyJWT, verifyAdmin, deleteEpisode);

export default router;