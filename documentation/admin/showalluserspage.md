# Show All Users Page Feature Documentation

This document provides a detailed technical breakdown of the "Show All Users" feature, which allows administrators to view and manage all Maker and Checker accounts in the system.

## Frontend

The frontend for this feature is a single React component that fetches and displays lists of users, categorized by role, and provides functionality to activate or deactivate them.

### Component Breakdown

*   **`ShowAllUsersPage`**: The main component that fetches user data, manages state, and renders the user tables.
*   **`Loader`**: A reusable component that displays a loading animation while the initial user data is being fetched.

### UI/UX Elements and Layout

*   **Layout**: The component is structured with a main title and then separate sections for each user role ("Makers" and "Checkers").
*   **User Tables**: For each role, a table is rendered with the following columns:
    *   `#`: The row number.
    *   `Name`: The user's name.
    *   `Email`: The user's email address.
    *   `Status`: A colored badge indicating the user's status ("Active" in green, "Inactive" in red).
    *   `Action`: A button to change the user's status. The button text and color are dynamic ("Deactivate" in red for active users, "Activate" in green for inactive users).
*   **Empty State**: If no users exist for a role, a message "No [role] found." is displayed instead of a table.

### State Management

The component uses the `useState` hook for its state.

*   **`users`**:
    *   **Type**: `Object`
    *   **Initial Value**: `{ makers: [], checkers: [] }`
    *   **Purpose**: Stores the arrays of maker and checker objects fetched from the backend.
*   **`loading`**:
    *   **Type**: `Boolean`
    *   **Initial Value**: `false` (but set to `true` at the start of `fetchUsers`)
    *   **Purpose**: Controls the visibility of the `Loader` component during the initial data fetch.

### User Interactions and Event Handling

*   **`useEffect` on Mount**: Calls the `fetchUsers` function to load the user data when the component is first rendered.
*   **`onClick` on Action Button**:
    *   **Handler**: `handleToggleStatus(role, id)`
    *   **Action**: This function is called when the "Activate" or "Deactivate" button is clicked. It triggers a `PATCH` request to the backend to update the specific user's status. After the request, it calls `fetchUsers()` again to refresh the list with the updated data.

### API Calls

1.  **Fetch All Users**
    *   **Function**: `fetchUsers`
    *   **Details**:
        *   **HTTP Method**: `GET`
        *   **API Endpoint URL**: `http://localhost:5000/api/admin/users`
        *   **Headers**: Requires an `Authorization: Bearer <token>` header.
    *   **State Handling**: On success, it updates the `users` state with the fetched arrays of makers and checkers. On failure, it shows an `alert`.

2.  **Toggle User Status**
    *   **Function**: `handleToggleStatus(role, id)`
    *   **Details**:
        *   **HTTP Method**: `PATCH`
        *   **API Endpoint URL**: `http://localhost:5000/api/admin/user/:role/:id/status` (e.g., `/api/admin/user/maker/60d5f2b9c3b3c3b3c3b3c3b3/status`)
        *   **Headers**: Requires an `Authorization: Bearer <token>` header.
    *   **State Handling**: On success, it shows an `alert` with the success message from the server and re-fetches the entire user list. On failure, it shows an `alert`.

---

## Backend

The backend provides two distinct API endpoints to support the user management page: one to retrieve all users and another to modify a specific user's status.

### 1. Get All Users

*   **API Endpoint**: `GET /api/admin/users`
*   **Authentication & Authorization**: Requires an authenticated admin user.
*   **Business Logic Flow**:
    1.  Queries the `Maker` collection for all documents. The `password` field is explicitly excluded from the result.
    2.  Queries the `Checker` collection for all documents, also excluding the `password`.
    3.  Returns a single JSON object containing two keys, `makers` and `checkers`, with their respective arrays of user documents.
*   **Response Structure**:
    *   **Success (`200 OK`)**: 
        ```json
        {
          "makers": [ { "_id": "...", "name": "...", "email": "...", "isActive": true } ],
          "checkers": [ { "_id": "...", "name": "...", "email": "...", "isActive": false } ]
        }
        ```
    *   **Error (`500 Server Error`)**: `{"message": "Server error"}`

### 2. Toggle User Status

*   **API Endpoint**: `PATCH /api/admin/user/:role/:id/status`
*   **Authentication & Authorization**: Requires an authenticated admin user.
*   **Request Structure**:
    *   **URL Parameters**:
        *   `role` (String, required): The role of the user to modify. Must be either `"maker"` or `"checker"`.
        *   `id` (String, required): The MongoDB `_id` of the user to modify.
    *   **Body**: None.
*   **Business Logic Flow**:
    1.  The `role` and `id` are extracted from the request parameters.
    2.  The `role` parameter is validated to ensure it is either `"maker"` or `"checker"`. If not, a `400 Bad Request` is returned.
    3.  A `switch` statement selects the appropriate Mongoose model (`Maker` or `Checker`) based on the `role`.
    4.  The user document is found in the database using `Model.findById(id)`.
    5.  If no user is found, a `404 Not Found` response is returned.
    6.  The boolean value of the `user.isActive` property is inverted ( `true` becomes `false`, and `false` becomes `true`).
    7.  The updated `user` document is saved back to the database.
    8.  A success message is returned.
*   **Response Structure**:
    *   **Success (`200 OK`)**: `{"message": "<Role> <activated/deactivated> successfully"}`
    *   **Error (`400 Bad Request`)**: If the `role` parameter is invalid.
    *   **Error (`404 Not Found`)**: If no user with the given `id` and `role` is found.
    *   **Error (`500 Server Error`)**: For any other database or server errors.
