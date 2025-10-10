# Create Course Page Feature Documentation

This document provides a detailed technical breakdown of the "Create Course" feature, which allows administrators to add new courses to the system.

## Frontend

The frontend consists of a single React component that renders a comprehensive form for inputting course details.

### Component Breakdown

*   **`CreateCoursePage`**: This is the main component for the feature. It manages the form's state, handles user input, and submits the new course data to the backend API.
*   **`Loader`**: A reusable component that displays a loading overlay while the form is being submitted.

### UI/UX Elements and Layout

*   **Layout**: The component is displayed on a light gray background (`bg-gray-50`), with the form itself contained within a white, rounded card (`bg-white`, `rounded-xl`, `shadow-lg`).
*   **Header**: A title "Create New Course" and a descriptive subtitle are displayed at the top of the form.
*   **Form Fields**: The form is laid out in a grid and contains the following fields:
    *   **Course Title**: A required text input.
    *   **Description**: A multi-line `textarea` for a detailed course description.
    *   **Standard / Grade**: A `select` dropdown with options from 5 to 12 and "Higher Studies".
    *   **Category**: A text input for the course category (e.g., "Science").
    *   **Syllabus**: A `select` dropdown with predefined options (CBSE, ICSE, etc.).
    *   **Exam Type**: A `select` dropdown with predefined options (Board, Entrance, etc.).
    *   **Start Date**: A date picker input.
    *   **End Date**: A date picker input.
*   **Submit Button**: A button with the text "Create Course". The text changes to "Saving..." and the button becomes disabled during the API call.

### State Management

The component uses the `useState` hook to manage the form data and loading state.

*   **`formData`**:
    *   **Type**: `Object`
    *   **Initial Value**: An object (`initialState`) with keys for all form fields, pre-filled with default values (e.g., `standard: "5"`, `status: "Active"`).
    *   **Purpose**: Acts as a single source of truth for all the data entered into the form.
*   **`loading`**:
    *   **Type**: `Boolean`
    *   **Initial Value**: `false`
    *   **Purpose**: Controls the disabled state of the submit button and the visibility of the `Loader` component.

### User Interactions and Event Handling

*   **`onChange` on Form Fields**:
    *   **Handler**: `handleInputChange`
    *   **Action**: This single function handles changes for all input and select fields. It uses the field's `name` attribute to update the corresponding key in the `formData` state object.
*   **`onSubmit` on Form**:
    *   **Handler**: `handleSubmit`
    *   **Action**: Prevents the default form submission and initiates the process of creating a new course.

### Client-Side Validation

*   Inside the `handleSubmit` function, a basic check `if (!formData.title || !formData.standard)` is performed.
*   If the `title` or `standard` fields are empty, an `alert` is shown to the user, and the API call is prevented.

### API Calls

*   **Function**: `axios.post` (called within `handleSubmit`)
*   **Details**:
    *   **HTTP Method**: `POST`
    *   **API Endpoint URL**: `http://localhost:5000/api/admin/courses`
    *   **Headers**: An `Authorization` header with the `Bearer` token is required.
    *   **Data Payload**: The entire `formData` state object is sent as the request body.
*   **State Handling**:
    *   **Loading**: `setLoading(true)` is called before the API request, and `setLoading(false)` is called in the `finally` block.
    *   **Success**: On success, an `alert("Course created successfully!")` is shown, the page is reloaded with `window.location.reload()`, and the user is navigated to `/admin/create-courses`.
    *   **Error**: If the API call fails, an alert is displayed containing the error message from the backend response (`err.response?.data?.message`).

---

## Backend

The backend provides a secure API endpoint for creating new course entries in the database.

### API Endpoint

*   **Endpoint**: `POST /api/admin/courses`
*   **Responsibility**: To validate and persist a new course document to the database.

### Authentication & Authorization

*   **Authentication**: Requires an authenticated user. The `protect` middleware validates the JWT.
*   **Authorization**: Requires the user to have the `"admin"` role. The `authorize('admin')` middleware enforces this.

### Request Structure

*   **Headers**:
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <jwt_token>` (Required)
*   **Body**: A JSON object representing the new course.
    ```json
    {
      "title": "string",
      "description": "string",
      "standard": "string",
      "category": "string",
      "syllabus": "string",
      "examType": "string",
      "startDate": "date",
      "endDate": "date",
      "status": "string"
    }
    ```
    *   `title`, `standard`, `syllabus`, `examType` are required.

### Business Logic Flow

1.  **Data Extraction**: The course details are extracted from the request body.
2.  **Server-Side Validation**:
    *   It checks if the required fields (`title`, `standard`, `syllabus`, `examType`) are present. If not, it returns a `400 Bad Request`.
3.  **Duplicate Check**:
    *   It performs a case-insensitive query on the `Course` collection to see if a course with the same `title` already exists.
    *   If a duplicate is found, it returns a `409 Conflict` error to prevent duplicate entries.
4.  **Database Interaction**:
    *   A new `Course` object is instantiated with the provided data and the `createdBy` field is set to the ID of the authenticated admin user (`req.user._id`).
    *   The `newCourse.save()` method is called to persist the document to the database.
5.  **Response**: A `201 Created` response is sent back to the client, including a success message and the newly created course object.

### Response Structure

*   **Success Response (`201 Created`)**:
    *   **Body**:
        ```json
        {
          "success": true,
          "message": "Course created successfully!",
          "course": { ... } // The full course object from the database
        }
        ```
*   **Error Responses**:
    *   **`400 Bad Request`**: If required fields are missing.
        ```json
        { "message": "Please fill in all required fields." }
        ```
    *   **`401 Unauthorized`**: If the JWT is missing or invalid.
    *   **`403 Forbidden`**: If the user is not an admin.
    *   **`409 Conflict`**: If a course with the same title already exists.
        ```json
        { "message": "A course with this title already exists. Please choose a different title." }
        ```
    *   **`500 Internal Server Error`**: For any other database or server errors.
        ```json
        { "message": "Server error while creating the course." }
        ```
