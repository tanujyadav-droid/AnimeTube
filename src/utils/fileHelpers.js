import fs from "fs";
import { deleteFromCloudinary, getPublicIdFromUrl } from "./cloudinary.js";

// multer saved the file before our code ran; remove it when we reject the request
const removeTempFile = (file) => {
  if (file?.path) fs.unlink(file.path, () => {});
};

const deleteImageByUrl = async (url) => {
  if (!url?.includes("res.cloudinary.com")) return;
  const result = await deleteFromCloudinary(getPublicIdFromUrl(url));
  if (result?.result !== "ok") {
    console.log("Image was not deleted from cloudinary:", url);
  }
};

// form-data sends one value as a string and repeated keys as an array,
// JSON sends an array. [].concat handles all of those.
const parseIds = (value, label) => {
  const ids = [...new Set([].concat(value))];
  if (!ids.every((id) => mongoose.isValidObjectId(id))) {
    throw new ApiError(400, `Invalid ${label} id`);
  }
  return ids;
};

// Mongoose does NOT check that a referenced document exists, so we do
const ensureExist = async (Model, ids, label) => {
  if (ids.length === 0) return;
  const count = await Model.countDocuments({ _id: { $in: ids } });
  if (count !== ids.length) {
    throw new ApiError(400, `One or more ${label} do not exist`);
  }
};

const deleteVideoByUrl = async (url) => {
  if (!url?.includes("res.cloudinary.com")) return;
  const result = await deleteFromCloudinary(getPublicIdFromUrl(url), "video");
  if (result?.result !== "ok") {
    console.log("Video was not deleted from cloudinary:", url);
  }
};

export { removeTempFile, deleteImageByUrl, parseIds, ensureExist, deleteVideoByUrl };