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
// Express 5 leaves req.body undefined when there is no body; make it an empty object
app.use((req, _res, next) => {
  req.body ??= {};
  next();
});
app.use(express.static("Public"));
app.use(cookieParser());

//import routes
import healthcheckrouter from "./routes/healthcheck.route.js";
import userRouter from "./routes/user.route.js";
import historyRouter from "./routes/watch_history.route.js";
import genreRouter from "./routes/genre.route.js";
import studioRouter from "./routes/studio.route.js";
import animeRouter from "./routes/anime.route.js";
import seasonRouter from "./routes/season.route.js";
import episodeRouter from "./routes/episode.route.js";
import ratingRouter from "./routes/rating.route.js";

// routes
app.use("/api/v1/healthcheck", healthcheckrouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/history", historyRouter);
app.use("/api/v1/genre", genreRouter);
app.use("/api/v1/studio", studioRouter);
app.use("/api/v1/anime", animeRouter);
app.use("/api/v1/season", seasonRouter);
app.use("/api/v1/episode", episodeRouter);
app.use("/api/v1/rating", ratingRouter);

// error handling middleware
app.use(notFound);
app.use(errorHandler);

export { app };
