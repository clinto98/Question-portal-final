# Feature: Maker's Submitted Questions Page

This document provides a detailed technical breakdown of the feature that allows users with the "Maker" role to view and track the status of all questions they have submitted for review.

## Frontend

**File:** `frontend/src/pages/maker/SubmittedQuestions.jsx`

This file contains the React component for the "My Submitted Questions" page, which acts as a historical log and status tracker.

### Component Breakdown

*   **`SubmittedQuestions` (Main Component):** The primary component that fetches, filters, and displays the list of submitted questions.
*   **`ContentDisplay`:** A reusable component that renders the question's text and an optional image thumbnail. The image is clickable to open a full-size view.
*   **`StatusBadge`:** A reusable component that displays the question's status (`Pending`, `Approved`, `Rejected`) with a distinct, color-coded style for each.
*   **`Loader`:** A standard loading animation component.

### UI/UX Elements and Layout

The page is designed to give the maker a clear overview of their work's lifecycle.

*   **Header:** Contains the page title "My Submitted Questions".
*   **Filter Bar:** A dedicated section for filtering the list:
    *   A text input to search by question content.
    *   A dropdown to filter by status (`All`, `Pending`, `Approved`, `Rejected`).
    *   A dropdown to filter by course, which is dynamically populated based on the fetched questions.
*   **Questions Table:** A responsive table that displays the filtered questions with the following columns:
    *   **Question:** The question content, rendered by `ContentDisplay`.
    *   **Course, Unit, Question Paper:** Details about the question's origin.
    *   **Status:** The current status, rendered by `StatusBadge`.
    *   **Actions:** This column is conditional. It is empty for `Pending` and `Approved` questions. For `Rejected` questions, it contains two buttons:
        *   **View Comments:** Opens a modal to display the rejection feedback from the Checker.
        *   **Edit:** Navigates the user to the `EditRejectedQuestion` page for that specific question.
*   **Modals:**
    *   **Comments Modal:** A modal that appears when "View Comments" is clicked, showing the rejection notes.
    *   **Image View Modal:** A modal that appears when a question's image thumbnail is clicked, showing a larger version of the image.

### State Management

The component uses the `useState` hook for all state.

*   **`questions`**:
    *   **Type:** `Array`
    *   **Purpose:** Stores the list of all submitted question objects fetched from the backend.
*   **`loading`**:
    *   **Type:** `Boolean`
    *   **Purpose:** Tracks the loading state of the initial API call.
*   **`selectedComments`**:
    *   **Type:** `String | null`
    *   **Purpose:** Stores the rejection comments of a selected question. Its value also controls the visibility of the comments modal.
*   **`imageInView`**:
    *   **Type:** `String | null`
    *   **Purpose:** Stores the URL of the image to be displayed in the full-size image modal. Controls the modal's visibility.
*   **`search`, `filterStatus`, `filterCourse`**:
    *   **Type:** `String`
    *   **Purpose:** Store the current values of the respective filter controls.

### User Interactions and Event Handling

*   **Fetching Data:** An `useEffect` hook calls `fetchQuestions` on component mount.
*   **Filtering:** The `onChange` handlers for the search input and dropdowns update their respective state variables. A `filteredQuestions` array is derived by applying these state values to the main `questions` array, causing the table to re-render with the filtered results.
*   **Viewing Comments:** The `onClick` handler on the "View Comments" button sets the `selectedComments` state to the `checkerComments` string of the corresponding question, which opens the modal.
*   **Editing a Rejected Question:** The `onClick` handler on the "Edit" button uses the `useNavigate` hook to redirect the user to the edit page, e.g., `/maker/editrejected/:id`.

### API Calls

*   **Fetch Submitted Questions:**
    *   **Function:** `fetchQuestions`
    *   **Method:** `GET`
    *   **Endpoint:** `/api/questions/submitted`
    *   **Payload:** None.
    *   **State Handling:** On success, the response data is formatted (capitalizing the status string) and stored in the `questions` state. `loading` is set to `false` in the `finally` block.

---

## Backend

**Files:**
*   `backend/src/routes/questionRoutes.js`
*   `backend/src/controllers/questionController.js`

This feature is supported by a single, dedicated backend endpoint.

### Get Submitted Questions

*   **API Endpoint:** `GET /api/questions/submitted`
*   **Responsibility:** To fetch all questions created by the currently authenticated maker that are no longer in the "Draft" state.

#### Authentication & Authorization

*   **Authentication:** Requires a valid JWT (`protect` middleware).
*   **Authorization:** Requires the **`MAKER`** role (`isMaker` middleware).

#### Request Structure

*   **Headers:**
    *   `Authorization`: `Bearer <jwt_token>` (Required)
*   **Body/Parameters:** None.

#### Business Logic Flow

1.  Middleware validates the user's session and role.
2.  The `getSubmittedQuestions` controller function is executed.
3.  **Database Interaction:** It performs a `find` query on the `Question` collection.
    *   The query filters for documents where the `maker` field matches the authenticated user's ID (`req.user._id`) AND the `status` is **not equal to** `"Draft"` (`{ $ne: "Draft" }`).
    *   It uses `.populate("course", "title")` and `.populate("questionPaper", "name")` to include details from related collections.
    *   The results are sorted by `createdAt` in descending order.

#### Response Structure

*   **Success (200 OK):**
    *   An array of question objects. Each object contains all fields from the `Question` model for the statuses `Pending`, `Approved`, and `Rejected`, including populated data.
*   **Error Responses:**
    *   **401 Unauthorized / 403 Forbidden:** For authentication or authorization failures.
    *   **500 Internal Server Error:** If a database error occurs.
