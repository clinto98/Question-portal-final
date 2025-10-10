# Maker Login Feature Documentation

This document provides a detailed technical breakdown of the Maker Login feature.

## Frontend

The frontend is a React component that provides a user interface for makers to log in to the application.

### Component Breakdown

*   **`MakerLogin.jsx`**: This is the main component for the login page. It renders the login form and handles user input and authentication logic.

### UI/UX Elements and Layout

*   **Layout**: The component uses a centered layout with a gradient background (`from-blue-100 to-blue-300`). The form is presented in a white card with a shadow (`bg-white`, `rounded-2xl`, `shadow-lg`).
*   **Header**:
    *   A main title "Maker Login" (`text-3xl font-extrabold text-blue-800`).
    *   A subtitle "Sign in to create questions" (`text-gray-500`).
*   **Input Fields**:
    *   An `input` of type `email` with the placeholder "Email".
    *   An `input` of type `password` with the placeholder "Password".
    *   Both fields have consistent styling for padding, border, and focus states.
*   **Login Button**:
    *   A `button` with the text "Login as Maker".
    *   It has a blue background, white text, and a hover effect.
*   **Loading Spinner**:
    *   A spinning loader is displayed in place of the form fields and button while the login request is in progress (`loading` state is `true`).

### State Management

The component uses the `useState` hook for managing local state and `useAuth` custom hook for global authentication state.

*   **`email`**:
    *   **Type**: `String`
    *   **Initial Value**: `""`
    *   **Purpose**: Stores the value entered in the email input field.
*   **`password`**:
    *   **Type**: `String`
    *   **Initial Value**: `""`
    *   **Purpose**: Stores the value entered in the password input field.
*   **`loading` (from `useAuth`)**:
    *   **Type**: `Boolean`
    *   **Purpose**: Indicates whether an authentication process is currently active. Used to show/hide the loading spinner.
*   **`user` (from `useAuth`)**:
    *   **Type**: `Object | null`
    *   **Purpose**: Stores the authenticated user's data. If a maker is already logged in, the component will redirect them to the maker dashboard.

### User Interactions and Event Handling

*   **`onChange` on Email Input**:
    *   **Handler**: `(e) => setEmail(e.target.value)`
    *   **Action**: Updates the `email` state variable with the current value of the input field.
*   **`onChange` on Password Input**:
    *   **Handler**: `(e) => setPassword(e.target.value)`
    *   **Action**: Updates the `password` state variable with the current value of the input field.
*   **`onClick` on Login Button**:
    *   **Handler**: `handleLogin`
    *   **Action**: Triggers the login process.

### Client-Side Validation

*   Inside the `handleLogin` function, there is a check: `if (!email || !password)`.
*   If either `email` or `password` is empty, an `alert("Enter email & password")` is shown to the user, and the API call is prevented.

### API Calls

*   **Function**: `login(email, password, "maker")` (from `useAuth` context)
*   **Details**: This function is called within `handleLogin`. It makes a network request to the backend to authenticate the user.
    *   **HTTP Method**: `POST`
    *   **API Endpoint URL**: `http://localhost:5000/api/auth/login/maker`
    *   **Data Payload**: `{ "email": "...", "password": "..." }`
*   **State Handling**:
    *   **Loading**: The `loading` state from `useAuth` is set to `true` before the API call and `false` after it completes.
    *   **Error**: If the API call fails (`res.success` is `false`), an alert is shown with the error message from the server: `alert(res.message)`.
    *   **Success**: On a successful login, the user is redirected to the maker dashboard using `navigate("/maker")`.

---

## Backend

The backend consists of an Express.js route and a controller that handles the logic for authenticating a user with the "Maker" role.

### API Endpoint

*   **Endpoint**: `POST /api/auth/login/maker`
*   **Responsibility**: To authenticate a user as a "Maker" based on their email and password. If successful, it returns a JSON Web Token (JWT).

### Authentication & Authorization

*   **Authentication**: No authentication is required to access this endpoint. It is a public route for logging in.
*   **Authorization**: No specific roles are required.

### Request Structure

*   **Headers**:
    *   `Content-Type: application/json`
*   **Body**:
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```
    *   `email` (String, required): The email address of the maker.
    *   `password` (String, required): The password of the maker.

### Business Logic Flow

The request is handled by the `loginMaker` controller, which uses the generic `handleLogin` function.

1.  **Data Extraction**: The `email` and `password` are extracted from the request body.
2.  **Database Interaction (User Lookup)**:
    *   The system queries the `makers` collection to find a document that matches the provided `email`.
    *   The `password` field, which is normally excluded from queries, is explicitly included (`.select("+password")`) for comparison.
    *   If no user is found, a `400 Bad Request` response is sent.
3.  **Account Status Check**:
    *   It checks the `isActive` property of the found user document.
    *   If `user.isActive` is `false`, it means the account has been deactivated. A `401 Unauthorized` response is sent with a specific message.
4.  **Password Verification**:
    *   `bcrypt.compare()` is used to securely compare the plaintext `password` from the request body with the hashed password stored in the database.
    *   If the passwords do not match, a `400 Bad Request` response is sent.
5.  **Token Generation**:
    *   If the password is correct, a new JWT is generated using the `generateToken` utility.
    *   The token payload includes the user's MongoDB `_id`, `email`, and `type: "maker"`.
6.  **Response**: A `200 OK` response is sent back to the client.

### Response Structure

*   **Success Response (`200 OK`)**:
    *   **Body**:
        ```json
        {
          "message": "maker login successful",
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "user": {
            "id": "60d5f2b9c3b3c3b3c3b3c3b3",
            "email": "maker@example.com",
            "type": "maker"
          }
        }
        ```
*   **Error Responses**:
    *   **`400 Bad Request`**: Sent if the email does not exist or the password does not match.
        ```json
        {
          "message": "Invalid email or password"
        }
        ```
    *   **`401 Unauthorized`**: Sent if the maker's account is deactivated (`isActive: false`).
        ```json
        {
          "message": "Your account has been deactivated. Please contact an administrator."
        }
        ```
    *   **`500 Internal Server Error`**: Sent if an unexpected error occurs on the server.
        ```json
        {
          "message": "Server error"
        }
        ```
