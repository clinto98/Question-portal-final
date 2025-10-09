# Feature: Edit and Resubmit Rejected Question

This document provides a detailed technical breakdown of the feature that allows users with the "Maker" role to edit questions that have been rejected by a "Checker" and resubmit them for approval.

## Frontend

**File:** `frontend/src/pages/maker/EditRejectedQuestion.jsx`

This file contains a specialized version of the question creation form, tailored specifically for handling rejected questions. It reuses many of the same components and logic from the `CreateQuestion` feature.

### Component Breakdown

The component structure is nearly identical to the `CreateQuestion` component, leveraging the same set of reusable sub-components (`SectionWrapper`, `ContentInputSection`, `ChoicesSection`, `ImageCropModal`, etc.).

*   **`EditRejectedQuestion` (Main Component):** The primary component that orchestrates the page. It fetches the rejected question's data, displays it in the form, shows checker feedback, and handles the resubmission process.
*   **`NotificationModal`:** A new modal component used to display validation errors or other important messages to the user (e.g., "Please select a response...").

### UI/UX Elements and Layout

The layout is a large form, visually consistent with the creation page, but with key additions and changes to support the rejection workflow.

*   **Title:** The page title is explicitly set to "Edit Rejected Question".
*   **Review & Comments Section:** This is the most significant new UI element.
    *   **Checker's Rejection Comments:** A read-only, styled text area that prominently displays the feedback provided by the Checker.
    *   **Your Response Dropdown:** A **required** `select` input where the Maker must choose a predefined response (e.g., "Corrections done" or "No corrections required").
*   **Action Buttons:**
    *   **Cancel:** A button that navigates the user back to the previous page.
    *   **Resubmit for Approval:** The primary action button. There is no "Save as Draft" option on this page.

### State Management

The state management is very similar to the `CreateQuestion` component, using `useState` for all state.

*   **`formData`**:
    *   **Type:** `Object`
    *   **Purpose:** Holds all data for the question being edited. The initial state object includes extra fields to manage the rejection/commenting workflow: `checkerComments`, `makerCommentIndex`, and `makerCommentText`.
*   **`notification`**:
    *   **Type:** `Object`
    *   **Initial Value:** `{ isOpen: false, message: "" }`
    *   **Purpose:** Controls the `NotificationModal`, allowing the component to show modal-based alerts to the user.

### User Interactions and Event Handling

*   **Data Fetching:** An `useEffect` hook runs on component mount, using the `id` from the URL to fetch the full data of the rejected question via a `GET` request.
*   **Form Editing:** All form editing handlers (`handleInputChange`, `handleChoiceChange`, `applyCrop`, etc.) are identical to those in the `CreateQuestion` component.
*   **Comment Handling:**
    *   `handleCommentChange`: A new handler tied to the "Your Response" dropdown. It updates `formData` with the index and text of the selected comment.
*   **Form Submission (`handleSubmit`):**
    *   This function is called when the "Resubmit for Approval" button is clicked.
    *   It performs a validation check to ensure a response has been selected from the comments dropdown. If not, it opens the `NotificationModal` with an error message.
    *   It constructs a `FormData` payload, similar to the create/edit process.
    *   It explicitly sets the `status` to `"Pending"`.
    *   It includes the maker's selected comment in the payload under the key `makerComments`.
    *   It makes a `POST` request to the backend.
    *   On success, it navigates the user to the `/maker/submitted` page.

### Client-Side Validation

*   The primary validation is in the `handleSubmit` function, which checks if `formData.makerCommentIndex` is greater than -1. This ensures the user acknowledges the rejection feedback before resubmitting.

### API Calls

*   **Fetch Rejected Question:**
    *   **Method:** `GET`
    *   **Endpoint:** `/api/questions/:id`
*   **Resubmit Question:**
    *   **Method:** `POST`
    *   **Endpoint:** `/api/questions/create`
    *   **Payload:** A `FormData` object containing all the updated question data, plus the `_id` of the question and the `makerComments`.

---

## Backend

**Files:**
*   `backend/src/routes/questionRoutes.js`
*   `backend/src/controllers/questionController.js`

This feature cleverly reuses the existing backend infrastructure that was built for creating and editing questions. No new endpoints are required.

### 1. Get Question by ID

*   **API Endpoint:** `GET /api/questions/:id`
*   **Responsibility:** Fetches the full details for a single question. In this workflow, it retrieves the rejected question's data, including the `checkerComments` field.
*   **Authentication & Authorization:** Requires `MAKER` or `CHECKER` role.
*   **Success Response (200 OK):** A single, populated question object.

### 2. Update and Resubmit Question

*   **API Endpoint:** `POST /api/questions/create`
*   **Responsibility:** This versatile endpoint handles the update and resubmission of the rejected question.
*   **Authentication & Authorization:** Requires `MAKER` role.

#### Business Logic Flow

The `createOrUpdateQuestion` controller function in the backend handles this workflow seamlessly:

1.  **Mode Detection:** The function inspects the incoming `FormData` payload. Because the frontend includes the `_id` of the rejected question, the backend identifies the request as an **update** operation.
2.  **Data Processing:** It processes all the submitted data, including any newly uploaded or replaced images (handling Cloudinary uploads/deletions as needed).
3.  **Status and Comment Update:** The controller receives the `status` (which the frontend sets to `"Pending"`) and the `makerComments` from the request body and includes them in the data to be updated.
4.  **Database Interaction:** It uses `Question.findByIdAndUpdate()` to apply all the changes to the correct question document in the database. The question's status is changed from `Rejected` back to `Pending`, and the maker's response is saved.

#### Response Structure

*   **Success (200 OK):**
    ```json
    {
      "message": "Question updated successfully",
      "question": { ... } // The full, updated question object
    }
    ```
*   **Error Responses:**
    *   **404 Not Found:** If the `_id` sent in the payload does not correspond to an existing question.
    *   **500 Internal Server Error:** For any database or Cloudinary API failures during the update process.
