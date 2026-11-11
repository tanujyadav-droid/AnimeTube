import { Router } from "express";
import {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
} from "../controllers/plan.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/")
  .get(getAllPlans)
  .post(verifyJWT, verifyAdmin, createPlan);

router.route("/:planId")
  .get(getPlanById)
  .patch(verifyJWT, verifyAdmin, updatePlan)
  .delete(verifyJWT, verifyAdmin, deletePlan);

export default router;