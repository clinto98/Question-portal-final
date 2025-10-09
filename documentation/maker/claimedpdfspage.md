# Feature: Maker's Claimed Papers Page

This document provides a detailed technical breakdown of the feature that allows users with the "Maker" role to view the list of question papers they have claimed to work on.

## Frontend

**File:** `frontend/src/pages/maker/ClaimedPdfsPage.jsx`

This file contains the React component for the "My Claimed Papers" page.

### Component Breakdown

*   **`ClaimedPdfsPage` (Main Component):** The primary component that fetches and displays the list of claimed papers.
*   **`Loader`:** A standard component that displays a loading animation while the data is being fetched from the backend.

### UI/UX Elements and Layout

The page is structured around a detailed table that lists the claimed papers.

*   **Header:** A section containing the page title ("My Claimed Papers"), a descriptive paragraph, and a search input.
*   **Search Input:** A text field that allows the user to filter the list of papers by name in real-time.
*   **Papers Table:** If data is loading, the `Loader` is shown. Otherwise, a `table` is rendered with the following columns for each paper:
    *   **Paper Name:** The name of the question paper.
    *   **Course:** The title of the course the paper belongs to.
    *   **Subject:** The subject of the paper.
    *   **Year:** The year the question paper was originally for.
    *   **Progress:** A ratio showing the number of approved questions versus the total number of questions required for that paper (e.g., "5 / 20").
    *   **Question PDF:** A "View" button that links to the question paper PDF file, opening it in a new tab.
    *   **Solution PDF:** A "View" button that links to the solution PDF file, if available.
    *   **Actions:** Contains the primary call-to-action button, "Create Question".
*   **Empty State:** If the list is empty or if a search yields no results, a message is displayed in the table body.

### State Management

The component uses the `useState` hook for all state.

*   **`claimedPapers`**:
    *   **Type:** `Array`
    *   **Initial Value:** `[]`
    *   **Purpose:** Stores the list of claimed question paper objects fetched from the backend.
*   **`loading`**:
    *   **Type:** `Boolean`
    *   **Initial Value:** `true`
    *   **Purpose:** Tracks the loading state of the API call.
*   **`searchTerm`**:
    *   **Type:** `String`
    *   **Initial Value:** `""`
    *   **Purpose:** Stores the current value of the search input to filter the `claimedPapers` array.

### User Interactions and Event Handling

*   **Fetching Data:** An `useEffect` hook runs on component mount to call `fetchClaimedPdfs`, which performs the API request.
*   **Searching:** The `onChange` event of the search input updates the `searchTerm` state, which causes the `filteredPapers` array to be re-calculated and the table to re-render.
*   **Navigation:**
    *   The `useNavigate` hook is used for navigation.
    *   Clicking the "Create Question" button triggers `navigate(`/maker/create?questionPaper=${paper._id}`)`.
    *   This navigates the user to the question creation form and passes the selected paper's ID as a URL query parameter. The `CreateQuestion` component is designed to read this parameter and pre-populate the form with the selected paper.

### API Calls

*   **Fetch Claimed Papers:**
    *   **Function:** `fetchClaimedPdfs`
    *   **Method:** `GET`
    *   **Endpoint:** `/api/questions/papers/claimed`
    *   **Payload:** None.
    *   **State Handling:** On success, the response data is stored in the `claimedPapers` state. `loading` is set to `false` in the `finally` block.

---

## Backend

**Files:**
*   `backend/src/routes/questionRoutes.js`
*   `backend/src/controllers/questionController.js`

This feature is supported by a single, dedicated backend endpoint.

### Get Claimed Papers

*   **API Endpoint:** `GET /api/questions/papers/claimed`
*   **Responsibility:** To fetch all question papers that have been claimed by the currently authenticated "Maker".

#### Authentication & Authorization

*   **Authentication:** Requires a valid JWT passed in the `Authorization: Bearer <token>` header (handled by the `protect` middleware).
*   **Authorization:** Requires the authenticated user to have the **`MAKER`** role (enforced by the `isMaker` middleware).

#### Request Structure

*   **Headers:**
    *   `Authorization`: `Bearer <jwt_token>` (Required)
*   **Body/Parameters:** None.

#### Business Logic Flow

1.  The `protect` and `isMaker` middlewares validate the user's session and role.
2.  The `getClaimedPapers` controller function is executed.
3.  **Database Interaction:** It performs a `find` query on the `QuestionPaper` collection.
    *   The query filters for documents where the `usedBy` field matches the authenticated user's ID (`req.user._id`).
    *   It uses `.populate("course", "title")` to include the title of the associated course.
    *   It also uses `.populate("uploadedBy", "name")` to include the name of the admin who originally uploaded the paper.
    *   The results are sorted by `updatedAt` in descending order.

#### Response Structure

*   **Success (200 OK):**
    *   An array of question paper objects. Each object contains all fields from the `QuestionPaper` model, including the populated `course` and `uploadedBy` data.
*   **Error Responses:**
    *   **401 Unauthorized:** If the JWT is missing or invalid.
    *   **403 Forbidden:** If the user is not a "MAKER".
    *   **500 Internal Server Error:** If there is a database error during the query.
