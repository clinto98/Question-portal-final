# Reviewed Questions Page Documentation (Checker)

This document provides a detailed technical breakdown of the "Reviewed Questions" feature, which allows a Checker to view a filterable list of all questions they and other checkers have either approved or rejected.

## Frontend

The frontend is a React component that displays a comprehensive, filterable table of all questions that have passed the initial pending stage.

### Component Breakdown

*   **`AcceptedQuestions`**: The main component, which is misnamed and actually displays all *reviewed* questions (Approved, Rejected, Finalised). It fetches data, manages filter states, and renders the list.
*   **`StatusBadge`**: A reusable component to display a colored badge for the question's status (e.g., "Approved", "Rejected").
*   **`ImageModal`**: A modal component that displays a larger view of a question's image when its thumbnail is clicked.
*   **`Loader`**: A standard component to show a loading animation while data is being fetched.

### UI/UX Elements and Layout

*   **Header**: Contains the title "Reviewed Questions" and a real-time count of the number of results being displayed after filters are applied.
*   **Filters**: A filter bar with three `select` dropdowns:
    *   Filter by Status (All, Approved, Rejected, Finalised).
    *   Filter by Maker (dynamically populated).
    *   Filter by Course (dynamically populated).
*   **Questions Table**: A table displaying the filtered list of questions with the following columns:
    *   `Question`: Shows a snippet of the question text and a clickable thumbnail of the question image if one exists.
    *   `Maker`: The name of the maker who created the question.
    *   `Course`: The course the question belongs to.
    *   `Question Paper`: The name of the source question paper.
    *   `Status`: A `StatusBadge` indicating the current status.
    *   `Actions`: A "View Details" link that navigates the checker to a detailed view for that specific question.
*   **Image Modal**: Clicking on a question image thumbnail opens the `ImageModal` to show the image in a larger, centered view.

### State Management

*   **`questions`**: **Type**: `Array`, **Initial**: `[]`, **Purpose**: Stores the full, unfiltered list of reviewed question objects fetched from the API.
*   **`loading`**: **Type**: `Boolean`, **Initial**: `true`, **Purpose**: Controls the visibility of the `Loader`.
*   **`imageModalSrc`**: **Type**: `String | null`, **Initial**: `null`, **Purpose**: Stores the URL of the image to be displayed in the `ImageModal`. When `null`, the modal is hidden.
*   **`filterStatus`, `filterMaker`, `filterCourse`**: **Type**: `String`, **Purpose**: These state variables hold the current values of the filter dropdowns. Changes to these states trigger a re-calculation of the `filteredQuestions` array.

### User Interactions and Event Handling

*   **`useEffect` on Mount**: Calls `fetchReviewed` to load the initial list of questions.
*   **`onChange` on Filter Dropdowns**: Updates the corresponding filter state (`setFilterStatus`, etc.), which causes the `filteredQuestions` array to be recomputed and the table to re-render.
*   **`onClick` on Question Image**: Sets the `imageModalSrc` state to the URL of the clicked image, which opens the `ImageModal`.
*   **`onClick` on Modal Backdrop/Close Button**: Sets the `imageModalSrc` state back to `null`, closing the modal.
*   **`onClick` on "View Details" Link**: Uses the `useNavigate` hook to redirect the checker to the detail page for that question (e.g., `/checker/details/:questionId`).

### API Calls

*   **Fetch Reviewed Questions**
    *   **Function**: `fetchReviewed` (called in `useEffect`)
    *   **Details**:
        *   **HTTP Method**: `GET`
        *   **API Endpoint URL**: `http://localhost:5000/api/checker/questions/reviewed`
        *   **Headers**: Requires an `Authorization: Bearer <token>` header.
    *   **State Handling**: On success, updates the `questions` state with the fetched data. On error, logs the error to the console. `setLoading(false)` is called in the `finally` block.

---

## Backend

The backend provides a secure endpoint for checkers to retrieve a list of all questions that are no longer in the pending state.

### API Endpoint

*   **Endpoint**: `GET /api/checker/questions/reviewed`
*   **Responsibility**: To retrieve all questions from the database that have a status of "Approved", "Rejected", or "Finalised".

### Authentication & Authorization

*   **Authentication**: This endpoint is not explicitly protected by authentication middleware in the provided `checkerRoutes.js` file. However, the frontend code sends an `Authorization` header, implying it is intended to be a protected route.
*   **Authorization**: No specific role authorization is applied to this route in the provided code.

### Request Structure

*   **Headers**: `Authorization: Bearer <jwt_token>` (as sent by the frontend).
*   **Body**: None.

### Business Logic Flow

1.  **Database Query**: The controller executes a `Question.find()` query on the `questions` collection.
2.  **Filtering**: The query specifically filters for documents where the `status` field is one of "Approved", "Rejected", or "Finalised" using the `$in` operator.
3.  **Data Population**: The query is chained with multiple `.populate()` calls to enrich the data:
    *   `.populate("maker", "name email")`: Replaces the `maker` ID with the corresponding maker's name and email.
    *   `.populate("course", "title")`: Replaces the `course` ID with the course's title.
    *   `.populate("questionPaper", "name")`: Replaces the `questionPaper` ID with the paper's name.
4.  **Sorting**: The results are sorted by the `updatedAt` field in descending order, showing the most recently reviewed questions first.
5.  **Response**: The final array of populated question documents is sent back as the JSON response.

### Response Structure

*   **Success Response (`200 OK`)**:
    *   **Body**: An array of question objects. Each object contains all fields from the `Question` schema, with the `maker`, `course`, and `questionPaper` fields expanded with their respective details.
        ```json
        [
          {
            "_id": "...",
            "question": { "text": "...", "image": "..." },
            "status": "Approved",
            "maker": {
              "_id": "...",
              "name": "Maker Name"
            },
            "course": {
              "_id": "...",
              "title": "Course Title"
            },
            "questionPaper": {
              "_id": "...",
              "name": "Question Paper Name"
            },
            ...
          }
        ]
        ```
*   **Error Responses**:
    *   **`500 Internal Server Error`**: If the database query fails for any reason.
        ```json
        { "message": "Server error fetching reviewed questions" }
        ```
