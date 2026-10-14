# AnimeTube

A streaming platform for anime (like Crunchyroll), built to learn full-stack
web development. Currently working on the backend.

## Tech stack
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcrypt for authentication
- Multer + Cloudinary for file uploads

## What's done
- Project setup and database connection
- All the database models (users, anime, seasons, episodes, genres,
  studios, ratings, reviews, watch history, subscriptions)
- Health check endpoint
- File upload middleware

## What's next
- User register / login / logout
- Anime, season and episode APIs
- Frontend

## Database design
https://app.eraser.io/workspace/WuKUkJl2DLUQx9p4qDSy?origin=share

## Run it locally
1. Clone the repo and run `npm install`
2. Copy `.env.sample` to `.env` and fill in your own values
3. Run `npm run dev`