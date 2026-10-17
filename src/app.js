import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";

const app = express();

// common middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("Public"));
app.use(cookieParser());

//import routes
import healthcheckrouter from "./routes/healthcheck.route.js";
import userRouter from "./routes/user.route.js";

// routes
app.use("/api/v1/healthcheck", healthcheckrouter);
app.use("/api/v1/user", userRouter);

// error handling middleware
app.use(notFound);
app.use(errorHandler);

export { app };
