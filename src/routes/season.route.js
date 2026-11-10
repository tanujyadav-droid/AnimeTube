import { Router } from "express";
import { createSeason, updateSeason, deleteSeason } from "../controllers/season.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";
import { getEpisodesBySeason } from "../controllers/episode.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, verifyAdmin, upload.single("poster"), createSeason);

router.route("/:seasonId")
  .patch(verifyJWT, verifyAdmin, upload.single("poster"), updateSeason)
  .delete(verifyJWT, verifyAdmin, deleteSeason);

router.route("/:seasonId/episodes").get(getEpisodesBySeason);

export default router;