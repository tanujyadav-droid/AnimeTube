import multer from "multer";
import path from "path";
import { ApiError } from "../utils/ApiError.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./Public/temp");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
    cb(null, `${base}_${uniqueSuffix}${ext}`); // avatar_1699_482.png
  },
});

// only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only image files are allowed"));
  }
};

// episodes need a video AND a thumbnail, so each file is checked by its field name
const episodeFileFilter = (req, file, cb) => {
  const isVideoField = file.fieldname === "video";
  const ok = file.mimetype.startsWith(isVideoField ? "video/" : "image/");
  if (ok) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `${file.fieldname} must be a ${isVideoField ? "video" : "image"} file`));
  }
};

export const uploadEpisodeFiles = multer({
  storage,
  fileFilter: episodeFileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB per file, match your Cloudinary plan's video limit
}).fields([
  { name: "video", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB, in bytes
});