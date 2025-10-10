# Common Login Page Feature Documentation

This document provides a detailed technical breakdown of the unified `LoginPage` feature, which handles authentication for both "Maker" and "Checker" roles.

## Frontend

The frontend is a single, dynamic React page that provides a user interface for both Makers and Checkers to log in. The UI and logic adapt based on the selected role.

### Component Breakdown

*   **`Branding`**: A static sub-component that renders the left-side panel of the login screen. It displays the application name ("MCQ Portal") and a tagline over a background image. It is purely presentational.
*   **`RoleSelector`**: A sub-component that renders a toggle switch allowing the user to select between the "Maker" and "Checker" roles. The currently selected role is highlighted.
*   **`LoginPage`**: The main parent component. It orchestrates the other components and manages the overall state and authentication logic for the page.

### UI/UX Elements and Layout

*   **Layout**: The page is split into two vertical panels.
    *   The left 50% is the `Branding` component with a photographic background.
    *   The right 50% contains the actual login form, centered within the panel.
*   **Role Selector**: A prominent toggle button group at the top of the form to switch between "Maker" (blue theme) and "Checker" (green theme).
*   **Form Title**: A "Sign In" header and a descriptive paragraph.
*   **Input Fields**:
    *   An `input` for `email`, prefixed with a mail icon (`FiMail`).
    *   An `input` for `password`, prefixed with a lock icon (`FiLock`).
    *   The focus ring color of the inputs dynamically changes to match the selected role's theme (blue for Maker, green for Checker).
*   **Submit Button**:
    *   A `button` of type `submit`.
    *   The button's background color and text are dynamic, changing based on the selected role (e.g., "Sign In as Maker" with a blue background).
*   **Loading Spinner**:
    *   A spinning loader is displayed in place of the form while an authentication request is in progress (`loading` state is `true`). Its color also matches the selected role's theme.

### State Management

The component uses `useState` for local form state and the `useAuth` custom hook for global authentication state.

*   **`email`**:
    *   **Type**: `String`
    *   **Initial Value**: `""`
    *   **Purpose**: Stores the value from the email input field.
*   **`password`**:
    *   **Type**: `String`
    *   **Initial Value**: `""`
    *   **Purpose**: Stores the value from the password input field.
*   **`role`**:
    *   **Type**: `String`
    *   **Initial Value**: `"maker"`
    *   **Purpose**: Stores the currently selected user role ("maker" or "checker"). This value determines the UI theme and the target API endpoint.
*   **`loading` (from `useAuth`)**:
    *   **Type**: `Boolean`
    *   **Purpose**: Indicates if an authentication API call is in progress.
*   **`user` (from `useAuth`)**:
    *   **Type**: `Object | null`
    *   **Purpose**: Stores the authenticated user's data. If a user is already logged in, a `useEffect` hook redirects them to their corresponding dashboard (`/maker` or `/checker`).

### User Interactions and Event Handling

*   **`onClick` on RoleSelector Buttons**:
    *   **Handler**: `() => setRole("maker")` or `() => setRole("checker")`
    *   **Action**: Updates the `role` state variable, which triggers a re-render with the new theme and button text.
*   **`onChange` on Input Fields**:
    *   **Handlers**: `(e) => setEmail(e.target.value)` and `(e) => setPassword(e.target.value)`
    *   **Action**: Update the `email` and `password` state variables respectively.
*   **`onSubmit` on Form**:
    *   **Handler**: `handleLogin` (called via `e.preventDefault()`)
    *   **Action**: Prevents the default form submission and calls the `handleLogin` function to initiate the authentication sequence.

### Client-Side Validation

*   A check `if (!email || !password)` exists within `handleLogin`.
*   If either field is empty, an `alert("Please enter both email and password.")` is displayed, and the API call is aborted.

### API Calls

*   **Function**: `login(email, password, role)` (from `useAuth` context)
*   **Details**: This function is called from `handleLogin` and is responsible for making the network request.
    *   **HTTP Method**: `POST`
    *   **API Endpoint URL**: The URL is dynamically determined by the `role` state variable.
        *   If `role` is `"maker"`, the endpoint is `http://localhost:5000/api/auth/login/maker`.
        *   If `role` is `"checker"`, the endpoint is `http://localhost:5000/api/auth/login/checker`.
    *   **Data Payload**: `{ "email": "...", "password": "..." }`
*   **State Handling**:
    *   **Loading**: The `loading` state is used to show/hide the spinner.
    *   **Error**: If the API call is unsuccessful (`res.success` is `false`), an alert is shown with the server's error message: `alert(res.message)`.
    *   **Success**: On success, the user is redirected to their role-specific dashboard using `navigate(\`/${role}\`)

---

## Backend

The backend logic for the common login page is handled by two separate API endpoints, one for each role. However, both routes are processed by a single generic controller function.

### API Endpoint

*   **Endpoint 1**: `POST /api/auth/login/maker`
*   **Endpoint 2**: `POST /api/auth/login/checker`
*   **Responsibility**: To authenticate a user for a specific role ("Maker" or "Checker") using their email and password and return a JWT upon success.

### Authentication & Authorization

*   **Authentication**: None required. These are public endpoints.
*   **Authorization**: No roles are required to access these endpoints.

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
    *   `email` (String, required): The user's email address.
    *   `password` (String, required): The user's password.

### Business Logic Flow

The request is handled by `loginMaker` or `loginChecker`, which both call the generic `handleLogin(Model, type, req, res)` function.

1.  **Model Selection**: The `Model` passed to `handleLogin` is either the `Maker` or `Checker` Mongoose model, depending on the endpoint hit.
2.  **Data Extraction**: `email` and `password` are extracted from the request body.
3.  **Database Interaction**:
    *   The system queries the appropriate collection (`makers` or `checkers`) for a user with the matching `email`.
    *   The hashed `password` field is explicitly selected for comparison.
    *   If no user is found, a `400 Bad Request` is returned.
4.  **Account Status Check**:
    *   The `user.isActive` flag is checked.
    *   If `false`, a `401 Unauthorized` response is returned, preventing deactivated users from logging in.
5.  **Password Verification**:
    *   `bcrypt.compare()` is used to match the provided password with the stored hash.
    *   If they don't match, a `400 Bad Request` is returned.
6.  **Token Generation**:
    *   Upon successful password verification, a JWT is generated.
    *   The token payload contains the user's `_id`, `email`, and `type` (either "maker" or "checker").
7.  **Response**: A `200 OK` response is sent with the token and user information.

### Response Structure

*   **Success Response (`200 OK`)**:
    *   **Body**:
        ```json
        {
          "message": "<role> login successful", // e.g., "maker login successful"
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "user": {
            "id": "...",
            "email": "user@example.com",
            "type": "<role>" // "maker" or "checker"
          }
        }
        ```
*   **Error Responses**:
    *   **`400 Bad Request`**: For invalid credentials.
        ```json
        { "message": "Invalid email or password" }
        ```
    *   **`401 Unauthorized`**: For deactivated accounts.
        ```json
        { "message": "Your account has been deactivated. Please contact an administrator." }
        ```
    *   **`500 Internal Server Error`**: For any other server-side errors.
        ```json
        { "message": "Server error" }
        ```