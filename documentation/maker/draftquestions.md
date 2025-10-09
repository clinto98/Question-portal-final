# Feature: Maker's Draft Questions Management

This document provides a detailed technical breakdown of the feature that allows users with the "Maker" role to view, manage, and submit their draft multiple-choice questions.

## Frontend

**File:** `frontend/src/pages/maker/DraftQuestions.jsx`

This file contains the main React component for the "My Drafts" page.

### Component Breakdown

*   **`DraftQuestions` (Main Component):** The primary component that orchestrates the entire page, including fetching data, managing state, and handling user interactions.
*   **`ContentDisplay` (Helper Component):** A reusable functional component responsible for rendering the question content. It can display text, an image, or both. If a question has no content, it displays "Untitled Question".
*   **`Loader`:** A standard component imported from `../../components/Loader` that displays a loading animation while data is being fetched from the backend.

### UI/UX Elements and Layout

The page has a clean, modern layout built with Tailwind CSS.

*   **Main Container:** A `div` with a light gray background (`bg-gray-50`) that spans the minimum height of the screen.
*   **Header Section:**
    *   A white, rounded card containing the page title and primary action button.
    *   **Title:** An `h1` tag with the text "My Drafts".
    *   **Create New Question Button:** A blue button that, when clicked, navigates the user to the question creation page (`/maker/create`).
    *   **Search Input:** A full-width text input field that allows users to filter the drafts list. The placeholder text is "Search by text, subject, or chapter...".
*   **Bulk Actions Bar:**
    *   This bar appears only when at least one draft question is selected.
    *   **Select All Checkbox:** An `input` of type `checkbox` that allows the user to select or deselect all visible drafts.
    *   **Selection Counter:** A label indicating the number of items selected (e.g., "3 item(s) selected").
    *   **Delete Selected Button:** A red button to permanently delete all selected drafts.
    *   **Submit for Approval Button:** A blue button to submit all selected drafts for review by a "Checker".
*   **Drafts Table:**
    *   If data is loading, the `Loader` component is displayed.
    *   If there are no drafts (or no search results), a message is displayed ("You have no saved drafts." or "No drafts match your search.").
    *   If drafts exist, they are rendered in a `table` with the following columns:
        *   **Checkbox:** For selecting individual rows.
        *   **Question:** The content of the question (text and/or image), rendered by `ContentDisplay`.
        *   **Course:** The title of the course the question belongs to.
        *   **Subject:** The subject of the question.
        *   **Last Updated:** The date the draft was last modified.
        *   **Actions:** Contains an "Edit" button that navigates the user to the edit page for that specific question (`/maker/create/:id`).

### State Management

The component uses React's `useState` hook for all state management.

*   **`drafts`**:
    *   **Type:** `Array`
    *   **Initial Value:** `[]`
    *   **Purpose:** Stores the list of draft question objects fetched from the backend.
*   **`loading`**:
    *   **Type:** `Boolean`
    *   **Initial Value:** `true`
    *   **Purpose:** Tracks the loading state of the initial data fetch. It is `true` while the API call is in progress and `false` once it completes (either successfully or with an error).
*   **`selected`**:
    *   **Type:** `Array`
    *   **Initial Value:** `[]`
    *   **Purpose:** Stores the `_id`s of the draft questions that the user has selected via the checkboxes.
*   **`search`**:
    *   **Type:** `String`
    *   **Initial Value:** `""`
    *   **Purpose:** Stores the current value of the search input field. This state is used to filter the `drafts` array.

### User Interactions and Event Handling

*   **Fetching Drafts:**
    *   An `useEffect` hook runs once when the component mounts.
    *   It calls the `fetchDrafts` asynchronous function, which sends a GET request to the backend to retrieve the user's drafts.
*   **Searching:**
    *   The `onChange` event of the search input is tied to `setSearch`, updating the `search` state on every keystroke.
    *   A derived variable, `filteredDrafts`, is computed by filtering the `drafts` array based on the `search` term. The filter checks for matches in the question text, subject, and chapter (case-insensitive).
*   **Selecting a Single Draft:**
    *   `handleSelect(id)`: Triggered by the `onChange` event on each row's checkbox. It adds or removes a question's `_id` from the `selected` state array.
