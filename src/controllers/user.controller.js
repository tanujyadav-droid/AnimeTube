import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/users.model.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"

const registerUser = asyncHandler( async (req, res) => {
    const {username, email, password, dateOfBirth, region} = req.body

    //validation
    if (
        [username, email, password, dateOfBirth].some((field) => !field?.trim())
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

    const profilePicture = await uploadOnCloudinary(profilePictureLocalPath);
    if (!profilePicture) {
        throw new ApiError(500, "Failed to upload ProfilePicture")
    }
    console.log("Uploaded profilePicture");

    try {
        const user = await User.create({
            username: username.toLowerCase(),
            email,
            password,
            dateOfBirth,
            profilePicture: profilePicture.secure_url,
            region
        })
    
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user")
        }
    
        return res.status(201).json(
            new ApiResponse(201, createdUser, "User registered Successfully")
        )
    } catch (error) { 
        console.log("User Creation is failed", error);
        await deleteFromCloudinary(profilePicture.public_id)

        // rethrow the ORIGINAL error so the error middleware picks the right status code
        throw error
    }
})

export {
    registerUser
}