# Feature: Available Question Papers Page

This document provides a detailed technical breakdown of the feature that allows users with the "Maker" role to view and claim available question papers to work on.

## Frontend

**File:** `frontend/src/pages/maker/AvailablePdfsPage.jsx`

This file contains the React component for the "Available Question Papers" page.

### Component Breakdown

*   **`AvailablePdfsPage` (Main Component):** The primary component that fetches the list of available papers, displays them, and handles the claiming action.
*   **`Loader`:** A standard component that displays a loading animation while data is being fetched.

### UI/UX Elements and Layout

The page is centered around a table displaying all unclaimed question papers.

*   **Header:** A section with the title "Available Question Papers", a descriptive paragraph, and a search input.
*   **Search Input:** A text field allowing the user to filter the list by paper name, course, or subject.
*   **Papers Table:** A table that lists all available papers with the following columns:
    *   Paper Name, Course, Subject, Year.
    *   **Progress:** A ratio of approved vs. required questions.
    *   **Question PDF & Solution PDF:** "View" buttons that link to the respective PDF files.
    *   **Actions:** Contains the "Take Paper" button.
*   **Empty State:** If no papers are available or a search returns no results, a message is shown.

### State Management

The component uses the `useState` hook for all state.

*   **`papers`**:
    *   **Type:** `Array`
    *   **Initial Value:** `[]`
    *   **Purpose:** Stores the list of available question paper objects.
*   **`loading`**:
    *   **Type:** `Boolean`
    *   **Initial Value:** `true`
    *   **Purpose:** Tracks the loading state of the initial data fetch.
*   **`searchTerm`**:
    *   **Type:** `String`
    *   **Initial Value:** `""`
    *   **Purpose:** Stores the value of the search input for filtering.
*   **`actionInProgress`**:
    *   **Type:** `String | null`
    *   **Initial Value:** `null`
    *   **Purpose:** Stores the `_id` of the paper currently being claimed. This is used to disable the specific button that was clicked and show a "Taking..." message, preventing duplicate requests.

### User Interactions and Event Handling

*   **Fetching Data:** An `useEffect` hook calls `fetchAvailablePdfs` on component mount to get the list of papers.
*   **Searching:** The `onChange` event of the search input updates the `searchTerm` state, which filters the displayed list.
*   **Claiming a Paper (`handleTakePdf`):**
    *   Triggered by the "Take Paper" button.
    *   It first shows a `window.confirm` dialog to ensure the user wants to proceed.
    *   It sets `actionInProgress` to the ID of the paper being claimed.
    *   It makes a `PUT` request to the claim endpoint.
    *   **On Success:** It shows a success alert and navigates the user to the `/maker/create` page, encouraging them to start working immediately.
    *   **On Failure:** It shows an alert with the error from the server (e.g., "This paper is no longer available"). It then re-fetches the list of available papers to ensure the UI reflects the latest state.

### API Calls

*   **Fetch Available Papers:**
    *   **Function:** `fetchAvailablePdfs`
    *   **Method:** `GET`
    *   **Endpoint:** `/api/questions/available`
*   **Claim a Paper:**
    *   **Function:** `handleTakePdf`
    *   **Method:** `PUT`
    *   **Endpoint:** `/api/questions/papers/:id/claim`

---

## Backend

**Files:**
*   `backend/src/routes/questionRoutes.js`
*   `backend/src/controllers/questionController.js`

This feature is supported by two dedicated backend endpoints for fetching and claiming papers.

### 1. Get Available Papers

*   **API Endpoint:** `GET /api/questions/available`
*   **Responsibility:** To fetch all question papers that have not yet been claimed by any maker.

#### Authentication & Authorization

*   **Authentication:** Requires a valid JWT (`protect` middleware).
*   **Authorization:** Requires the **`MAKER`** role (`isMaker` middleware).

#### Business Logic Flow

1.  Middleware validates the user's session and role.
2.  The `getAvailablePapers` controller function is executed.
3.  **Database Interaction:** It performs a `find` query on the `QuestionPaper` collection.
    *   The query filters for documents where the `usedBy` field is `null`.
    *   It populates the `course` and `uploadedBy` fields to provide more context.
    *   Results are sorted to show the newest papers first.

#### Response Structure

*   **Success (200 OK):** An array of available question paper objects.
*   **Error Responses:** 401, 403, or 500 for auth or server errors.

### 2. Claim a Paper

*   **API Endpoint:** `PUT /api/questions/papers/:id/claim`
*   **Responsibility:** To assign an available paper to the currently authenticated maker, preventing others from claiming it.

#### Authentication & Authorization

*   **Authentication:** Requires a valid JWT (`protect` middleware).
*   **Authorization:** Requires the **`MAKER`** role (`isMaker` middleware).

#### Request Structure

*   **Parameters:** The `id` of the `QuestionPaper` to claim is passed in the URL.
*   **Body:** None.

#### Business Logic Flow

1.  Middleware validates the user's session and role.
2.  The `claimPaper` controller function is executed.
3.  **Database Interaction (Atomic Operation):** The logic is designed to be atomic and prevent race conditions.
    *   It uses `QuestionPaper.findOneAndUpdate()` to find a document that matches **two conditions simultaneously**: the `_id` from the URL parameter AND a `usedBy` field that is still `null`.
    *   If a match is found, it atomically sets the `usedBy` field to the current maker's ID (`req.user._id`).
4.  **Race Condition Handling:**
    *   If the `findOneAndUpdate` operation returns a document, the claim was successful.
    *   If it returns `null`, it means another maker claimed the paper in the moments between the page load and the button click. The backend then returns a `409 Conflict` error.

#### Response Structure

*   **Success (200 OK):**
    ```json
    {
      "success": true,
      "message": "Paper successfully assigned to you.",
      "paper": { ... } // The updated paper object
    }
    ```
*   **Error Responses:**
    *   **409 Conflict:** If the paper was already claimed by another user. The message informs the user of this specific situation.
    *   **500 Internal Server Error:** For any other database or server-side failures.