*   **Selecting All Drafts:**
    *   `handleSelectAll()`: Triggered by the `onChange` event on the main checkbox in the header and the bulk actions bar. It either selects all currently filtered drafts or clears the selection.
*   **Submitting for Approval:**
    *   `handleSubmitForApproval()`: Triggered by the `onClick` event on the "Submit for Approval" button.
    *   It first shows a `window.confirm` dialog to prevent accidental submission.
    *   If confirmed, it sends a `PUT` request to the backend with the `ids` of the selected questions.
    *   On success, it removes the submitted questions from the local `drafts` state, clears the `selected` state, and shows a success alert.
*   **Deleting Selected Drafts:**
    *   `handleDeleteSelected()`: Triggered by the `onClick` event on the "Delete Selected" button.
    *   It shows a `window.confirm` dialog for confirmation.
    *   If confirmed, it sends a `DELETE` request to the backend with the `ids` of the selected questions in the request body.
    *   On success, it filters the deleted questions out of the local `drafts` state and clears the `selected` state.
*   **Navigation:**
    *   The `useNavigate` hook from `react-router-dom` is used for programmatic navigation.
    *   Clicking "+ Create New Question" navigates to `/maker/create`.
    *   Clicking "Edit" on a draft navigates to `/maker/create/:id`.

### Client-Side Validation

*   The component does not have complex form validation.
*   It uses the browser's built-in `window.confirm()` method as a simple validation step to ensure the user intends to perform a bulk submission or deletion, displaying the number of selected items in the confirmation message.

### API Calls

All API calls are made using `axios` and require a JWT token for authorization, which is retrieved from `localStorage`.

*   **Fetch Drafts:**
    *   **Function:** `fetchDrafts` (inside `useEffect`)
    *   **Method:** `GET`
    *   **Endpoint:** `/api/questions/drafts`
    *   **Payload:** None.
    *   **State Handling:** Sets `loading` to `false` in the `finally` block. Errors are logged to the console.
*   **Submit for Approval:**
    *   **Function:** `handleSubmitForApproval`
    *   **Method:** `PUT`
    *   **Endpoint:** `/api/questions/submit`
    *   **Payload:** `{ ids: selected }` where `selected` is an array of question IDs.
    *   **State Handling:** On success, updates `drafts` and `selected` state. On failure, logs the error and shows an alert.
*   **Delete Selected:**
    *   **Function:** `handleDeleteSelected`
    *   **Method:** `DELETE`
    *   **Endpoint:** `/api/questions/delete`
    *   **Payload:** The `axios.delete` call includes a `data` property in its config: `{ data: { ids: selected } }`.
    *   **State Handling:** On success, updates `drafts` and `selected` state. On failure, logs the error.

---

## Backend

**Files:**
*   `backend/src/routes/questionRoutes.js`
*   `backend/src/controllers/questionController.js`

This section details the three backend API endpoints that the `DraftQuestions.jsx` frontend component interacts with.

### 1. Get Draft Questions

*   **API Endpoint:** `GET /api/questions/drafts`
*   **Responsibility:** To fetch all questions created by the currently authenticated "Maker" that have a status of "draft".

#### Authentication & Authorization

*   **Authentication:** Requires a valid JWT passed in the `Authorization: Bearer <token>` header. This is handled by the `protect` middleware.
*   **Authorization:** Requires the authenticated user to have the **`MAKER`** role. This is enforced by the `isMaker` middleware.

#### Request Structure

*   **Headers:**
    *   `Authorization`: `Bearer <jwt_token>` (Required)
*   **Body/Parameters:** None.

#### Business Logic Flow

1.  The `protect` middleware verifies the JWT and attaches the user's data (including their ID and role) to the `req` object.
2.  The `isMaker` middleware checks if `req.user.role` is "MAKER". If not, it returns a `403 Forbidden` error.
3.  The `getDraftQuestions` controller function is executed.
4.  **Database Interaction:** It performs a `find` query on the `Question` collection.
    *   The query filters for documents where `createdBy` matches the authenticated user's ID (`req.user.id`) and `status` is exactly `"draft"`.
    *   It populates the `course` field to include the course title.
    *   The results are sorted by `updatedAt` in descending order.
5.  The found documents are sent back in the response.

#### Response Structure

