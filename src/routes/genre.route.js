import { Router } from "express";
import {
  createGenre,
  getAllGenres,
  getGenreById,
  updateGenre,
  deleteGenre,
} from "../controllers/genre.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/")
  .get(getAllGenres)
  .post(verifyJWT, verifyAdmin, createGenre);

router.route("/:genreId")
  .get(getGenreById)
  .patch(verifyJWT, verifyAdmin, updateGenre)
  .delete(verifyJWT, verifyAdmin, deleteGenre);

export default router;