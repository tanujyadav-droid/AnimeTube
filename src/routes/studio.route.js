import { Router } from "express";
import {
  createStudio,
  getAllStudios,
  getStudioById,
  updateStudio,
  deleteStudio,
} from "../controllers/studio.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/")
  .get(getAllStudios)
  .post(verifyJWT, verifyAdmin, upload.single("logo"), createStudio);

router.route("/:studioId")
  .get(getStudioById)
  .patch(verifyJWT, verifyAdmin, upload.single("logo"), updateStudio)
  .delete(verifyJWT, verifyAdmin, deleteStudio);

export default router;