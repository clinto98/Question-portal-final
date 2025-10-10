# View Courses Page Feature Documentation

This document provides a detailed technical breakdown of the "View Courses Page" feature, which allows administrators to see a filterable list of all courses in the system.

## Frontend

The frontend for this feature is a single React component that fetches and displays a list of all created courses in a structured and filterable table.

### Component Breakdown

*   **`ViewCoursesPage`**: The main component that fetches the course data, manages filter states, and renders the list.
*   **`StatusBadge`**: A reusable component that displays a colored badge indicating the course status (e.g., "Active" or "Inactive").
*   **`Loader`**: A component that shows a loading animation while the initial course data is being fetched.

### UI/UX Elements and Layout

*   **Header**: A header section contains the main title "Manage Courses" and a prominent "+ Add New Course" button that navigates the admin to the course creation page.
*   **Filters**: Below the header, a set of filter controls allows the admin to narrow down the list:
    *   A text `input` to search by course title or standard.
    *   A `select` dropdown to filter by Syllabus (e.g., CBSE, ICSE). The options for this dropdown are dynamically generated from the fetched course data.
    *   A `select` dropdown to filter by Status ("All", "Active", "Inactive").
*   **Courses Table**: The main content area is a table that displays the list of courses with the following columns:
    *   Course Title, Standard, Syllabus, Exam Type.
    *   A `StatusBadge` for the course status.
    *   Start Date and End Date (formatted for readability).
    *   Created By (the name of the admin who created the course).
*   **Empty State**: If the list is empty (either initially or after filtering), a message is displayed in the table body indicating that no courses were found.

### State Management

The component uses `useState` for all its state needs.

*   **`courses`**: **Type**: `Array`, **Initial**: `[]`, **Purpose**: Stores the full, unfiltered list of course objects fetched from the backend.
*   **`loading`**: **Type**: `Boolean`, **Initial**: `true`, **Purpose**: Controls the visibility of the `Loader` component during the initial data fetch.
*   **`filterStatus`, `filterSyllabus`, `searchTerm`**: **Type**: `String`, **Purpose**: These state variables hold the current values of their respective filter controls. Changes to these states trigger a re-render, which causes the `filteredCourses` array to be recalculated.

### User Interactions and Event Handling

*   **`useEffect` on Mount**: Calls an async function `fetchCourses` to load the initial list of courses from the API when the component first renders.
*   **`onClick` on "+ Add New Course" Button**: Uses the `useNavigate` hook to redirect the admin to the `/admin/create-course` route.
*   **`onChange` on Filter Controls**: Each filter control has an `onChange` handler that updates its corresponding state variable (`setSearchTerm`, `setFilterSyllabus`, etc.). This state change causes the component to re-render and apply the filters.

### API Calls

*   **Fetch All Courses**
    *   **Function**: `fetchCourses` (called inside `useEffect`)
    *   **Details**:
        *   **HTTP Method**: `GET`
        *   **API Endpoint URL**: `http://localhost:5000/api/admin/courses`
        *   **Headers**: Requires an `Authorization: Bearer <token>` header.
    *   **State Handling**: On a successful request, the `courses` state is updated with the array of courses from the response. `setLoading(false)` is called in the `finally` block to hide the loader.

---

## Backend

The backend provides a secure API endpoint that serves the complete list of courses.

### API Endpoint

*   **Endpoint**: `GET /api/admin/courses`
*   **Responsibility**: To retrieve all course documents from the database, along with the name of the admin who created them.

### Authentication & Authorization

*   **Authentication**: Requires an authenticated user. The `protect` middleware validates the JWT.
*   **Authorization**: Requires the user to have the `"admin"` role. The `authorize('admin')` middleware enforces this.

### Request Structure

*   **Headers**: `Authorization: Bearer <jwt_token>` (Required).
*   **Body**: None.

### Business Logic Flow

1.  **Database Query**: The controller executes `Course.find({})` to retrieve all documents from the `courses` collection.
2.  **Populate Creator Name**: The query is chained with `.populate("createdBy", "name")`. This tells Mongoose to look at the `createdBy` field (which stores an admin's `ObjectId`), find the corresponding document in the `admins` collection, and replace the ID with the value of the `name` field from that document.
3.  **Sorting**: The results are sorted by their creation date in descending order (`.sort({ createdAt: -1 })`) so that the newest courses appear first.
4.  **Response**: The final array of populated course documents is sent back as the JSON response.

### Response Structure

*   **Success Response (`200 OK`)**:
    *   **Body**: An array of course objects. Each object includes all fields from the `Course` schema, with the `createdBy` field expanded to an object containing the admin's name.
        ```json
        [
          {
            "_id": "60d5f2b9c3b3c3b3c3b3c3b3",
            "title": "Advanced Mathematics",
            "standard": "12",
            "syllabus": "CBSE",
            "status": "Active",
            "createdBy": {
              "_id": "60d5f2b9c3b3c3b3c3b3c3a1",
              "name": "Admin User"
            },
            "createdAt": "2025-10-09T10:00:00.000Z",
            ...
          }
        ]
        ```
*   **Error Responses**:
    *   **`401 Unauthorized`**: If the JWT is missing or invalid.
    *   **`403 Forbidden`**: If the authenticated user is not an admin.
    *   **`500 Internal Server Error`**: If the database query fails.
        ```json
        { "message": "Server error while fetching courses." }
        ```
