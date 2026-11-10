import { Router } from "express";
import { createAnime, 
         updateAnime, 
         deleteAnime, 
         getAllAnime,
         getAnimeById } 
from "../controllers/anime.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

const animeImages = upload.fields([
  { name: "poster", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

router.route("/")
  .get(getAllAnime)
  .post(verifyJWT, verifyAdmin, animeImages, createAnime);

router.route("/:animeId")
  .get(getAnimeById)
  .patch(verifyJWT, verifyAdmin, animeImages, updateAnime)
  .delete(verifyJWT, verifyAdmin, deleteAnime);

export default router;