# Checker Dashboard Feature Documentation

This document provides a detailed technical breakdown of the Checker Dashboard feature, which gives users with the "Checker" role an overview of question statistics and activity trends.

## Frontend

The frontend is a data-driven React component that visualizes statistics using cards and a time-series chart, complete with filtering capabilities.

### Component Breakdown

*   **`CheckerDashboard`**: The main component that manages state, fetches data from the API, and renders all UI elements.
*   **`StatCard`**: A reusable component for displaying a single key metric (e.g., "Total Questions") with a title, value, and icon.
*   **`TimeFilterButton`**: A reusable button component used for the quick selection of time ranges ("This Week", "This Month", "All Time").
*   **`LineChart` (from `recharts`)**: A component from the `recharts` library used to display a time-series chart of approved, rejected, and pending questions.
*   **`DatePicker` (from `react-datepicker`)**: A component for selecting a custom date range.
*   **`Loader`**: A standard component to show a loading animation while data is being fetched.

### UI/UX Elements and Layout

*   **Header**: Contains the main title "Checker Dashboard" and a subtitle.
*   **Filters**: A filter section allows the checker to control the time range for the displayed data.
    *   **Timeframe Buttons**: A button group for quick selection of "This Week", "This Month", or "All Time".
    *   **Date Picker**: A `DatePicker` component for selecting a custom start and end date.
*   **Stat Cards**: A grid of four `StatCard` components displaying high-level metrics: Total Questions, Approved, Rejected, and Newly Pending.
*   **Activity Trend Chart**: A `LineChart` that visualizes the number of approved, rejected, and newly pending questions per day over the selected time period.

### State Management

*   **`dashboardData`**: **Type**: `Object`, **Initial**: `{ stats: {}, chartData: [] }`, **Purpose**: Stores the entire data object (both stats and chart data) fetched from the backend.
*   **`loading`**: **Type**: `Boolean`, **Initial**: `true`, **Purpose**: Controls the visibility of the `Loader` component.
*   **`timeframe`**: **Type**: `String`, **Initial**: `"weekly"`, **Purpose**: Stores the active time filter ("weekly", "monthly", "all", or "custom").
*   **`dateRange`**: **Type**: `Array`, **Initial**: `[null, null]`, **Purpose**: Stores the start and end dates from the `DatePicker`.

### User Interactions and Event Handling

*   **`onClick` on TimeFilterButton**: Calls `handleTimeframeChange` to update the `timeframe` state, which triggers a `useEffect` to refetch the dashboard data.
*   **`onChange` on DatePicker**: Updates the `dateRange` state and sets the `timeframe` to "custom", which also triggers the data refetch.
*   **`useEffect` on Filter Change**: The `fetchDashboardData` function is wrapped in `useCallback` and listed as a dependency in a `useEffect` hook. This ensures that the API is called whenever `timeframe`, `startDate`, or `endDate` changes.

### API Calls

*   **Fetch Dashboard Data**
    *   **Function**: `fetchDashboardData`
    *   **Details**:
        *   **HTTP Method**: `GET`
        *   **API Endpoint URL**: `http://localhost:5000/api/checker/dashboard`
        *   **Headers**: Requires an `Authorization: Bearer <token>` header.
        *   **Query Parameters**: Sends the `timeframe` and, if applicable, `startDate` and `endDate` as query parameters.
    *   **State Handling**: On success, updates the `dashboardData` state. On error, logs a message. `setLoading(false)` is called in the `finally` block.

---

## Backend

The backend provides a single, powerful API endpoint that performs several complex aggregations to compile all the necessary statistics for the Checker Dashboard.

### API Endpoint

*   **Endpoint**: `GET /api/checker/dashboard`
*   **Responsibility**: To calculate and return a set of personalized and global statistics, as well as time-series data for the activity chart, based on an optional time filter.

### Authentication & Authorization

*   **Authentication**: Requires an authenticated user (`protect` middleware).
*   **Authorization**: Requires the user to have the `"checker"` role (`authorize('checker')` middleware).

### Request Structure

*   **Headers**: `Authorization: Bearer <jwt_token>` (Required).
*   **Query Parameters**:
    *   `timeframe` (String, optional, default: `"all"`): Can be `"weekly"`, `"monthly"`, or `"custom"`.
    *   `startDate`, `endDate` (String, optional): ISO 8601 date strings, required if `timeframe` is `"custom"`.

### Business Logic Flow

1.  **User and Date Setup**: The checker's ID is extracted from the JWT payload (`req.user._id`). The `getDateRange` helper function calculates the start and end dates for the database queries based on the request's query parameters.
2.  **Stat Calculations**: Several queries are run to calculate the key metrics for the `StatCard` components:
    *   **Total Questions**: A `countDocuments` query on the `Question` collection for all questions with a status of `Approved`, `Pending`, or `Finalised`.
    *   **Approved by Checker**: An aggregation query on the `Checker` collection. It filters the `checkeracceptedquestion` log array for the current user to count how many approval actions fall within the specified date range.
    *   **Rejected by Checker**: A `countDocuments` query on the `Question` collection for questions where `checkedBy` matches the current checker's ID and the `status` is `Rejected`.
    *   **Total Pending**: A `countDocuments` query for all questions in the system with a `status` of `Pending`.
3.  **Chart Data Aggregation**: A complex `$facet` aggregation is run on the `Question` collection to generate the time-series data for the line chart. It groups questions by date and calculates the daily counts for newly pending, approved, and rejected questions within the specified date range.
4.  **Response Compilation**: The results from the stat calculations and the chart data aggregation are combined into a single JSON object and sent in the response.

### Response Structure

*   **Success Response (`200 OK`)**:
    *   **Body**: A JSON object containing a `stats` object and a `chartData` array.
        ```json
        {
          "stats": {
            "totalQuestions": 500,
            "totalApproved": 120,
            "totalRejected": 15,
            "totalPending": 30
          },
          "chartData": [
            {
              "date": "2025-10-01",
              "approved": 10,
              "rejected": 2,
              "pending": 5
            },
            {
              "date": "2025-10-02",
              "approved": 8,
              "rejected": 0,
              "pending": 3
            }
          ]
        }
        ```
*   **Error Responses**:
    *   **`401 Unauthorized` / `403 Forbidden`**: If the user is not a properly authenticated checker.
    *   **`500 Internal Server Error`**: If any of the database queries or aggregations fail.
