# Maker Dashboard Data Calculation

The backend logic for the Maker Dashboard is handled by the `getMakerDashboardStats` function in `questionController.js`. It calculates statistics in two ways: some are absolute "all-time" counts, while others are "time-variant," meaning they change based on the date range you select on the dashboard (e.g., "This Week", "This Month").

Here is a breakdown of each statistic displayed on your dashboard:

---

### 1. Total Created

*   **What it is**: The total number of new questions you have created.
*   **How it's calculated**: The backend queries the `Question` collection for all questions that have your `maker` ID and a `createdAt` timestamp that falls **within the selected timeframe**.
*   **Time Dependency**: **Time-Variant**. This number will change when you select a different date range.

### 2. Total Approved

*   **What it is**: The total number of your questions that were approved by a checker.
*   **How it's calculated**: This data comes from your personal `Maker` document, which contains a log of all your accepted questions (`makeracceptedquestions`). The backend filters this log to count only the approval actions that occurred **within the selected timeframe**.
*   **Time Dependency**: **Time-Variant**. This number will change based on the date range.

### 3. Currently Rejected

*   **What it is**: The current number of your questions that have a status of "Rejected". This is a live snapshot.
*   **How it's calculated**: This is a direct count from the `Question` collection for all of your questions where `status` is currently `"Rejected"`.
*   **Time Dependency**: **Not Time-Variant**. This number represents the current state of your rejected questions and does not change with the date filter.

### 4. Pending Review

*   **What it is**: The current number of your questions that are awaiting review by a checker.
*   **How it's calculated**: A direct count from the `Question` collection for all of your questions where `status` is currently `"Pending"`.
*   **Time Dependency**: **Not Time-Variant**. This is a live snapshot of your pending questions.

### 5. Total Historical Rejection

*   **What it is**: The total number of times your questions have been rejected. This can be higher than "Currently Rejected" because it includes questions that were rejected but later edited and approved.
*   **How it's calculated**: Similar to "Total Approved," this count comes from a log in your `Maker` document (`makerrejectedquestions`). The backend filters this log to count only the rejection actions that occurred **within the selected timeframe**.
*   **Time Dependency**: **Time-Variant**. This number changes based on the selected date range.

### 6. In Draft

*   **What it is**: The current number of your questions that are saved as drafts and have not been submitted.
*   **How it's calculated**: A direct count from the `Question` collection for all of your questions where `status` is currently `"Draft"`.
*   **Time Dependency**: **Not Time-Variant**. This is a live snapshot of your drafts.

### Summary

| Statistic | Time-Variant? | Description |
| :--- | :---: | :--- |
| Total Created | **Yes** | Questions created in the selected timeframe. |
| Total Approved | **Yes** | Questions approved in the selected timeframe. |
| Historical Rejections | **Yes** | Rejection events that occurred in the timeframe. |
| Currently Rejected | No | Your questions currently with "Rejected" status. |
| Pending Review | No | Your questions currently with "Pending" status. |
| In Draft | No | Your questions currently with "Draft" status. |

---

# Checker Dashboard Data Calculation

The `getCheckerDashboardStats` function in `checkerController.js` provides data for the checker dashboard. It uses a mix of direct queries for overall statistics and a specific aggregation to find data personal to the checker within a timeframe.

Here is a breakdown of each statistic:

---

### 1. Total Questions (`totalQuestions`)

*   **What it is**: The total number of questions in the system that are either "Approved" or "Pending".
*   **How it's calculated**: A direct count from the `Question` collection for all documents where `status` is in `["Approved", "Pending"]`.
*   **Time Dependency**: **Not Time-Variant**. This is an absolute count and does not change with the date filter.

### 2. Approved by You (`totalApproved`)

*   **What it is**: The number of questions approved by you (the logged-in checker) within the selected date range.
*   **How it's calculated**: This is calculated via an aggregation pipeline on the `Checker` model. It filters your user document's `checkeracceptedquestion` log to count only the approval actions whose `actionDates` fall **within the selected timeframe**.
*   **Time Dependency**: **Time-Variant**. This number will change when you select a different date range.

### 3. Rejected by You (`totalRejected`)

*   **What it is**: The total number of questions you have ever rejected.
*   **How it's calculated**: A direct count from the `Question` collection for all documents where `checkedBy` matches your ID and `status` is `"Rejected"`.
*   **Time Dependency**: **Not Time-Variant**. This is your all-time rejection count.

### 4. Total Pending (`totalPending`)

*   **What it is**: The total number of questions in the system currently awaiting review from any checker.
*   **How it's calculated**: A direct count from the `Question` collection where `status` is `"Pending"`.
*   **Time Dependency**: **Not Time-Variant**. This is a live, absolute count.

### Summary

| Statistic | Time-Variant? | Description |
| :--- | :---: | :--- |
| Total Questions | No | All questions in the system that are Approved or Pending. |
| Approved by You | **Yes** | Questions you approved in the selected timeframe. |
| Rejected by You | No | All questions you have ever rejected. |
| Total Pending | No | All questions in the system awaiting review. |