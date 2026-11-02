import { Router } from "express";
import {
    updateWatchHistory,
    getWatchHistory,
    removeOneEntry,
    clearWatchHistory
} from "../controllers/watch_history.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/update-watch-history/:episodeId").post(verifyJWT, updateWatchHistory)
router.route("/get-watch-history").get(verifyJWT, getWatchHistory)
router.route("/remove-one-entry/:episodeId").delete(verifyJWT, removeOneEntry)
router.route("/clear-watch-history").delete(verifyJWT, clearWatchHistory)

export default router
