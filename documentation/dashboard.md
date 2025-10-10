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

# Admin Dashboard Data Calculation

The Admin Dashboard provides a system-wide overview of all activity. The data is handled by the `getAdminDashboardStats` function in `adminController.js`. Most statistics are time-variant and will change based on the selected date range (e.g., "Weekly", "Monthly", "All", or a custom range).

---

### Data Accuracy: Flaws & Solutions

To ensure the highest accuracy, several key metrics on the dashboard were updated to count **events** rather than **current states**. This is crucial because a question's status changes over its lifecycle.

*   **The Flaw**: Previously, metrics like "Total Approved" and "Total Rejected" were calculated by counting questions currently in the `Approved` or `Rejected` state. This was inaccurate because a question's status is not permanent. For example, if a question was approved and then later finalized by an expert, its status would change to `Finalised`, and it would no longer be counted as approved. Similarly, if a rejected question was edited and resubmitted by a maker, its status would change to `Pending`, and the original rejection would be lost from the count.

*   **The Solution**: The calculations have been rewritten to use the historical action logs stored within each `Maker` and `Checker` document. When a checker approves or rejects a question, a timestamped log entry is created. The dashboard now aggregates these log entries. This means we are counting the **actual approval and rejection events** that occurred within the selected timeframe, which provides a completely accurate historical record, regardless of the question's current status.

---

### Component Breakdown & Calculations

#### Summary Cards

*   **Total Created**: The total number of new questions created across the entire system **within the selected timeframe**.
    *   **How it's calculated**: A count of documents in the `Question` collection where the `createdAt` field is within the date range.

*   **Total Approved**: The total number of questions approved by checkers **within the selected timeframe**.
    *   **How it's calculated**: An aggregation on the `Checker` collection that sums up all approval actions from the `checkeracceptedquestion` logs where the `actionDates` fall within the date range.

*   **Total Rejected**: The total number of questions rejected by checkers **within the selected timeframe**.
    *   **How it's calculated**: An aggregation on the `Checker` collection that sums up all rejection actions from the `checkerrejectedquestion` logs where the `actionDates` fall within the date range.

*   **Total Pending**: The current number of questions in the system with a `Pending` status.
    *   **How it's calculated**: A direct count of all documents in the `Question` collection with a `status` of `Pending`. This is a live snapshot and is **not time-variant**.

#### Question Status Distribution

*   **What it is**: A pie chart showing the current, live distribution of all questions in the database across every status (Approved, Rejected, Pending, Draft, etc.).
*   **How it's calculated**: An aggregation pipeline on the `Question` collection that groups all documents by their `status` field and returns the count for each group.
*   **Time Dependency**: **Not Time-Variant**.

#### Top Maker Performance

This table ranks the top 10 makers by their activity **within the selected timeframe**.

*   **How it's calculated**: An aggregation pipeline that starts with questions created in the timeframe, groups them by `maker`, and then looks up the maker's details and historical logs from the `makers` collection.
*   **Columns**:
    *   **Created**: A sum of questions created by the maker in the timeframe (`Question` collection).
    *   **Approved**: A sum of approval events from the maker's `makeracceptedquestions` log within the timeframe (`Maker` collection).
    *   **Pending**: A sum of questions created by the maker in the timeframe that are currently in `Pending` status (`Question` collection).
    *   **Drafted**: A sum of questions created by the maker in the timeframe that are currently in `Draft` status (`Question` collection).
    *   **Hist. Rejections**: A sum of rejection events from the maker's `makerrejectedquestions` log within the timeframe (`Maker` collection).

#### Checker Performance

This table ranks the top 10 checkers by their activity **within the selected timeframe**.

*   **How it's calculated**: An aggregation pipeline that starts from the `Checker` collection and calculates all metrics directly from the action logs within each checker's document.
*   **Columns**:
    *   **Total Reviewed**: The sum of `Approved` and `Rejected` actions performed by the checker in the timeframe.
    *   **Approved**: A sum of approval events from the checker's `checkeracceptedquestion` log within the timeframe.
    *   **Rejected**: A sum of rejection events from the checker's `checkerrejectedquestion` log within the timeframe.
    *   **False Rejections**: A sum of events from the checker's `checkerfalserejections` log within the timeframe.

### Summary Table

| Field | Time Variant? | Description | Database Source |
| :--- | :---: | :--- | :--- |
| Total Created | **Yes** | Questions created in the selected timeframe. | `Question` |
| Total Approved | **Yes** | Approval events that occurred in the timeframe. | `Checker` (Aggregation) |
| Total Rejected | **Yes** | Rejection events that occurred in the timeframe. | `Checker` (Aggregation) |
| Total Pending | No | All questions currently with "Pending" status. | `Question` |
| Status Distribution | No | Current distribution of all questions by status. | `Question` (Aggregation) |
| **Top Maker Performance** | | *(All fields are time-variant)* | |
| &nbsp;&nbsp;*Created* | **Yes** | Questions created by the maker in the timeframe. | `Question` (Aggregation) |
| &nbsp;&nbsp;*Approved* | **Yes** | Approvals for the maker in the timeframe. | `Maker` (Aggregation) |
| &nbsp;&nbsp;*Pending* | **Yes** | Questions created by maker in timeframe now pending. | `Question` (Aggregation) |
| &nbsp;&nbsp;*Drafted* | **Yes** | Questions created by maker in timeframe now in draft. | `Question` (Aggregation) |
| &nbsp;&nbsp;*Hist. Rejections* | **Yes** | Rejections for the maker in the timeframe. | `Maker` (Aggregation) |
| **Checker Performance** | | *(All fields are time-variant)* | |
| &nbsp;&nbsp;*Total Reviewed* | **Yes** | Questions reviewed by the checker in the timeframe. | `Checker` (Aggregation) |
| &nbsp;&nbsp;*Approved* | **Yes** | Questions approved by the checker in the timeframe. | `Checker` (Aggregation) |
| &nbsp;&nbsp;*Rejected* | **Yes** | Questions rejected by the checker in the timeframe. | `Checker` (Aggregation) |
| &nbsp;&nbsp;*False Rejections* | **Yes** | False rejections for the checker in the timeframe. | `Checker` (Aggregation) |