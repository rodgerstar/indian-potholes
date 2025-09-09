# Backend API Documentation

This document lists all available API endpoints for the backend, their expected inputs, and responses.

---

## Table of Contents
- [Supported File Formats](#supported-file-formats)
- [Auth Endpoints](#auth-endpoints)
- [Pothole Endpoints](#pothole-endpoints)
- [Bug Report Endpoints](#bug-report-endpoints)
- [Feedback Endpoints](#feedback-endpoints)
- [Constituency Endpoints](#constituency-endpoints)
- [Notification Endpoints](#notification-endpoints)
- [Admin Endpoints](#admin-endpoints)

---

## Supported File Formats

The backend supports the following file formats for media uploads:

### Image Formats
- **JPEG** (`.jpg`, `.jpeg`) - Joint Photographic Experts Group
- **PNG** (`.png`) - Portable Network Graphics
- **GIF** (`.gif`) - Graphics Interchange Format
- **WebP** (`.webp`) - Web Picture format
- **HEIC** (`.heic`) - High Efficiency Image Container
- **HEIF** (`.heif`) - High Efficiency Image Format

### Video Formats
- **MP4** (`.mp4`) - MPEG-4 Part 14
- **AVI** (`.avi`) - Audio Video Interleave
- **MOV** (`.mov`) - QuickTime Movie
- **WebM** (`.webm`) - Web Media
- **HEVC** (`.hevc`) - High Efficiency Video Coding

### File Upload Requirements
- **Maximum file size**: 50MB per file
- **Maximum files per upload**: 5 files
- **File validation**: All files are validated for content integrity and file signatures
- **Security**: Dangerous file extensions are blocked for security

---

## Auth Endpoints

### Register
- **POST** `/api/auth/register`
- **Description:** Register a new user
- **Auth:** None
- **Body:**
  - `name` (string, 2-100 chars, required)
  - `email` (string, valid email, required)
  - `password` (string, min 8 chars, must contain upper, lower, number, special char)
- **Response:**
  - `201 Created` on success, returns user info and token
  - `400` on validation error or if user exists

### Login
- **POST** `/api/auth/login`
- **Description:** Login user
- **Auth:** None
- **Body:**
  - `email` (string, required)
  - `password` (string, required)
- **Response:**
  - `200 OK` with user info and token
  - `400` on invalid credentials

### Get Current User
- **GET** `/api/auth/me`
- **Description:** Get current user info
- **Auth:** Bearer token required
- **Response:**
  - `200 OK` with user info

### Update Profile
- **PUT** `/api/auth/profile`
- **Description:** Update user profile
- **Auth:** Bearer token required
- **Body:**
  - `name` (string, optional)
  - `email` (string, optional)
- **Response:**
  - `200 OK` with updated user info

---

## Pothole Endpoints

### Create Pothole Report
- **POST** `/api/potholes`
- **Description:** Create a new pothole report
- **Auth:** Optional (guests allowed, but must provide `recaptchaToken`)
- **Body:**
  - `locationName` (string, 3-200 chars, required)
  - `latitude` (float, -90 to 90, required)
  - `longitude` (float, -180 to 180, required)
  - `state` (string, required)

### Create Pothole Report (Guest - No reCAPTCHA)
- **POST** `/api/potholes/guest`
- **Description:** Create a new pothole report for guests without reCAPTCHA verification
- **Auth:** None required
- **Body:** (multipart/form-data)
  - `locationName` (string, 3-200 chars, required)
  - `latitude` (float, -90 to 90, required)
  - `longitude` (float, -180 to 180, required)
  - `state` (string, optional)
  - `constituency` (string, optional)
  - `parliamentaryConstituency` (string, optional)
  - `contractor` (string, optional)
  - `engineer` (string, optional)
  - `corporator` (string, optional)
  - `mla` (string, optional)
  - `mp` (string, optional)
  - `severity` (one of: low, medium, high, critical, required)
  - `description` (string, 0-500 chars, optional)
  - `isAnonymous` (boolean, optional)
  - `guestEmail` (string, valid email, optional)
  - `media` (files, at least 1 required, max 5 files)
  - **Files:** At least one photo or video required
- **Response:**
  - `201 Created` with pothole data
  - `400` on validation or recaptcha error

### Get All Potholes
- **GET** `/api/potholes`
- **Description:** List potholes (with pagination, filtering)
- **Auth:** Optional
- **Query:**
  - `page`, `limit`, `sortBy`, `order`, `status`, `city`
- **Response:**
  - `200 OK` with list and pagination

### Get My Reports
- **GET** `/api/potholes/my-reports`
- **Description:** Get current user's pothole reports
- **Auth:** Bearer token required
- **Query:**
  - `page`, `limit`, `sortBy`, `order`, `status`, `search`
- **Response:**
  - `200 OK` with list and pagination

### Get Pothole Stats
- **GET** `/api/potholes/stats`
- **Description:** Get statistics
- **Auth:** None
- **Response:**
  - `200 OK` with stats

### Upvote Pothole
- **PUT** `/api/potholes/:id/upvote`
- **Description:** Upvote or remove upvote
- **Auth:** Bearer token required
- **Response:**
  - `200 OK` with updated upvote count

---

## Bug Report Endpoints

### Submit Bug Report
- **POST** `/api/bug-reports`
- **Description:** Submit a bug report
- **Auth:** Bearer token required
- **Body:**
  - `title` (string, 3-200 chars, required)
  - `description` (string, 10-2000 chars, required)
  - `imageUrl` (string, valid URL, optional)
- **Response:**
  - `201 Created` with bug report
  - `400` on validation error

### Get My Bug Reports
- **GET** `/api/bug-reports`
- **Description:** Get user's bug reports
- **Auth:** Bearer token required
- **Response:**
  - `200 OK` with list

---

## Feedback Endpoints

### Submit Feedback
- **POST** `/api/feedback`
- **Description:** Submit feedback
- **Auth:** Bearer token required
- **Body:**
  - `message` (string, 10-2000 chars, required)
  - `imageUrl` (string, valid URL, optional)
- **Response:**
  - `201 Created` with feedback
  - `400` on validation error

### Get My Feedback
- **GET** `/api/feedback`
- **Description:** Get user's feedback
- **Auth:** Bearer token required
- **Response:**
  - `200 OK` with list

---

## Constituency Endpoints

### Get States/Constituencies/MLA
- **GET** `/api/constituencies`
- **Description:**
  - No query: all states
  - `state`: all constituencies in state
  - `state` + `constituency`: MLA and party for that constituency
- **Auth:** None
- **Query:**
  - `state`, `constituency`
- **Response:**
  - `200 OK` with data or `404` if not found

### Get Parliamentary Constituencies
- **GET** `/api/constituencies/parliamentary?state=STATE`
- **Description:** Get parliamentary constituencies for a state
- **Auth:** None
- **Query:**
  - `state` (required)
- **Response:**
  - `200 OK` with data

### Get MP by Parliamentary Constituency
- **GET** `/api/constituencies/mp?state=STATE&pc_name=PC_NAME`
- **Description:** Get MP for a parliamentary constituency
- **Auth:** None
- **Query:**
  - `state`, `pc_name` (both required)
- **Response:**
  - `200 OK` with data or `404` if not found

---

## Notification Endpoints

### Get My Notifications
- **GET** `/api/notifications`
- **Description:** Get notifications for logged-in user
- **Auth:** Bearer token required
- **Query:**
  - `page`, `limit`, `unreadOnly`
- **Response:**
  - `200 OK` with notifications and pagination

---

## Admin Endpoints

> All admin endpoints require Bearer token and admin privileges.

### User Management
- **GET** `/api/admin/users` — List users (pagination, filtering)

### Pothole Report Management
- **GET** `/api/admin/reports` — List reports (pagination, filtering)
- **PUT** `/api/admin/reports/:id/status` — Update pothole status

### Notification Management
- **POST** `/api/admin/notifications/broadcast` — Send broadcast notification
- **DELETE** `/api/admin/notifications/:id` — Delete notification

### Bug Report Management
- **GET** `/api/admin/bug-reports` — List bug reports
- **PUT** `/api/admin/bug-reports/:id/status` — Update bug report status
- **DELETE** `/api/admin/bug-reports/:id` — Delete bug report

### Feedback Management
- **GET** `/api/admin/feedback` — List feedback

---

## Notes
- All endpoints return JSON responses with a `success` boolean and either `data` or `message` fields.
- For endpoints requiring authentication, provide the JWT token in the `Authorization: Bearer <token>` header.
- Validation errors return `400` with details in the `errors` array.
