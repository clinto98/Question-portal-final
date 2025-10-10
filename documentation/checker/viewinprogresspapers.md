# View In-Progress Papers Documentation (Checker)

This document provides a detailed technical breakdown of the feature that allows Checkers to view a list of all source question papers that are currently claimed and being worked on by Makers. Note that the component file for this feature is misleadingly named `ShowQuestionPaper.jsx`.

## Frontend

The frontend is a React component that fetches and displays a filterable list of all question paper PDFs that are currently in progress.

### Component Breakdown

*   **`ShowQuestionPaper`**: The main component that fetches the list of claimed papers, manages the search filter state, and renders the data in a table.
*   **`Loader`**: A standard component to show a loading animation while the initial data is being fetched.

### UI/UX Elements and Layout

*   **Header**: A title "In-Progress Question Papers" and a descriptive subtitle.
*   **Search Filter**: A text `input` that allows the user to filter the list of papers by name in real-time.
*   **Papers Table**: A table that displays the filtered list of papers with the following columns:
    *   `Paper Name`: The name of the source question paper document.
    *   `Claimed By (Maker)`: The name of the Maker who has claimed the paper.
    *   `Claimed Date`: The date the paper was last updated (which corresponds to the claim date).
    *   `View Files`: A column containing buttons that link to the source PDF files. It provides separate links for the "Question" PDF and the "Solution" PDF (if available), which open in a new tab.
*   **Empty State**: If no papers are currently claimed or if no papers match the search term, a message is displayed in the table body.

### State Management

*   **`claimedPapers`**: **Type**: `Array`, **Initial**: `[]`, **Purpose**: Stores the full, unfiltered list of claimed paper objects fetched from the API.
*   **`loading`**: **Type**: `Boolean`, **Initial**: `true`, **Purpose**: Controls the visibility of the `Loader` component.
*   **`searchTerm`**: **Type**: `String`, **Initial**: `""`, **Purpose**: Stores the current value of the search input field. Changes to this state trigger a client-side filtering of the `claimedPapers` array.

### User Interactions and Event Handling

*   **`useEffect` on Mount**: Calls an async function `fetchClaimedPdfs` to load the initial list of papers from the API.
*   **`onChange` on Search Input**: Updates the `searchTerm` state, which causes the `filteredPapers` array to be re-calculated and the displayed table to update instantly.
*   **`onClick` on View File Links**: These are standard anchor (`<a>`) tags that open the PDF URL in a new browser tab.

### API Calls

*   **Fetch Claimed Papers**
    *   **Function**: `fetchClaimedPdfs` (called inside `useEffect`)
    *   **Details**:
        *   **HTTP Method**: `GET`
        *   **API Endpoint URL**: `http://localhost:5000/api/checker/papers/claimed`
        *   **Headers**: Requires an `Authorization: Bearer <token>` header.
    *   **State Handling**: On success, the `claimedPapers` state is updated with the array of paper objects from the response. On failure, an `alert` is shown. `setLoading(false)` is called in the `finally` block.

---

## Backend

The backend provides a secure endpoint for Checkers to get a list of all question papers that are currently being worked on by Makers.

### API Endpoint

*   **Endpoint**: `GET /api/checker/papers/claimed`
*   **Responsibility**: To retrieve all `QuestionPaper` documents from the database that have been claimed by a Maker.

### Authentication & Authorization

*   **Authentication**: Requires an authenticated user (`protect` middleware).
*   **Authorization**: Requires the user to have the `"checker"` role (`authorize('checker')` middleware).

### Request Structure

*   **Headers**: `Authorization: Bearer <jwt_token>` (Required).
*   **Body**: None.

### Business Logic Flow

1.  **Database Query**: The controller executes a `QuestionPaper.find()` query.
2.  **Filtering**: The query specifically filters for documents where the `usedBy` field is not null (`{ usedBy: { $ne: null } }`). This effectively finds all papers that have been assigned to a Maker.
3.  **Data Population**: The query is chained with `.populate("usedBy", "name")`. This tells Mongoose to replace the Maker's `ObjectId` in the `usedBy` field with the `name` from the corresponding document in the `makers` collection.
4.  **Sorting**: The results are sorted by the `updatedAt` field in descending order, so the most recently claimed papers appear first.
5.  **Response**: The final array of populated question paper documents is sent back as the JSON response.

### Response Structure

*   **Success Response (`200 OK`)**:
    *   **Body**: An array of question paper objects. Each object includes all fields from the `QuestionPaper` schema, with the `usedBy` field expanded to an object containing the Maker's name.
        ```json
        [
          {
            "_id": "...",
            "name": "Physics Mid-Term 2024",
            "course": "...",
            "usedBy": {
              "_id": "...",
              "name": "Maker Name"
            },
            "questionPaperFile": {
              "url": "http://...",
              "publicId": "..."
            },
            "updatedAt": "2025-10-09T12:00:00.000Z",
            ...
          }
        ]
        ```
*   **Error Responses**:
    *   **`401 Unauthorized` / `403 Forbidden`**: If the user is not an authenticated checker.
    *   **`500 Internal Server Error`**: If the database query fails.
        ```json
        { "message": "Server error while fetching claimed papers." }
        ```
