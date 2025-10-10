# Question Detail Page Documentation (Checker)

This document provides a detailed technical breakdown of the "Question Detail Page" feature for the Checker role, which is the primary interface for individually reviewing, approving, and rejecting questions.

## Frontend

The frontend is a comprehensive, single-page interface designed to give the checker all possible information about a question in a structured, two-column layout with collapsible sections.

### Component Breakdown

*   **`QuestionDetailPage`**: The main component that fetches the question data, manages the layout, and handles all review actions.
*   **`AccordionSection`**: A reusable component that displays a collapsible section with a title. Used to organize the vast amount of question data.
*   **`DetailItem`**: A small component for displaying a label and its corresponding value.
*   **`StatusBadge`**: A component to show the question's current status (Pending, Approved, Rejected) with a colored badge.
*   **`ConfirmationModal` / `NotificationModal`**: Modals for confirming actions and notifying the user of the outcome.
*   **`FullscreenImage`**: A modal for displaying any of the question's images in a larger, fullscreen view.
*   **`Loader`**: A standard loading animation.

### UI/UX Elements and Layout

*   **Layout**: A two-column grid on large screens. The right column contains the main, scrollable content, while the left column has a `sticky` sidebar for displaying reference images, keeping them in view as the checker scrolls.
*   **Accordion UI**: The main content is organized into several `AccordionSection` components (e.g., "Question Overview", "Metadata", "Question", "Options") that can be expanded or collapsed.
*   **Question Display**: All parts of the question are displayed, including text, images, options (with the correct answer highlighted), and the explanation.
*   **Metadata**: Shows all associated metadata, such as course, subject, unit, complexity, and keywords.
*   **Source PDFs**: Provides buttons to open the source Question PDF and Solution PDF in a new tab.
*   **Action Panel**: If the question status is `Pending`, a final accordion section for "Actions" is displayed, containing:
    *   A `textarea` for rejection comments.
    *   A "Reject" button.
    *   An "Approve" button.

### State Management

*   **`question`**: **Type**: `Object | null`, **Initial**: `null`, **Purpose**: Stores the complete, detailed question object fetched from the API.
*   **`loading` / `isSubmitting`**: **Type**: `Boolean`, **Purpose**: Manage loading states for the initial fetch and for when an approve/reject action is in progress.
*   **`error`**: **Type**: `String | null`, **Purpose**: Stores an error message if the initial fetch fails.
*   **`comment`**: **Type**: `String`, **Initial**: `""`, **Purpose**: Holds the text entered into the rejection comment `textarea`.
*   **`openSections`**: **Type**: `Object`, **Purpose**: An object that tracks the open/closed state of each `AccordionSection`.
*   **`confirmation` / `notification` / `fullscreenImage`**: State objects to control the various modals.

### User Interactions and Event Handling

*   **`useEffect` on Mount**: Fetches the question details based on the `id` from the URL parameters.
*   **`onClick` on Accordion Header**: `handleToggleSection` flips the boolean value for that section in the `openSections` state, expanding or collapsing it.
*   **`onClick` on Images**: Sets the `fullscreenImage` state to the clicked image's URL, opening the fullscreen modal.
*   **`onClick` on "Approve" Button**: `onApprove` opens the `ConfirmationModal` with an approval message and sets its `onConfirm` callback to `handleAction("approve")`.
*   **`onClick` on "Reject" Button**: `onReject` first validates that the `comment` textarea is not empty. If it is, a notification is shown. If not, it opens the `ConfirmationModal` with a rejection message and sets its `onConfirm` callback to `handleAction("reject")`.
*   **`onConfirm` in Confirmation Modal**: The `handleAction` function is called, which triggers the appropriate API request.

### API Calls

1.  **Fetch Question Details**
    *   **Function**: Called in `useEffect`.
    *   **Details**: `GET /api/checker/questions/:id`. Requires an `Authorization` header.
    *   **State Handling**: Populates the `question` state on success or sets the `error` state on failure.

2.  **Approve/Reject Question**
    *   **Function**: `handleAction(action)` where `action` is `"approve"` or `"reject"`.
    *   **Details**: `PUT /api/checker/questions/:id/approve` or `PUT /api/checker/questions/:id/reject`. Requires an `Authorization` header.
    *   **Data Payload**: For rejection, the payload is `{ "comments": "..." }`. For approval, the payload is empty.
    *   **State Handling**: On success or failure, it shows a `NotificationModal` with the result. On success, the user is navigated back to the previous page after closing the modal.

---

## Backend

The backend provides the API endpoints necessary for a detailed review workflow, including fetching a fully populated question object and handling the transactional state changes for approval and rejection.

### 1. Get Question By ID

*   **API Endpoint**: `GET /api/checker/questions/:id`
*   **Authentication & Authorization**: Requires an authenticated user with either a `"checker"` or `"admin"` role.
*   **Business Logic**: 
    1.  Finds a single document in the `Question` collection by its `_id`.
    2.  Uses multiple `.populate()` calls to enrich the document with data from other collections, including the maker's name, the checker's name (if reviewed), the course title, and the question paper's name and file URLs.
*   **Response**: `200 OK` with the complete, populated question object. `404 Not Found` if the ID is not found.

### 2. Approve Question

*   **API Endpoint**: `PUT /api/checker/questions/:id/approve`
*   **Authentication**: Requires authenticated user (`protect` middleware).
*   **Business Logic**: A transactional operation.
    1.  Finds the question by `id`.
    2.  If the question was a resubmission, it logs a "false rejection" against the original checker.
    3.  Updates the question's status to `"Approved"` and sets `checkedBy`.
    4.  Increments the `approvedQuestionCount` on the parent `QuestionPaper`.
    5.  Logs the approval action for both the checker and the maker.
    6.  Commits the transaction.
*   **Response**: `200 OK` with the updated question object. On failure, rolls back and returns an error.

### 3. Reject Question

*   **API Endpoint**: `PUT /api/checker/questions/:id/reject`
*   **Authentication**: Requires authenticated user (`protect` middleware).
*   **Request Body**: `{ "comments": "string" }` (Required).
*   **Business Logic**: A transactional operation.
    1.  Validates that `comments` are provided.
    2.  Updates the status to `"Rejected"` and saves the `checkerComments` and `checkedBy` ID.
    3.  If the question was previously `Approved`, it decrements the `approvedQuestionCount` on the parent `QuestionPaper`.
    4.  Logs the rejection action for both the checker and the maker.
    5.  Commits the transaction.
*   **Response**: `200 OK` with the updated question object. On failure, rolls back and returns an error.
