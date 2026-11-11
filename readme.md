# AnimeTube

A streaming platform for anime (like Crunchyroll), built to learn full-stack
web development. The backend is done, the frontend is next.

## Tech stack
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcrypt for authentication
- Multer + Cloudinary for file uploads

## What's done (backend)
- Register, login, logout, refresh token, change password, profile updates
- Admin APIs to create, update and delete genres, studios, anime, seasons and
  episodes (posters, banners and videos are uploaded to Cloudinary)
- Public APIs to browse anime (with pagination), seasons and episodes
- Ratings: one per user per episode, with averages for an episode, season and anime
- Reviews on an anime, season or episode (only the owner can edit or delete)
- Watch history and unique view counts
- Subscription plans, subscribing and cancelling
- The video link is only given to logged in users with an active subscription

## What's next
- Frontend

## Later
- Payment gateway
- Some anime free and some only for subscribers
- Netflix-style cancelling (keep watching until the plan ends)

## Database design
https://app.eraser.io/workspace/WuKUkJl2DLUQx9p4qDSy?origin=share

## Run it locally
1. Clone the repo and run `npm install`
2. Copy `.env.sample` to `.env` and fill in your own values
3. Run `npm run dev`
4. Import `AnimeTube.postman_collection.json` into Postman to try every endpoint

## Things to know
- Login sets `accessToken` and `refreshToken` as cookies. The access token also
  works as an `Authorization: Bearer <token>` header.
- New users get the role `user`. To use the admin APIs, change the role to
  `admin` in the database by hand.
- `videoUrl` of an episode is hidden everywhere except
  `GET /api/v1/episode/:episodeId/watch`.
- `maxDevices`, `videoQuality` and `downloadAllowed` on a plan are saved but not
  enforced yet.
- For reviews, `:targetType` is `anime`, `season` or `episode`.
- If the frontend runs on a different address than `http://localhost:5173`,
  change `CORS_ORIGIN` in `.env`.

## API endpoints
Base URL: `/api/v1`


### Healthcheck

| Method | Endpoint | Access | What it does |
| --- | --- | --- | --- |
| GET | `/healthcheck` | Public | Health check |

### User

| Method | Endpoint | Access | What it does |
| --- | --- | --- | --- |
| POST | `/user/register` | Public | Register |
| POST | `/user/login` | Public | Login (saves the cookies) |
| POST | `/user/logout` | Login required | Logout |
| POST | `/user/refresh-token` | Public | Refresh access token (uses the refreshToken cookie) |
| POST | `/user/change-password` | Login required | Change password |
| GET | `/user/get-user` | Login required | Get current user |
| PATCH | `/user/update-account` | Login required | Update account details |
| PATCH | `/user/update-profile-picture` | Login required | Update profile picture |

### History

| Method | Endpoint | Access | What it does |
| --- | --- | --- | --- |
| POST | `/history/update-watch-history/:episodeId` | Login required | Update watch history (progress in seconds) |
| GET | `/history/get-watch-history` | Login required | Get my watch history |
| DELETE | `/history/remove-one-entry/:episodeId` | Login required | Remove one entry from history |
| DELETE | `/history/clear-watch-history` | Login required | Clear my watch history |

### Genre

| Method | Endpoint | Access | What it does |
| --- | --- | --- | --- |
| GET | `/genre` | Public | Get all genres |
| POST | `/genre` | Admin only | Create genre |
| GET | `/genre/:genreId` | Public | Get genre by id |
| PATCH | `/genre/:genreId` | Admin only | Update genre |
| DELETE | `/genre/:genreId` | Admin only | Delete genre |

### Studio

| Method | Endpoint | Access | What it does |
| --- | --- | --- | --- |
| GET | `/studio` | Public | Get all studios |
| POST | `/studio` | Admin only | Create studio |
| GET | `/studio/:studioId` | Public | Get studio by id |
| PATCH | `/studio/:studioId` | Admin only | Update studio |
| DELETE | `/studio/:studioId` | Admin only | Delete studio |

### Anime

| Method | Endpoint | Access | What it does |
| --- | --- | --- | --- |
| GET | `/anime` | Public | Get all anime (paginated) |
| POST | `/anime` | Admin only | Create anime |
| GET | `/anime/:animeId` | Public | Get anime by id (with seasons) |
| PATCH | `/anime/:animeId` | Admin only | Update anime |
| DELETE | `/anime/:animeId` | Admin only | Delete anime |

### Season

| Method | Endpoint | Access | What it does |
| --- | --- | --- | --- |
| POST | `/season` | Admin only | Create season |
| PATCH | `/season/:seasonId` | Admin only | Update season |
| DELETE | `/season/:seasonId` | Admin only | Delete season |
| GET | `/season/:seasonId/episodes` | Public | Get episodes of a season |

### Episode

| Method | Endpoint | Access | What it does |
| --- | --- | --- | --- |
| POST | `/episode` | Admin only | Create episode |
| GET | `/episode/:episodeId/watch` | Login + active subscription | Watch episode (returns videoUrl) |
| GET | `/episode/:episodeId` | Public | Get episode by id (no videoUrl) |
| PATCH | `/episode/:episodeId` | Admin only | Update episode |
| DELETE | `/episode/:episodeId` | Admin only | Delete episode |

### Rating

| Method | Endpoint | Access | What it does |
| --- | --- | --- | --- |
| POST | `/rating/rate-episode/:episodeId` | Login required | Rate an episode (1 to 10) |
| GET | `/rating/get-my-rating/:episodeId` | Login required | Get my rating of an episode |
| DELETE | `/rating/remove-rating/:episodeId` | Login required | Remove my rating |
| GET | `/rating/get-episode-rating/:episodeId` | Public | Get average rating of an episode |
| GET | `/rating/get-season-rating/:seasonId` | Public | Get average rating of a season |
| GET | `/rating/get-anime-rating/:animeId` | Public | Get average rating of an anime |

### Review

| Method | Endpoint | Access | What it does |
| --- | --- | --- | --- |
| POST | `/review/add-review/:targetType/:targetId` | Login required | Add review |
| GET | `/review/get-reviews/:targetType/:targetId` | Public | Get reviews |
| PATCH | `/review/edit-review/:reviewId` | Login required | Edit my review |
| DELETE | `/review/delete-review/:reviewId` | Login required | Delete my review |

### Plan

| Method | Endpoint | Access | What it does |
| --- | --- | --- | --- |
| GET | `/plan` | Public | Get all plans |
| POST | `/plan` | Admin only | Create plan |
| GET | `/plan/:planId` | Public | Get plan by id |
| PATCH | `/plan/:planId` | Admin only | Update plan |
| DELETE | `/plan/:planId` | Admin only | Delete plan |

### Subscription

| Method | Endpoint | Access | What it does |
| --- | --- | --- | --- |
| POST | `/subscription/subscribe/:planId` | Login required | Subscribe to a plan |
| GET | `/subscription/my-subscription` | Login required | Get my active subscription |
| PATCH | `/subscription/cancel` | Login required | Cancel my subscription |
