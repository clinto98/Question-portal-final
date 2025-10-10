# Admin Login Feature Documentation

This document provides a detailed technical breakdown of the Admin Login feature.

## Frontend

The frontend is a React component that provides a dedicated user interface for administrators to log in to the application.

### Component Breakdown

*   **`Branding`**: A static, reusable sub-component that renders the left-side panel of the login screen. It displays the application name ("MCQ Portal") and a tagline specific to the admin console. This component is hidden on smaller screens (`hidden lg:flex`).
*   **`AdminLogin`**: This is the main component for the admin login page. It renders the login form and handles all user input and authentication logic.

### UI/UX Elements and Layout

*   **Layout**: The page uses a two-panel layout on larger screens.
    *   The left panel is the `Branding` component.
    *   The right panel contains the login form, which takes up the full width on smaller screens.
*   **Header**:
    *   A main title "Admin Sign In" (`text-3xl font-bold`).
    *   A subtitle "Use your administrative credentials to log in." (`text-gray-600`).
*   **Theme**: The page uses a distinct purple color theme (`primaryColor = "purple"`) for focus rings, the loading spinner, and the submit button to visually distinguish it as an administrative area.
*   **Input Fields**:
    *   An `input` of type `email` with a placeholder "Email", prefixed with a `FiMail` icon.
    *   An `input` of type `password` with a placeholder "Password", prefixed with a `FiLock` icon.
*   **Submit Button**:
    *   A `button` of type `submit` with the text "Sign In as Admin".
*   **Loading Spinner**:
    *   A purple spinning loader is displayed while the login request is in progress (`loading` state is `true`).
*   **Other Elements**: A "Forgot Password?" link is present but is non-functional (`href="#"`).

### State Management

The component uses `useState` for local form state and the `useAuth` custom hook for global authentication state.

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
    *   **Purpose**: Indicates whether the authentication API call is active. Used to show/hide the loading spinner.
*   **`user` (from `useAuth`)**:
    *   **Type**: `Object | null`
    *   **Purpose**: Stores the authenticated user's data. A `useEffect` hook monitors this value to redirect an already logged-in admin to their dashboard (`/admin`).

### User Interactions and Event Handling

*   **`onChange` on Input Fields**:
    *   **Handlers**: `(e) => setEmail(e.target.value)` and `(e) => setPassword(e.target.value)`.
    *   **Action**: Update the `email` and `password` state variables as the user types.
*   **`onSubmit` on Form**:
    *   **Handler**: `handleLogin` (triggered by the form's `onSubmit` event).
    *   **Action**: Prevents the default form submission and calls the `handleLogin` function to start the authentication process.

### Client-Side Validation

*   The `handleLogin` function first checks `if (!email || !password)`.
*   If either field is empty, an `alert("Please enter both email and password.")` is shown, and the process stops before an API call is made.

### API Calls

*   **Function**: `login(email, password, "admin")` (from `useAuth` context).
*   **Details**: This function is called within `handleLogin` to perform the authentication.
    *   **HTTP Method**: `POST`
    *   **API Endpoint URL**: `http://localhost:5000/api/auth/login/admin`
    *   **Data Payload**: `{ "email": "...", "password": "..." }`
*   **State Handling**:
    *   **Loading**: The `loading` state from the context controls the visibility of the spinner.
    *   **Error**: If the API call fails (`res.success` is `false`), an alert is displayed with the error message from the server: `alert(res.message)`.
    *   **Success**: On a successful login, the user is redirected to the admin dashboard via `navigate("/admin")`.

---

## Backend

The backend logic for admin login is handled by a dedicated API endpoint that uses a generic controller with specific logic for the admin user type.

### API Endpoint

*   **Endpoint**: `POST /api/auth/login/admin`
*   **Responsibility**: To authenticate a user as an "Admin". If the credentials are valid, it returns a JSON Web Token (JWT).

### Authentication & Authorization

*   **Authentication**: None. This is a public endpoint.
*   **Authorization**: No roles are required to access this endpoint.

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
    *   `email` (String, required): The admin's email address.
    *   `password` (String, required): The admin's password.

### Business Logic Flow

The request is processed by the `loginAdmin` controller, which in turn calls the generic `handleLogin` function.

1.  **Model Selection**: The `handleLogin` function is invoked with the `Admin` Mongoose model.
2.  **Data Extraction**: The `email` and `password` are read from the request body.
3.  **Database Interaction (User Lookup)**:
    *   The system queries the `admins` collection to find a user with the provided `email`.
    *   The hashed `password` is included in the query result for comparison.
    *   If no admin user is found with that email, a `400 Bad Request` response is sent.
4.  **Account Status Check (Bypassed)**:
    *   The generic `handleLogin` function contains a check: `if (type !== "admin" && !user.isActive)`. 
    *   Because the `type` is `"admin"`, **this check is bypassed**. An admin can log in even if their `isActive` status is set to `false`.
5.  **Password Verification**:
    *   `bcrypt.compare()` securely checks if the provided password matches the stored hash.
    *   If the passwords do not match, a `400 Bad Request` is sent.
6.  **Token Generation**:
    *   If authentication is successful, a new JWT is created.
    *   The token payload contains the admin's `_id`, `email`, and `type: "admin"`.
7.  **Response**: A `200 OK` response is sent to the client with the token and user data.

### Response Structure

*   **Success Response (`200 OK`)**:
    *   **Body**:
        ```json
        {
          "message": "admin login successful",
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "user": {
            "id": "...",
            "email": "admin@example.com",
            "type": "admin"
          }
        }
        ```
*   **Error Responses**:
    *   **`400 Bad Request`**: Sent if the email does not exist or the password is incorrect.
        ```json
        {
          "message": "Invalid email or password"
        }
        ```
    *   **`500 Internal Server Error`**: Sent for any unexpected server-side errors.
        ```json
        {
          "message": "Server error"
        }
        ```