*   **Success (200 OK):**
    *   An array of question objects. Each object has the full schema of the `Question` model, including fields like `_id`, `question`, `options`, `course`, `subject`, `status`, `createdAt`, and `updatedAt`.
*   **Error Responses:**
    *   **401 Unauthorized:** If the JWT is missing or invalid.
    *   **403 Forbidden:** If the user is not a "MAKER".
    *   **500 Internal Server Error:** If there is a database error during the query. The response body is `{ message: "Server Error" }`.

### 2. Submit Drafts for Approval

*   **API Endpoint:** `PUT /api/questions/submit`
*   **Responsibility:** To change the status of one or more draft questions from "draft" to "submitted".

#### Authentication & Authorization

*   **Authentication:** Requires a valid JWT (`protect` middleware).
*   **Authorization:** Requires the **`MAKER`** role (`isMaker` middleware).

#### Request Structure

*   **Headers:**
    *   `Content-Type`: `application/json`
    *   `Authorization`: `Bearer <jwt_token>` (Required)
*   **Body:**
    ```json
    {
      "ids": ["<questionId1>", "<questionId2>"]
    }
    ```
    *   `ids`: (Array of Strings, Required) - An array of MongoDB ObjectIDs for the questions to be submitted.

#### Business Logic Flow

1.  Middleware (`protect`, `isMaker`) runs as described above.
2.  The `submitDraftsForApproval` controller function is executed.
3.  **Validation:** It checks if the `ids` array exists and is not empty. If not, it returns a `400 Bad Request`.
4.  **Database Interaction:** It performs an `updateMany` operation on the `Question` collection.
    *   **Filter:** It finds documents where the `_id` is in the provided `ids` array (`$in: ids`) AND the `createdBy` field matches the authenticated user's ID. This ensures a maker can only submit their own questions.
    *   **Update:** It sets the `status` field to `"submitted"`.
5.  The controller checks the `modifiedCount` from the database response to see how many documents were updated.

#### Response Structure

*   **Success (200 OK):**
    ```json
    {
      "message": "X questions submitted for approval"
    }
    ```
*   **Error Responses:**
    *   **400 Bad Request:** If `ids` is not provided or is an empty array. Response: `{ message: "Question IDs are required" }`.
    *   **404 Not Found:** If no questions were found matching the criteria (e.g., wrong IDs or not owned by the user). Response: `{ message: "No matching drafts found to submit" }`.
    *   **500 Internal Server Error:** For any other database or server-side failures.

### 3. Delete Drafts

*   **API Endpoint:** `DELETE /api/questions/delete`
*   **Responsibility:** To permanently delete one or more draft questions.

#### Authentication & Authorization

*   **Authentication:** Requires a valid JWT (`protect` middleware).
*   **Authorization:** Requires the **`MAKER`** role (`isMaker` middleware).

#### Request Structure

*   **Headers:**
    *   `Content-Type`: `application/json`
    *   `Authorization`: `Bearer <jwt_token>` (Required)
*   **Body:**
    ```json
    {
      "ids": ["<questionId1>", "<questionId2>"]
    }
    ```
    *   `ids`: (Array of Strings, Required) - An array of MongoDB ObjectIDs for the questions to be deleted.

#### Business Logic Flow

1.  Middleware (`protect`, `isMaker`) runs as described above.
2.  The `deleteDrafts` controller function is executed.
3.  **Validation:** It checks if the `ids` array is provided and is not empty. If not, it returns a `400 Bad Request`.
4.  **Database Interaction:** It performs a `deleteMany` operation on the `Question` collection.
    *   **Filter:** It finds documents where the `_id` is in the provided `ids` array (`$in: ids`) AND the `createdBy` field matches the authenticated user's ID. This is a critical security measure to prevent a user from deleting another user's questions.
5.  The controller checks the `deletedCount` from the database response.

#### Response Structure

*   **Success (200 OK):**
    ```json
    {
      "message": "X drafts deleted successfully"
    }
    ```
*   **Error Responses:**
    *   **400 Bad Request:** If `ids` is not provided or is an empty array. Response: `{ message: "Question IDs are required" }`.
    *   **404 Not Found:** If no questions were found matching the criteria to delete. Response: `{ message: "No matching drafts found to delete" }`.
    *   **500 Internal Server Error:** For any other database or server-side failures.
