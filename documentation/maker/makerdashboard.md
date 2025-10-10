# Feature: Maker Dashboard

This document provides a detailed technical breakdown of the dashboard feature for users with the "Maker" role, which provides an overview of their question creation activity.

## Frontend

**File:** `frontend/src/pages/maker/MakerDashboard.jsx`

This file contains a data visualization component that uses `recharts` to display statistics and trends.

### Component Breakdown

*   **`MakerDashboard` (Main Component):** The primary component that manages state, fetches data based on time filters, and renders the overall dashboard layout.
*   **`StatCard`:** A reusable presentational component that displays a single key metric (e.g., "Total Created"). It includes a title, a value, an icon, and a background color.
*   **`TimeFilterButton`:** A reusable button component used for selecting the time period (e.g., "This Week", "All Time").
*   **`Loader`:** A standard loading animation.
*   **`recharts` Components:** The component heavily utilizes components from the `recharts` library (`LineChart`, `Line`, `XAxis`, etc.) to render the activity trend chart.
*   **`react-datepicker`:** This library is used to provide a calendar interface for selecting a custom date range.

### UI/UX Elements and Layout

The dashboard is designed to be an at-a-glance summary of the maker's performance.

*   **Header:** Contains the title "My Dashboard" and a time filter control group.
*   **Time Filters:** A group of buttons allows the user to select a time frame: "This Week", "This Month", "All Time", or "Custom Range".
*   **Custom Date Picker:** When "Custom Range" is active, two `DatePicker` input fields appear, allowing the user to select a specific start and end date.
*   **Statistics Grid:** A responsive grid of six `StatCard` components, displaying:
    *   Total Created
    *   Total Approved
    *   Currently Rejected
    *   Pending Review
    *   Total Historical Rejection
    *   In Draft
*   **Activity Trend Chart:** A `LineChart` that visualizes the number of questions created, approved, and rejected per day over the selected time period.

### State Management

The component uses the `useState` hook for all state.

*   **`dashboardData`**:
    *   **Type:** `Object`
    *   **Initial Value:** `{ stats: {}, chartData: [] }`
    *   **Purpose:** Stores the entire payload from the dashboard API, which includes the `stats` object for the cards and the `chartData` array for the line chart.
*   **`loading`**:
    *   **Type:** `Boolean`
    *   **Purpose:** Controls the visibility of the `Loader` component during API calls.
*   **`timeframe`**:
    *   **Type:** `String`
    *   **Initial Value:** `"weekly"`
    *   **Purpose:** Stores the currently active time filter (`weekly`, `monthly`, `all`, `custom`).
*   **`startDate`, `endDate`**:
    *   **Type:** `Date | null`
    *   **Purpose:** Store the start and end dates selected from the `react-datepicker` when the `timeframe` is `"custom"`.

### User Interactions and Event Handling

*   **Fetching Data:** An `useEffect` hook is responsible for fetching the dashboard data. Its dependency array includes `[timeframe, startDate, endDate]`, so it automatically re-runs the API call whenever any of these filter parameters change.
*   **Changing Timeframe:** The `handleTimeframeClick` function updates the `timeframe` state when a filter button is clicked. If the new timeframe is not `"custom"`, it also resets `startDate` and `endDate` to `null`.

### API Calls

*   **Fetch Dashboard Data:**
    *   **Function:** `fetchDashboardData` (within `useEffect`)
    *   **Method:** `GET`
    *   **Endpoint:** `/api/questions/dashboard`
    *   **Payload:** The request sends query parameters based on the current state:
        *   `timeframe`: (e.g., `"weekly"`)
        *   `startDate`, `endDate`: (ISO strings, only included if `timeframe` is `"custom"`)

---

## Backend

**Files:**
*   `backend/src/routes/questionRoutes.js`
*   `backend/src/controllers/questionController.js`

This feature is supported by a single, complex data aggregation endpoint.

### Get Maker Dashboard Stats

*   **API Endpoint:** `GET /api/questions/dashboard`
*   **Responsibility:** To calculate and aggregate a variety of statistics about the authenticated maker's activity within a specified time range.

#### Authentication & Authorization

*   **Authentication:** Requires a valid JWT (`protect` middleware).
*   **Authorization:** Requires the **`MAKER`** role (`isMaker` middleware).

#### Request Structure

*   **Headers:** `Authorization: Bearer <token>` (Required)
*   **Query Parameters:**
    *   `timeframe`: (String, Optional, Default: `all`) - Can be `weekly`, `monthly`, `all`, or `custom`.
    *   `startDate`: (String, ISO 8601 format) - Required if `timeframe` is `custom`.
    *   `endDate`: (String, ISO 8601 format) - Required if `timeframe` is `custom`.

#### Business Logic Flow

The `getMakerDashboardStats` controller function is one of the most complex in the application, designed for efficient data retrieval.

1.  **Date Range Calculation:** It uses a `getDateRange` helper function to parse the `timeframe` query parameter and determine the `startDate` and `endDate` for the database queries.
2.  **Concurrent Data Fetching:** It uses `Promise.all` to execute multiple database queries concurrently, which is highly efficient. The queries include:
    *   A `lean()` query on the `Maker` model to get the user's own document, which contains historical logs.
    *   A `find` on the `Question` model for all questions created by the maker within the date range (for the chart).
    *   Several `countDocuments` queries on the `Question` model to get current, non-time-based stats like total pending, currently rejected, and total drafts.
3.  **Data Aggregation:**
    *   **Stat Cards:** It calculates the values for the stat cards by combining the results of the concurrent queries. For example, `totalCreated` comes from the count of questions created in the time range, while `currentlyRejected` is a live count irrespective of the time range.
    *   **Chart Data:** It processes the array of all questions created within the time frame and the historical logs from the `Maker` document. It iterates through them, bucketing the counts of `created`, `approved`, and `rejected` actions by date into a `chartData` object. This object is then converted to a sorted array for the frontend.

#### Response Structure

*   **Success (200 OK):**
    *   A JSON object containing two keys:
        *   `stats`: An object with key-value pairs for each statistic (e.g., `totalCreated: 15`, `totalAccepted: 10`).
        *   `chartData`: An array of objects, where each object represents a day and its corresponding activity (e.g., `{ date: '2023-10-26', created: 5, approved: 3, rejected: 1 }`).
*   **Error Responses:**
    *   **401/403:** For authentication or authorization failures.
    *   **404 Not Found:** If the maker's own user document can't be found.
    *   **500 Internal Server Error:** For any database query failures.
