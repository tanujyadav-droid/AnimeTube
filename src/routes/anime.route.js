import { Router } from "express";
import { createAnime, updateAnime, deleteAnime } from "../controllers/anime.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

const animeImages = upload.fields([
  { name: "poster", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

router.route("/").post(verifyJWT, verifyAdmin, animeImages, createAnime);

router.route("/:animeId")
  .patch(verifyJWT, verifyAdmin, animeImages, updateAnime)
  .delete(verifyJWT, verifyAdmin, deleteAnime);

export default router;