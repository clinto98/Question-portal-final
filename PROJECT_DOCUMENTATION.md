# Project MCQ Application Documentation

## 1. Overview

This document provides a detailed explanation of the features and functionality of the MCQ Application. This full-stack MERN (MongoDB, Express, React, Node.js) application is designed for the creation, management, and review of multiple-choice questions (MCQs).

The application supports three distinct user roles, each with a specific set of permissions and responsibilities:

*   **Admin:** Manages users and courses, and uploads question paper documents.
*   **Maker:** Creates MCQ questions based on the documents provided by the Admin.
*   **Checker:** Reviews questions submitted by Makers and either approves or rejects them.

---

## 2. User Roles and Authentication

### 2.1. Authentication

*   **Login:** The application provides separate login pages for each role (Admin, Maker, and Checker). Users must provide their email and password to log in.
*   **Authorization:** Authentication is handled using JSON Web Tokens (JWT). Once a user logs in, a token is generated and stored. This token is sent with subsequent requests to access protected routes.
*   **Account Deactivation:** If an Admin deactivates a Maker or Checker's account, they will be unable to log in.

### 2.2. User Roles

#### 2.2.1. Admin

The Admin has the highest level of authority and is responsible for the overall management of the application's content and users.

#### 2.2.2. Maker

The Maker's primary role is to create high-quality multiple-choice questions from the PDF documents assigned to them.

#### 2.2.3. Checker

The Checker is responsible for quality control. They review the questions submitted by Makers to ensure they are accurate, relevant, and well-formed.

---

## 3. Admin Role: Features and Functionality

### 3.1. Admin Dashboard

The Admin dashboard provides a high-level overview of the application's activity. The dashboard displays statistics that can be filtered by time (weekly, monthly, or a custom date range).

*   **Summary Cards:**
    *   **Total Created:** The total number of questions created within the selected timeframe.
    *   **Total Approved:** The total number of questions approved within the selected timeframe.
    *   **Total Rejected:** The total number of questions rejected within the selected timeframe.
    *   **Total Resubmitted:** The total number of questions that were rejected and then resubmitted by a Maker.
    *   **Total Pending:** The current number of questions awaiting review by a Checker (this is a snapshot and not affected by the date filter).
*   **Status Distribution:** A pie chart showing the distribution of all questions in the system by their status (e.g., Pending, Approved, Rejected, Draft).
*   **Maker Performance:** A table displaying the performance of the top 10 Makers within the selected timeframe, including the number of questions created, approved, pending, drafted, and their historical rejection count.
*   **Checker Performance:** A table showing the performance of the top 10 Checkers, including the number of questions reviewed, approved, rejected, and a count of "false rejections" (questions they rejected that were later approved).

### 3.2. User Management

The Admin has full control over user accounts.

*   **Create User:**
    *   Admins can create new user accounts for both Makers and Checkers.
    *   The required fields are Name, Email, Password, and Role.
    *   The system ensures that no two users in the same role can have the same email address.
*   **View All Users:**
    *   Admins can view a list of all Makers and Checkers in the system.
    *   The list is presented in two separate tables, one for each role.
*   **Activate/Deactivate User:**
    *   Instead of permanently deleting a user, Admins can toggle a user's status between "Active" and "Inactive".
    *   An "Inactive" user is unable to log in to the application.
    *   This "soft delete" approach preserves the user's history and associated data.

### 3.3. Course Management

Admins are responsible for managing the courses to which question papers belong.

*   **Create Course:**
    *   Admins can create new courses with the following details: Title, Description, Standard (e.g., "10th Grade"), Category, Syllabus (e.g., "CBSE"), Exam Type (e.g., "Board"), Start Date, End Date, and Status ("Active" or "Inactive").
    *   The course title must be unique.
*   **View All Courses:**
    *   Admins can view a list of all created courses, along with their details and the name of the Admin who created them.

### 3.4. Question Paper Management

Admins upload the source material (in PDF format) from which Makers will create questions.

*   **Upload Question Papers:**
    *   Admins can upload a question paper PDF and, optionally, a corresponding solution PDF.
    *   They must provide metadata for the paper, including its Name, associated Course, Subject, Standard, Syllabus, Exam Type, the Year of the paper, and the total Number of Questions it contains.
    *   Files are securely uploaded to and stored in Cloudinary.
*   **View All PDFs:**
    *   Admins can view a list of all uploaded question papers.
*   **Delete PDF:**
    *   Admins can delete a question paper.
    *   This is a critical action that also deletes all associated questions from the database and the corresponding files from Cloudinary to prevent orphaned data.

---

## 4. Maker Role: Features and Functionality

### 4.1. Maker Dashboard

The Maker dashboard provides personalized statistics about the user's activity and performance, filterable by time.

*   **Summary Cards:** Displays key metrics such as Total Questions Created, Total Approved, Historical Rejections, Currently Rejected, Total Drafted, Total Resubmitted, and Total Pending.
*   **Activity Chart:** A chart that visualizes the number of questions created, approved, and rejected over the selected time period.

### 4.2. Question Paper Workflow

Makers work on question papers that have been uploaded by the Admin.

*   **View Available Papers:**
    *   Makers can see a list of all question papers that have not yet been claimed by any other Maker.
    *   This view includes a "Progress" column that shows how many questions have been approved out of the total required (e.g., "15 / 100").
*   **Claim a Paper:**
    *   A Maker can "claim" an available paper. This action locks the paper, making it unavailable to other Makers and assigning it to the current Maker.
    *   This prevents multiple users from working on the same document simultaneously.
