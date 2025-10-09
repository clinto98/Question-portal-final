# Feature: Create & Edit Question

This document provides a detailed technical breakdown of the feature that allows users with the "Maker" role to create new multiple-choice questions and edit their existing drafts. The feature is consolidated into a single, dynamic form.

## Frontend

**File:** `frontend/src/pages/maker/CreateQuestion.jsx`

This file contains a comprehensive form component that adapts for both creating and editing a question based on the URL.

### Component Breakdown

The main `CreateQuestion` component is composed of several smaller, reusable sub-components to structure the form logically.

*   **`CreateQuestion` (Main Component):** Orchestrates the entire feature. It manages all state, handles data fetching for edit mode and dependencies (like question papers), and processes form submission.
*   **`SectionWrapper`:** A presentational component that wraps each logical section of the form in a `fieldset` with a `legend` for the title, providing a consistent look.
*   **`QuestionPaperDetailsInputs`:** A component dedicated to selecting a claimed question paper. Once a paper is selected, it displays the associated (read-only) Course, Subject, and Year. It also provides buttons to view the question paper and solution PDFs if they exist.
*   **`ContentInputSection`:** A reusable component for inputs that contain both a `textarea` for text and a file upload for an associated image. Used for the main Question content and the Explanation content.
*   **`ChoicesSection`:** Manages the creation and editing of answer choices. It allows adding/removing choices, inputting text for each choice, and uploading an image for each choice.
*   **`ImageUploader`:** A generic component for uploading a single image with a preview. Used within the `ReferenceImagesSection`.
*   **`ReferenceImagesSection`:** A section containing two `ImageUploader` components for optional reference images.
*   **`ImageCropModal`:** A modal dialog that uses `react-image-crop` to allow the user to crop any uploaded image before it is attached to the form. This ensures images are well-formatted.
*   **`Loader`:** A standard loading spinner displayed during asynchronous operations.

### UI/UX Elements and Layout

The UI is a large, single-page form.

*   **Title:** Displays "Create New Question" or "Edit Question" depending on whether a question ID is present in the URL.
*   **Loading Overlay:** A semi-transparent overlay with a `Loader` covers the form when data is being fetched or the form is being submitted.
*   **Form Sections:** The form is divided into the following sections, each wrapped by `SectionWrapper`:
    1.  **Question Paper Details:** Dropdown to select a paper and read-only fields.
    2.  **Question:** Text area and image upload for the question itself, plus an input for the question number (e.g., "1a").
    3.  **Answer Choices:** A dynamic list of choices (minimum of 2). Each choice has a text input and an optional image upload. A dropdown below the list allows selecting the correct answer.
    4.  **Question Reference Images:** Two optional image uploads.
    5.  **Explanation:** Text area and image upload for the question's explanation.
    6.  **Additional Information:** Inputs for Unit, Complexity (Easy, Medium, Hard), comma-separated Keywords, and a checkbox to mark the question as frequently asked.
*   **Action Buttons:** At the bottom of the form:
    *   **Save as Draft:** Saves the question with a "Draft" status.
    *   **Submit for Approval:** Saves the question with a "Pending" status.

### State Management

The component relies heavily on the `useState` hook.

*   **`formData`**:
    *   **Type:** `Object`
    *   **Initial Value:** `initialFormData` (a large object with keys for every form field).
    *   **Purpose:** The primary state object that holds all data for the question being created or edited.
*   **`questionPapers`**:
    *   **Type:** `Array`
    *   **Initial Value:** `[]`
    *   **Purpose:** Stores the list of claimed question papers fetched from the backend, used to populate the dropdown.
*   **`cropModal`**:
    *   **Type:** `Object`
    *   **Initial Value:** `{ open: false, src: null, type: "", index: null }`
    *   **Purpose:** Manages the state of the image cropping modal, including whether it's open, the source URL of the image to crop, and which form field the crop applies to.
*   **`croppedAreaPixels` & `imgElementForCrop`**:
    *   **Purpose:** These states work together with the cropping utility to hold the pixel data of the crop selection and a reference to the image element itself, which is necessary for correctly scaling the crop area.
*   **`loading`**:
    *   **Type:** `Boolean`
    *   **Initial Value:** `false`
    *   **Purpose:** Controls the visibility of the loading overlay during any API call.

### User Interactions and Event Handling

*   **Data Fetching (on load):**
    *   An `useEffect` hook fetches the maker's claimed question papers.
    *   A second `useEffect` hook runs if an `id` is in the URL params. It fetches the data for that specific question and populates the `formData` state, switching the component to "Edit Mode".
*   **Form Input Changes:**
    *   `handleInputChange`: A generic handler for simple text inputs, textareas, select dropdowns, and checkboxes.
    *   `handleQuestionPaperChange`: Triggered when a question paper is selected. It fetches the detailed data for that paper and populates the read-only fields in `formData`.
    *   `handleChoiceChange`, `addChoice`, `removeChoice`: Handlers to manage the dynamic list of answer choices.
*   **Image Handling:**
    *   `handleFileChange`: Triggered when a user selects an image file. It does **not** immediately put the file in `formData`. Instead, it opens the `ImageCropModal` with the selected image.
    *   `applyCrop`: After the user confirms the crop in the modal, this function uses the `getCroppedImg` utility to get the cropped image as a `File` object. It then updates the appropriate field in `formData` (e.g., `questionImage`, or a specific `choice.image`).
    *   `handleRemoveImage`, `handleRemoveChoiceImage`: Handlers to clear an image from the state.
