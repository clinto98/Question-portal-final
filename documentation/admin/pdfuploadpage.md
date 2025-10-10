# PDF Upload Page Feature Documentation

This document provides a detailed technical breakdown of the "PDF Upload Page" feature, which allows administrators to upload new question paper PDFs and their associated metadata.

## Frontend

The frontend is a single React component that renders a comprehensive form for uploading files and filling in related information.

### Component Breakdown

*   **`PdfUploadPage`**: The main component that manages the form state, handles file selection, and submits the data to the backend.
*   **`FileInput`**: A reusable component that provides a user-friendly interface for selecting a file. It shows a standard file input, but once a file is selected, it displays the file name with an option to remove it.
*   **`NotificationModal`**: A reusable modal to display success or error messages to the user (e.g., for validation errors or successful uploads).
*   **`Loader`**: A component that shows a loading overlay during the upload process.

### UI/UX Elements and Layout

*   **Layout**: The feature is presented as a large form within a clean, shadowed, white card.
*   **Header**: A title ("Upload New Question Paper") and a descriptive subtitle.
*   **Form Fields**: The form is a grid of inputs for collecting metadata:
    *   Text inputs for "Paper Name", "Subject", "Question Paper Year", and "Number of Questions".
    *   `select` dropdowns for "Course", "Standard / Grade", "Syllabus", and "Exam Type". The "Course" dropdown is dynamically populated with data fetched from the server.
*   **File Inputs**: Two `FileInput` components are present:
    *   One for the mandatory "Question Paper PDF".
    *   One for the "Solution Paper PDF (Optional)".
*   **Submit Button**: A button labeled "Upload Paper" which changes to "Uploading..." and becomes disabled during the API call.

### State Management

*   **`formData`**: **Type**: `Object`, **Initial**: `initialState` object, **Purpose**: A single source of truth for all form data, including text inputs and the selected file objects.
*   **`courses`**: **Type**: `Array`, **Initial**: `[]`, **Purpose**: Stores the list of course objects fetched from the server to populate the "Course" dropdown.
*   **`loading`**: **Type**: `Boolean`, **Initial**: `false`, **Purpose**: Controls the loading state and overlay.
*   **`notification`**: **Type**: `Object`, **Purpose**: Manages the state of the `NotificationModal` for displaying feedback to the user.

### User Interactions and Event Handling

*   **`useEffect` on Mount**: Fetches the list of available courses to populate the dropdown.
*   **`onChange` on Inputs/Selects**: The `handleInputChange` function updates the `formData` state object with the new value.
*   **`onChange` on File Inputs**: The `handleFileChange` function is called. It validates that the selected file is a PDF and then updates the `formData` state with the file object.
*   **`onClick` on Remove File Button**: The `removeFile` function sets the corresponding file property in the `formData` state back to `null`.
*   **`onSubmit` on Form**: The `handleSubmit` function is triggered.

### Client-Side Validation

*   The `handleSubmit` function checks for the presence of required metadata (`name`, `subject`, `course`, `questionPaperYear`) and the mandatory `questionPaperFile`.
*   If validation fails, the `NotificationModal` is shown with an appropriate error message, and the submission is aborted.

### API Calls

1.  **Fetch Courses**
    *   **Trigger**: `useEffect` on component mount.
    *   **Details**: `GET /api/admin/courses` to get the list of courses for the dropdown.

2.  **Upload PDF and Data**
    *   **Function**: `handleSubmit`
    *   **Details**:
        *   **HTTP Method**: `POST`
        *   **API Endpoint URL**: `http://localhost:5000/api/admin/pdfs`
        *   **Headers**: `Content-Type: multipart/form-data` and `Authorization: Bearer <token>`.
        *   **Data Payload**: A `FormData` object is constructed. All text-based fields from the `formData` state are appended. The `questionPaperFile` and `solutionPaperFile` (if it exists) are appended as files.
    *   **State Handling**: On success, it shows a success notification and resets the form. On failure, it shows a notification with the specific error message from the server.

---

## Backend

The backend provides a robust endpoint to handle file uploads and create corresponding database records.

### API Endpoint

*   **Endpoint**: `POST /api/admin/pdfs`
*   **Responsibility**: To receive multipart form data (text and files), upload the files to a cloud storage provider (Cloudinary), and create a new `QuestionPaper` document in the database with the metadata and file URLs.

### Authentication & Authorization

*   **Authentication**: Requires an authenticated user (`protect` middleware).
*   **Authorization**: Requires an admin role (`authorize('admin')` middleware).

### Request Structure

*   **Middleware**: The route uses `multer` middleware (`upload.fields([...])`) to parse the `multipart/form-data`. It is configured to expect up to one file for the `questionPaper` field and one for the `solutionPaper` field.
*   **Headers**: `Content-Type: multipart/form-data` is required.
*   **Body**: A `FormData` payload containing key-value pairs for the metadata and files.

### Business Logic Flow

1.  **Data Extraction**: The `multer` middleware processes the request, making text fields available in `req.body` and file buffers available in `req.files`.
2.  **Validation**: The controller checks if the mandatory `questionPaperFile` exists in `req.files`. If not, it returns a `400 Bad Request`.
3.  **Course Lookup**: It queries the `Course` collection using the `course` ID from the request body to retrieve the course title. This is used for creating a structured folder path in Cloudinary.
4.  **Parallel Cloud Upload**: An array of promises is created. The `uploadPdfToCloudinary` helper is called for the `questionPaperFile`, and if the `solutionPaperFile` exists, it's also added to the promise array. `Promise.all` executes these uploads in parallel.
    *   The `uploadPdfToCloudinary` helper function streams the file buffer to Cloudinary, specifying a dynamic folder path like `question_papers/Course_Title_Subject/question_paper` to keep uploads organized.
5.  **Database Document Creation**: Once the uploads are successful, a `newQuestionPaperData` object is created. It includes all the metadata from `req.body` and the `secure_url` and `public_id` for each file returned by Cloudinary.
6.  **Database Interaction**: A new `QuestionPaper` document is instantiated with this data and saved to the database using `.save()`.
7.  **Response**: A `201 Created` response is sent with a success message and the newly created paper object.

### Response Structure

*   **Success Response (`201 Created`)**:
    ```json
    {
      "success": true,
      "message": "Question paper uploaded successfully!",
      "paper": { ... } // The full QuestionPaper object from the database
    }
    ```
*   **Error Responses**:
    *   **`400 Bad Request`**: If the question paper file is missing or if there are Mongoose validation errors (e.g., a required field is missing).
    *   **`404 Not Found`**: If the `course` ID provided does not correspond to an existing course.
    *   **`500 Internal Server Error`**: For any other server-side errors, including failures during the Cloudinary upload process.