*   **View Claimed Papers:**
    *   Makers can view a list of the papers they have personally claimed.
    *   This view also includes the "Progress" column to track their work.

### 4.3. Question Creation

This is the core feature for the Maker role.

*   **Create Question Page:**
    *   On this page, a Maker can select one of their claimed question papers from a dropdown list.
    *   This list is intelligently filtered to show only papers that are not yet complete (i.e., where the number of approved questions is less than the total number of questions required).
    *   Once a paper is selected, its details (Course, Subject, Year) are automatically populated and displayed.
*   **Question Form:** The form for creating a question is comprehensive and includes the following fields:
    *   **Question Details:** Question Number, Question Text, and an optional Question Image.
    *   **Answer Choices:** A section to add multiple answer choices. Each choice can have both text and an optional image. Makers can add or remove choices (a minimum of 2 are required).
    *   **Correct Answer:** A dropdown to select the correct answer from the choices provided.
    *   **Explanation:** A field for the explanation of the correct answer, which can also include an image.
    *   **Reference Images:** Fields to upload up to two reference images.
    *   **Additional Information:** Fields for Unit, Complexity (Easy, Medium, Hard), and comma-separated Keywords.
    *   **Frequently Asked:** A checkbox to mark the question as frequently asked.
*   **Image Cropping:** When any image is uploaded, a modal appears that allows the Maker to crop the image before it is attached to the question.
*   **Save as Draft:** A Maker can save a question as a "Draft" at any time. This saves the question in the database without submitting it for review, allowing the Maker to return to it later.
*   **Submit for Approval:** When the question is complete, the Maker can submit it for approval. This changes the question's status to "Pending" and sends it to the Checker's review queue.

### 4.4. Question Management

Makers can track and manage the questions they have created.

*   **View Draft Questions:** A dedicated page lists all questions saved as a "Draft". From here, a Maker can choose to edit or delete them.
*   **View Submitted Questions:** This page shows a list of all questions the Maker has submitted (i.e., those with a status of Pending, Approved, or Rejected).
*   **Handling Rejected Questions:**
    *   If a question is rejected by a Checker, it appears in the "Submitted Questions" list with a "Rejected" status.
    *   The Maker can click a "View Comments" button to see the feedback provided by the Checker.
    *   An "Edit" button allows the Maker to go to a pre-populated question form to make the necessary corrections and resubmit the question for approval.

---

## 5. Checker Role: Features and Functionality

### 5.1. Checker Dashboard

The Checker dashboard provides an overview of their review activity, filterable by time.

*   **Summary Cards:** Displays key metrics such as Total Questions Reviewed, Total Approved, and Total Rejected within the selected timeframe.
*   **Activity Chart:** A chart visualizing the number of questions approved and rejected over time.

### 5.2. Question Review Workflow

The core responsibility of the Checker is to review questions submitted by Makers.

*   **View Pending Questions:**
    *   Checkers have a dedicated page that lists all questions with a "Pending" status, sorted with the newest submissions first.
    *   This serves as their primary work queue.
*   **Question Detail View:**
    *   Clicking on a pending question takes the Checker to a detailed view where they can see all aspects of the question: the question text/image, all choices, the correct answer, the explanation, and all associated metadata.
    *   This view also allows the Checker to see the original Question Paper PDF for reference.
*   **Approve a Question:**
    *   If the question meets the quality standards, the Checker can approve it.
    *   This action changes the question's status to "Approved".
    *   Crucially, this action also increments the `approvedQuestionCount` on the corresponding `QuestionPaper` document, updating the progress tracker for that paper.
    *   **False Rejection Logging:** The system includes a quality check on the review process itself. If a Maker resubmits a question that was previously rejected and marks it as "No corrections required," and a *different* Checker then approves it, the system logs a "false rejection" against the original Checker. This helps identify potential inconsistencies in the review process.
*   **Reject a Question:**
    *   If a question is inaccurate or needs improvement, the Checker can reject it.
    *   Rejecting a question requires the Checker to provide comments, which are mandatory.
    *   This action changes the question's status to "Rejected" and sends it back to the Maker with the feedback for correction.
    *   If the question was previously in an "Approved" state, the `approvedQuestionCount` on the `QuestionPaper` is decremented to maintain an accurate count.
*   **Bulk Approval:**
    *   To improve efficiency, Checkers can select multiple pending questions from the list and approve them all at once with a single click.

### 5.3. Viewing Reviewed Questions

*   Checkers can view a list of all questions they have either approved or rejected, allowing them to review their past work.

---

## 6. Technical Details

*   **Stack:** The application is built on the MERN stack:
    *   **MongoDB:** A NoSQL database used to store all application data.
    *   **Express.js:** A web application framework for Node.js, used to build the backend API.
    *   **React:** A JavaScript library for building user interfaces, used for the frontend.
    *   **Node.js:** A JavaScript runtime environment that executes the backend code.
*   **Key Libraries & Services:**
    *   **Mongoose:** An Object Data Modeling (ODM) library for MongoDB and Node.js, used to manage relationships between data and provide schema validation.
    *   **JSON Web Tokens (JWT):** Used for implementing secure authentication and authorization.
    *   **Cloudinary:** A cloud-based service used for storing all uploaded files, including question paper PDFs and images for questions and answers.
    *   **React Router:** Used for handling navigation and routing within the frontend application.
    *   **Axios:** A promise-based HTTP client used for making API requests from the frontend to the backend.
    *   **Tailwind CSS:** A utility-first CSS framework used for styling the frontend.
