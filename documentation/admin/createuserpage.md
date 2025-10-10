# Create User Page Feature Documentation

This document provides a detailed technical breakdown of the "Create User" feature, which allows administrators to provision new user accounts for Makers, Checkers, and Experts.

## Frontend

The frontend for this feature is a single React component that renders a form for inputting new user details.

### Component Breakdown

*   **`CreateUserPage`**: The main component that contains the user creation form, manages its state, and handles the API submission.
*   **`Loader`**: A reusable component that displays a loading animation overlay while the creation request is being processed.

### UI/UX Elements and Layout

*   **Layout**: The component consists of a single form centered within a white, rounded, and shadowed container (`bg-white`, `rounded-lg`, `shadow-md`).
*   **Header**: A title, "Create New User", is displayed at the top of the form.
*   **Form Fields**: The form is organized into a responsive grid and includes the following fields:
    *   **Name**: A text input for the user's full name.
    *   **Email**: A text input for the user's email address.
    *   **Password**: A password input for the user's initial password.
    *   **Role**: A `select` dropdown to assign a role to the new user. The options are "Maker", "Checker", and "Expert".
*   **Submit Button**: A button with the text "Create User" to submit the form.

### State Management

The component uses the `useState` hook for managing form data and loading state.

*   **`formData`**:
    *   **Type**: `Object`
    *   **Initial Value**: `{ name: "", email: "", password: "", role: "maker" }`
    *   **Purpose**: A single object that holds the current values for all form inputs.
*   **`loading`**:
    *   **Type**: `Boolean`
    *   **Initial Value**: `false`
    *   **Purpose**: Toggles the display of the `Loader` component during the API call.

### User Interactions and Event Handling

*   **`onChange` on Form Fields**:
    *   **Handler**: `handleInputChange`
    *   **Action**: A generic handler that updates the `formData` state object. It uses the `name` attribute of the input field to determine which property to update.
*   **`onSubmit` on Form**:
    *   **Handler**: `handleSubmit`
    *   **Action**: Prevents the default form submission and initiates the user creation process.

### Client-Side Validation

*   The `handleSubmit` function performs a check: `if (!formData.name || !formData.email || !formData.password)`.
*   If any of these fields are empty, an `alert("Please fill all fields")` is displayed, and the API call is not made.

### API Calls

*   **Function**: `fetch` (called within `handleSubmit`)
*   **Details**:
    *   **HTTP Method**: `POST`
    *   **API Endpoint URL**: `http://localhost:5000/api/admin/create-user`
    *   **Headers**:
        *   `Content-Type: application/json`
        *   `Authorization`: A `Bearer` token for the currently logged-in admin is required.
    *   **Data Payload**: The `formData` state object is stringified and sent as the request body.
*   **State Handling**:
    *   **Loading**: `setLoading(true)` is called before the request, and `setLoading(false)` is called in the `finally` block.
    *   **Success**: If the response is `ok`, an alert with the success message from the server is shown, and the form is reset to its initial state.
    *   **Error**: If the response is not `ok`, an alert is shown with the error message provided by the server.

---

## Backend

The backend provides a secure and role-aware API endpoint for administrators to create new users.

### API Endpoint

*   **Endpoint**: `POST /api/admin/create-user`
*   **Responsibility**: To validate the provided user data, check for duplicates, and create a new user document in the appropriate database collection based on the specified role.

### Authentication & Authorization

*   **Authentication**: Requires an authenticated user. The `protect` middleware validates the JWT.
*   **Authorization**: Requires the user to have the `"admin"` role. The `authorize('admin')` middleware enforces this.

### Request Structure

*   **Headers**:
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <jwt_token>` (Required)
*   **Body**: A JSON object containing the new user's details.
    ```json
    {
      "name": "string",
      "email": "string",
      "password": "string",
      "role": "string" 
    }
    ```
    *   All fields are required.
    *   `role` must be one of `"maker"`, `"checker"`, or `"expert"`.

### Business Logic Flow

1.  **Data Extraction & Validation**: The `name`, `email`, `password`, and `role` are extracted from the request body. It first checks if all fields are present. Then, it validates that the `role` is one of the allowed values. If validation fails, it returns a `400 Bad Request`.
2.  **Model Selection**: A `switch` statement selects the correct Mongoose model (`Maker`, `Checker`, or `Expert`) based on the `role` string.
3.  **Duplicate Check**: It queries the selected collection to see if a user with the same `email` already exists. If a duplicate is found, it returns a `400 Bad Request` with a specific error message.
4.  **Password Hashing**: The plaintext `password` is securely hashed using `bcrypt.hash()`.
5.  **Database Interaction**: A new user document is created in the selected collection using `Model.create()` with the provided `name`, `email`, and the `hashedPassword`.
6.  **Response**: A `201 Created` response is sent to the client, including a success message and a user object containing the new user's `id`, `name`, `email`, and `role` (the password is not sent back).

### Response Structure

*   **Success Response (`201 Created`)**:
    *   **Body**:
        ```json
        {
          "message": "<Role> created successfully", // e.g., "Maker created successfully"
          "user": {
            "id": "...",
            "name": "New User Name",
            "email": "newuser@example.com",
            "role": "<role>"
          }
        }
        ```
*   **Error Responses**:
    *   **`400 Bad Request`**: If required fields are missing, the role is invalid, or the user already exists.
        ```json
        // Example for missing fields
        { "message": "All fields are required" }
        
        // Example for duplicate user
        { "message": "User with this email already exists in the selected role" }
        ```
    *   **`401 Unauthorized`**: If the JWT is missing or invalid.
    *   **`403 Forbidden`**: If the authenticated user is not an admin.
    *   **`500 Internal Server Error`**: For any other database or server errors.
        ```json
        { "message": "Server error" }
        ```
