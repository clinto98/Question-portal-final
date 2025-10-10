# PDF List Page Feature Documentation

This document provides a detailed technical breakdown of the "PDF List Page" feature, which allows administrators to view, filter, and delete all uploaded question papers in the system.

## Frontend

The frontend is a comprehensive React component that displays a list of all uploaded PDFs, provides filtering capabilities, and allows for deletion of items.

### Component Breakdown

*   **`PdfListPage`**: The main component that fetches and displays the list of PDFs, manages filter states, and handles the deletion workflow.
*   **`ConfirmationModal`**: A reusable modal component that prompts the user for confirmation before a destructive action (like deletion).
*   **`NotificationModal`**: A reusable modal to display success or error messages to the user after an action is performed.
*   **`StatusBadge`**: A small, stateless component that displays a colored badge indicating if a PDF is "Available" or "Claimed".
*   **`EyeIcon` / `TrashIcon`**: Inline SVG components for icons used in buttons.

### UI/UX Elements and Layout

*   **Header**: A main title ("Uploaded Question Papers") and a descriptive subtitle.
*   **Filters**: A set of controls to filter the list of PDFs:
    *   A text `input` to search by paper name.
    *   A `select` dropdown to filter by Course.
    *   A `select` dropdown to filter by Subject.
    *   A `select` dropdown to filter by Year.
*   **PDF Table**: A detailed table displaying the list of PDFs with the following columns:
    *   Paper Name, Course, Subject, Year.
    *   Links to view the Question Paper and Solution Paper (if available) in a new tab.
    *   A `StatusBadge` showing if the paper is claimed.
    *   The name of the Maker who claimed the paper.
    *   An "Actions" column with a delete button (`TrashIcon`).
*   **Modals**: The UI makes extensive use of modals for a clean user experience:
    *   A confirmation modal appears when the delete button is clicked.
    *   A notification modal appears after the delete operation is complete to inform the user of the result.

### State Management

The component uses `useState` for all state management.

*   **`pdfs`**: **Type**: `Array`, **Initial**: `[]`, **Purpose**: Stores the complete list of PDF objects fetched from the server.
*   **`loading`**: **Type**: `Boolean`, **Initial**: `true`, **Purpose**: Controls the display of the `Loader` component.
*   **`searchTerm`, `filterCourse`, `filterSubject`, `filterYear`**: **Type**: `String`, **Purpose**: Store the current values of the respective filter controls.
*   **`confirmation`**: **Type**: `Object`, **Purpose**: Manages the state of the `ConfirmationModal`, including its visibility (`isOpen`), message, and the callback function to execute (`onConfirm`).
*   **`notification`**: **Type**: `Object`, **Purpose**: Manages the state of the `NotificationModal`, including its visibility, message, and whether it represents an error (`isError`).

### User Interactions and Event Handling

*   **`onChange` on Filter Inputs**: Updates the corresponding state variable (`searchTerm`, `filterCourse`, etc.), which causes the `filteredPdfs` array to be re-calculated and the displayed list to update.
*   **`onClick` on Delete Button**:
    *   **Handler**: `handleDelete(pdf._id)`
    *   **Action**: Does not immediately delete. Instead, it opens the `ConfirmationModal` by setting the `confirmation` state with the appropriate message and an `onConfirm` callback that points to `proceedWithDelete(pdf._id)`.
*   **`onConfirm` in Confirmation Modal**:
    *   **Handler**: `proceedWithDelete(id)`
    *   **Action**: This function is called when the user confirms the deletion. It makes the `DELETE` API request to the backend.

### API Calls

1.  **Fetch All PDFs**
    *   **Function**: `fetchPdfs` (called in a `useEffect` hook on component mount).
    *   **Details**:
        *   **HTTP Method**: `GET`
        *   **API Endpoint URL**: `http://localhost:5000/api/admin/pdfs`
        *   **Headers**: Requires an `Authorization: Bearer <token>` header.
    *   **State Handling**: On success, updates the `pdfs` state. On error, it opens the `NotificationModal` with an error message.

2.  **Delete a PDF**
    *   **Function**: `proceedWithDelete(id)`
    *   **Details**:
        *   **HTTP Method**: `DELETE`
        *   **API Endpoint URL**: `http://localhost:5000/api/admin/pdfs/:id` (e.g., `/api/admin/pdfs/60d5f2b9c3b3c3b3c3b3c3b3`)
        *   **Headers**: Requires an `Authorization: Bearer <token>` header.
    *   **State Handling**: After the request completes, it closes the confirmation modal and opens the `NotificationModal` with a success or failure message. If successful, it calls `fetchPdfs()` again to refresh the list.

---

## Backend

The backend provides two endpoints to support the PDF List Page: one to fetch all PDF data and another to handle the complex deletion process.

### 1. Get All PDFs

*   **API Endpoint**: `GET /api/admin/pdfs`
*   **Authentication & Authorization**: Requires an authenticated admin user.
*   **Business Logic Flow**:
    1.  Queries the `QuestionPaper` collection for all documents.
    2.  Uses `.populate('usedBy', 'name')` to include the name of the maker who has claimed the paper.
    3.  Uses `.populate('course', 'title')` to include the title of the associated course.
    4.  Sorts the results by creation date in descending order.
    5.  Returns the resulting array of documents.
*   **Response Structure**:
    *   **Success (`200 OK`)**: `{"success": true, "files": [ ... ]}` where `files` is an array of question paper objects.
    *   **Error (`500 Server Error`)**: `{"success": false, "error": "..."}`

### 2. Delete PDF

*   **API Endpoint**: `DELETE /api/admin/pdfs/:id`
*   **Authentication & Authorization**: Requires an authenticated admin user.
*   **Request Structure**: The `id` of the `QuestionPaper` to be deleted is passed as a URL parameter.
*   **Business Logic Flow**: This entire process is wrapped in a **MongoDB transaction** to ensure data integrity. If any step fails, all previous steps in the transaction are rolled back.
    1.  **Start Transaction**: A new database session and transaction are started.
    2.  **Find Document**: The `QuestionPaper` document is found by its `id` within the transaction.
    3.  **Delete Cloudinary Files**: The `publicId` for both the `questionPaperFile` and `solutionPaperFile` (if it exists) are collected. `cloudinary.uploader.destroy` is called for each to delete the files from cloud storage.
    4.  **Delete Associated Questions**: Critically, the system runs `Question.deleteMany({ questionPaper: id })` to delete all question documents in the `questions` collection that are linked to this paper, preventing orphaned data.
    5.  **Delete DB Record**: `QuestionPaper.findByIdAndDelete(id)` is called to remove the main document from the database.
    6.  **Commit Transaction**: If all previous steps succeed, the transaction is committed, making the changes permanent.
*   **Response Structure**:
    *   **Success (`200 OK`)**: `{"success": true, "message": "Question Paper and all associated questions deleted successfully."}`
    *   **Error (`404 Not Found`)**: If the PDF `id` does not exist.
    *   **Error (`500 Server Error`)**: If any step in the transaction fails. The response message will indicate that the operation was rolled back.
