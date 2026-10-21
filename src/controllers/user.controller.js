import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/users.model.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User does not exist")
        }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

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

const loginUser = asyncHandler(async (req, res) =>{

    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    if (!loggedInUser) {
        throw new ApiError(500, "Something went wrong while logging in the user")
    }

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

export {
    registerUser,
    loginUser
}