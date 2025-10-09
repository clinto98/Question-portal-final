# GEMINI.md

## Project Overview

This is a full-stack MERN (MongoDB, Express, React, Node.js) application for creating, managing, and reviewing multiple-choice questions (MCQs). The application is structured as a monorepo with a `frontend` and a `backend`.

The application supports three user roles:
*   **Admin:** Manages users, courses, and can upload PDF documents.
*   **Maker:** Creates MCQ questions from the available PDF documents.
*   **Checker:** Reviews and accepts or rejects questions submitted by Makers.

### Technologies

*   **Backend:**
    *   Node.js
    *   Express.js
    *   MongoDB with Mongoose
    *   JSON Web Tokens (JWT) for authentication
    *   Cloudinary for file storage

*   **Frontend:**
    *   React
    *   Vite
    *   React Router for navigation
    *   Tailwind CSS for styling
    *   Axios for making API requests

## Building and Running

### Backend

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file** in the `backend` directory and add the following environment variables:
    ```
    PORT=5000
    MONGO_URI=<your_mongodb_connection_string>
    JWT_SECRET=<your_jwt_secret>
    CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
    CLOUDINARY_API_KEY=<your_cloudinary_api_key>
    CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The server will start on port 5000.

### Frontend

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The frontend development server will start, typically on port 5173.

## Development Conventions

*   **Monorepo Structure:** The project is organized into `frontend` and `backend` directories, separating the client and server code.
*   **API Routes:** Backend API routes are organized by functionality (e.g., `authRoutes.js`, `questionRoutes.js`) and prefixed with `/api`.
*   **React Components:** The frontend is built with React components, with pages organized by user roles.
*   **Authentication:** Authentication is handled using JWT. A `PrivateRoute` component in the frontend protects routes based on user roles.
*   **Styling:** Tailwind CSS is used for styling the frontend components.
