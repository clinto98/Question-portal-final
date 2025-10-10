# Checker Review Page Documentation

This document provides a detailed technical breakdown of the "Checker Review" feature, which allows checkers to view, filter, and bulk-approve pending questions.

## Frontend

The frontend is a React component that provides a powerful interface for managing a queue of pending questions, with a focus on bulk actions.

### Component Breakdown

*   **`CheckerReview`**: The main component that fetches pending questions, manages filter and selection states, and orchestrates the review and approval process.
*   **`ConfirmationModal`**: A reusable modal to confirm the bulk approval action.
*   **`NotificationModal`**: A modal to display success or error messages to the user after an action.
*   **`ImageModal`**: A modal to display a larger view of a question's image.
*   **`Loader`**: A standard loading animation component.

### UI/UX Elements and Layout

*   **Header**: Displays the title "Questions for Review" and a live count of the number of questions currently visible after filtering.
*   **Filters**: Dropdown `select` menus to filter the list by Maker and by Course.
*   **Bulk Actions Bar**: Appears when at least one question is selected. It shows the number of selected items and contains the "Approve Selected" button.
*   **Questions Table**: A detailed table of pending questions with the following columns:
    *   A checkbox for selecting the question for bulk actions. The header contains a "Select All" checkbox.
    *   `Question`: A snippet of the question text and a clickable image thumbnail.
    *   `Maker`, `Course`, `Unit`, `Question Paper`: Details about the question's origin.
    *   `Actions`: A "View Details" link that navigates to a separate page for individual review (approve/reject).

### State Management

*   **`questions`**: **Type**: `Array`, **Initial**: `[]`, **Purpose**: Stores the list of pending questions fetched from the API.
*   **`loading` / `isSubmitting`**: **Type**: `Boolean`, **Purpose**: Manage loading states for the initial fetch and for when a bulk action is in progress.
*   **`selectedQuestions`**: **Type**: `Array`, **Initial**: `[]`, **Purpose**: Stores the `_id`s of the questions that have been selected via the checkboxes.
*   **`confirmation` / `notification` / `imageModalSrc`**: State objects to control the visibility and content of the various modals.
*   **`filterMaker` / `filterCourse`**: State strings to hold the current values of the filter dropdowns.

### User Interactions and Event Handling

*   **`useEffect` on Mount**: Fetches the initial list of pending questions.
*   **`onChange` on Filter Dropdowns**: Updates the `filterMaker` or `filterCourse` state, causing the displayed list to be re-filtered.
*   **`onChange` on Checkboxes**: `handleToggleSelect` adds or removes a question ID from the `selectedQuestions` array.
*   **`onChange` on "Select All" Checkbox**: `handleSelectAll` either selects all currently visible (filtered) questions or clears the selection.
*   **`onClick` on "Approve Selected"**: `handleBulkApprove` opens the `ConfirmationModal`.
*   **`onConfirm` in Confirmation Modal**: `proceedWithBulkApprove` is called, which triggers the bulk approve API call.

### API Calls

1.  **Fetch Pending Questions**
    *   **Function**: Called in `useEffect`.
    *   **Details**: `GET /api/checker/questions/pending`. Requires an `Authorization` header.
    *   **State Handling**: Populates the `questions` state on success and hides the main `Loader`.

2.  **Bulk Approve Questions**
    *   **Function**: `proceedWithBulkApprove`.
    *   **Details**: `PUT /api/checker/questions/approve-bulk`. Requires an `Authorization` header.
    *   **Data Payload**: `{ "ids": ["...", "..."] }` - An array of the selected question IDs.
    *   **State Handling**: On success, it removes the approved questions from the local `questions` state, clears the `selectedQuestions` array, and shows a success `NotificationModal`.

---

## Backend

The backend provides a suite of secure, transactional endpoints to manage the checker review workflow.

### 1. Get Pending Questions

*   **API Endpoint**: `GET /api/checker/questions/pending`
*   **Authentication**: Not explicitly protected in the router, but the frontend sends a token.
*   **Business Logic**: Fetches all documents from the `Question` collection with `status: "Pending"`. It populates the `maker`, `course`, and `questionPaper` fields and sorts the results by newest first.
*   **Response**: `200 OK` with an array of question objects.

### 2. Approve Single Question

*   **API Endpoint**: `PUT /api/checker/questions/:id/approve`
*   **Authentication**: Requires authenticated user (`protect` middleware).
*   **Business Logic**: A transactional operation.
    1.  Finds the question by `id`.
    2.  If the question was a resubmission after a rejection, it logs a "false rejection" against the original checker.
    3.  Updates the question's status to `"Approved"` and sets the `checkedBy` field to the current checker.
    4.  If the question was not previously approved, it increments the `approvedQuestionCount` on the parent `QuestionPaper`.
    5.  Logs the approval action in the `checkeracceptedquestion` array for the current checker and the `makeracceptedquestions` array for the maker.
    6.  Commits the transaction.
*   **Response**: `200 OK` with the updated question object. On failure, rolls back the transaction and returns a `404` or `500` error.

### 3. Reject Single Question

*   **API Endpoint**: `PUT /api/checker/questions/:id/reject`
*   **Authentication**: Requires authenticated user (`protect` middleware).
*   **Request Body**: `{ "comments": "string" }` (Required).
*   **Business Logic**: A transactional operation.
    1.  Validates that `comments` are provided.
    2.  Finds the question by `id`.
    3.  Updates the status to `"Rejected"` and saves the `checkerComments` and `checkedBy` ID.
    4.  If the question was previously `Approved`, it decrements the `approvedQuestionCount` on the parent `QuestionPaper`.
    5.  Logs the rejection action for both the checker and the maker.
    6.  Commits the transaction.
*   **Response**: `200 OK` with the updated question object. On failure, rolls back and returns a `400`, `404`, or `500` error.

### 4. Bulk Approve Questions

*   **API Endpoint**: `PUT /api/checker/questions/approve-bulk`
*   **Authentication**: Requires authenticated user (`protect` middleware).
*   **Request Body**: `{ "ids": ["id1", "id2", ...] }` (Required).
*   **Business Logic**: A large, complex transactional operation.
    1.  Validates that `ids` is a non-empty array.
    2.  Finds all questions matching the IDs with a `status` of `"Pending"`.
    3.  Performs a single `updateMany` operation to change the status of all found questions to `"Approved"`.
    4.  Calculates how many questions belong to each unique `QuestionPaper` and creates promises to increment the `approvedQuestionCount` for each paper.
    5.  Creates promises to log the approval action for the current checker and for every unique maker involved.
    6.  Handles "false rejection" logging for any questions that apply.
    7.  Executes all logging and count-incrementing promises concurrently using `Promise.all`.
    8.  Commits the transaction.
*   **Response**: `200 OK` with a success message. On failure, rolls back and returns a `400`, `404`, or `500` error.
