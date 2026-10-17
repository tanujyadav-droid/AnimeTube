import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/users.model.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"

const registerUser = asyncHandler( async (req, res) => {
    const {username, email, password, dateOfBirth, region} = req.body

    //validation
    if (
        [username, email, password, dateOfBirth].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const profilePictureLocalPath = req.files?.profilePicture?.[0]?.path;
    if (!profilePictureLocalPath) {
        throw new ApiError(400, "profilePicture file is required")
    }

    // const profilePicture = await uploadOnCloudinary(profilePictureLocalPath);
    // if (!profilePicture) {
    //     throw new ApiError(400, "Failed to upload profile picture")
    // }

    let profilePicture;
    try {
        profilePicture = await uploadOnCloudinary(profilePictureLocalPath);
        console.log("Uploaded profilePicture");
    } catch (error) {
        console.log("Error uploading profilePicture", error);
        throw new ApiError(500, "Failed to upload ProfilePicture")
    }

    try {
        const user = await User.create({
            username: username.toLowerCase(),
            email,
            password,
            dateOfBirth,
            profilePicture: profilePicture.url,
            region
        })
    
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user")
        }
    
        return res.status(200).json(
            new ApiResponse(200, createdUser, "User registered Successfully")
        )
    } catch (error) { 
        console.log("User Creation is failed", error);
        if(profilePicture){
            await deleteFromCloudinary(profilePicture.public_id)
        }

         throw new ApiError(500, "Something went wrong while registering the user and images were deleted")
    }
})

export {
    registerUser
}