*   **Form Submission:**
    *   `handleSubmit(type)`: The main submission handler, called by both the "Save as Draft" and "Submit for Approval" buttons. The `type` argument is either `"Draft"` or `"Submit"`.

### Client-Side Validation

*   The `handleSubmit` function performs basic checks before making an API call:
    1.  It checks if a question paper has been selected.
    2.  It checks if the question content (either text or an image) is present.
*   If validation fails, it displays an error message using `react-hot-toast` and aborts the submission.

### API Calls

*   **Fetch Claimed Papers:**
    *   **Method:** `GET`
    *   **Endpoint:** `/api/questions/papers/makerclaimed`
*   **Fetch Question Paper Details:**
    *   **Method:** `GET`
    *   **Endpoint:** `/api/questions/question-papers/:paperId`
*   **Fetch Question (for editing):**
    *   **Method:** `GET`
    *   **Endpoint:** `/api/questions/:id`
*   **Create or Update Question:**
    *   **Function:** `handleSubmit`
    *   **Method:** `POST`
    *   **Endpoint:** `/api/questions/create`
    *   **Headers:** `Content-Type: multipart/form-data`, `Authorization: Bearer <token>`
    *   **Payload:** A `FormData` object is constructed dynamically. It includes all text fields. For file fields, it appends the `File` object if it's a new upload. For existing images (in edit mode), it sends the image URL as a string in a separate field (e.g., `existingQuestionImage`) so the backend knows not to delete it unless a new image is provided.

---

## Backend

**Files:**
*   `backend/src/routes/questionRoutes.js`
*   `backend/src/controllers/questionController.js`

This section details the API endpoints that support the question creation and editing feature.

### 1. Get Maker's Claimed Question Papers

*   **API Endpoint:** `GET /api/questions/papers/makerclaimed`
*   **Responsibility:** Fetches all question papers that have been claimed by the currently authenticated maker.
*   **Authentication & Authorization:** Requires `MAKER` role.
*   **Business Logic:** Queries the `PreviousQuestionPaper` collection for documents where `claimedBy` matches `req.user.id`.
*   **Success Response (200 OK):** An array of question paper objects.

### 2. Get Question Paper by ID

*   **API Endpoint:** `GET /api/questions/question-papers/:id`
*   **Responsibility:** Fetches the full details for a single question paper.
*   **Authentication & Authorization:** Requires `MAKER` role.
*   **Request Structure:** The question paper's `_id` is passed as a URL parameter.
*   **Business Logic:** Finds the `PreviousQuestionPaper` by its ID and populates the `course` and `subject` fields.
*   **Success Response (200 OK):** A single, populated question paper object.

### 3. Get Question by ID

*   **API Endpoint:** `GET /api/questions/:id`
*   **Responsibility:** Fetches the full details for a single question, used to populate the form in edit mode.
*   **Authentication & Authorization:** Requires `MAKER` or `CHECKER` role.
*   **Request Structure:** The question's `_id` is passed as a URL parameter.
*   **Business Logic:** Finds the `Question` by its ID and populates related data like `course` and `questionPaper`.
*   **Success Response (200 OK):** A single, populated question object.

### 4. Create or Update Question

*   **API Endpoint:** `POST /api/questions/create`
*   **Responsibility:** A single endpoint that handles both the creation of a new question and the updating of an existing one.
*   **Authentication & Authorization:** Requires `MAKER` role.
*   **Middleware:** Uses `multer` for handling `multipart/form-data`. The `upload.fields([...])` middleware is configured to accept files from all the different image inputs (question, explanation, choices, etc.).

#### Request Structure

*   **Headers:** `Content-Type: multipart/form-data`
*   **Body:** A `FormData` payload containing all question fields. Critically, if the request is an update, the body **must** include the `_id` of the question being modified.

#### Business Logic Flow

The `createQuestion` controller function is highly complex:

1.  **Mode Detection:** It first checks if `req.body._id` exists. This determines whether to perform an update or a create operation.
2.  **Image Processing:**
    *   For each potential image field (e.g., `questionImage`), it checks if a new file was uploaded in `req.files`.
    *   If a new file exists, it calls a helper (`uploadToCloudinary`) to upload it. The Cloudinary URL is stored.
    *   If the operation is an **update**, and a new image was uploaded, it also calls a helper (`deleteFromCloudinary`) to delete the old image that was just replaced.
3.  **Data Structuring:** It constructs the main `questionData` object from the request body.
4.  **Choices Processing:** It iterates through the `choicesText` array from the body. For each choice, it determines if it has a new image (from `req.files.choicesImage`), an existing image (from `req.body.existingChoiceImages`), or no image, and structures the choice object accordingly.
5.  **Database Interaction:**
    *   **If Update:** It uses `Question.findByIdAndUpdate()`, passing the `_id`, the newly constructed `questionData`, and `{ new: true }` to get the updated document back.
    *   **If Create:** It creates a `new Question()` with the `questionData`, sets the `createdBy` field to `req.user.id`, and calls `.save()`.

#### Response Structure

*   **Success (201 Created or 200 OK):**
    ```json
    {
      "message": "Question created/updated successfully",
      "question": { ... } // The full, newly created or updated question object
    }
    ```
*   **Error Responses:**
    *   **400 Bad Request:** If required fields are missing.
    *   **404 Not Found:** If an update is attempted but the `_id` does not exist or does not belong to the user.
    *   **500 Internal Server Error:** For Cloudinary upload failures or database errors.
