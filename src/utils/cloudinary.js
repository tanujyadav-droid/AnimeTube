import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import "dotenv/config";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) return null;

  try {
    // upload the file to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    return response;
  } catch (error) {
    console.log("Error uploading to cloudinary", error);
    return null;
  } finally {
    // runs on success AND failure: remove the temp file from our server
    fs.unlink(localFilePath, () => {});
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Deleted from cloudinary. Public id", publicId)
    return result
  } catch (error) {
    console.log("Error deleting from cloudinary", error);
    return null
  }
}

const getPublicIdFromUrl = (url) => {
  const fileName = url.split("/").pop(); // "abc123xyz.jpg"
  return fileName.split(".")[0];         // "abc123xyz"
};

export { uploadOnCloudinary, deleteFromCloudinary, getPublicIdFromUrl };