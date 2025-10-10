# Admin Dashboard Feature Documentation

This document provides a detailed technical breakdown of the Admin Dashboard feature, which provides a comprehensive overview of the platform's activity and performance metrics.

## Frontend

The frontend is a sophisticated React component that fetches and displays various statistics in a user-friendly dashboard layout. It includes data filtering capabilities and several data visualization components.

### Component Breakdown

*   **`AdminDashboard`**: The main parent component that manages state, fetches data, and orchestrates the layout.
*   **`StatCard`**: A reusable component to display a single, high-level statistic (e.g., "Total Created"). It consists of an icon, a title, and a large numerical value.
*   **`PerformanceTable`**: A reusable component for displaying tabular data, such as the performance metrics for Makers and Checkers. It includes headers and dynamically renders rows.
*   **`Loader`**: A simple component to show a loading animation while data is being fetched.

### UI/UX Elements and Layout

*   **Header**: Contains the main title "Admin Dashboard" and a subtitle.
*   **Filters**: A filter section allows the admin to control the time range for the displayed data.
    *   **Timeframe Buttons**: Buttons for quick selection of "weekly", "monthly", or "all" time.
    *   **Date Picker**: A `react-datepicker` component that allows for selecting a custom start and end date. Selecting a custom range automatically sets the timeframe to "custom".
*   **Summary Cards**: A grid of `StatCard` components displaying key metrics like Total Created, Approved, Rejected, and Pending questions.
*   **Data Visualizations**:
    *   **Question Status Distribution**: A `PieChart` (from `recharts`) that shows the proportion of questions in each status (Approved, Rejected, Pending, Draft).
    *   **Top Maker Performance**: A `PerformanceTable` listing the most active makers and their stats (created, approved, pending, etc.).
    *   **Checker Performance**: A `PerformanceTable` showing checker statistics (reviewed, approved, rejected, etc.).
*   **Loading/Error State**: The UI displays a `Loader` component while fetching data. If data fails to load, an error message is shown.

### State Management

The component uses `useState` hooks to manage its state.

*   **`dashboardData`**:
    *   **Type**: `Object | null`
    *   **Initial Value**: `null`
    *   **Purpose**: Stores the entire data object fetched from the backend API.
*   **`loading`**:
    *   **Type**: `Boolean`
    *   **Initial Value**: `true`
    *   **Purpose**: Controls the visibility of the `Loader` component.
*   **`timeframe`**:
    *   **Type**: `String`
    *   **Initial Value**: `"weekly"`
    *   **Purpose**: Stores the currently selected time filter ("weekly", "monthly", "all", or "custom"). This value is sent as a query parameter to the API.
*   **`dateRange`**:
    *   **Type**: `Array`
    *   **Initial Value**: `[null, null]`
    *   **Purpose**: Stores the start and end dates selected from the `DatePicker`.

### User Interactions and Event Handling

*   **`onClick` on Timeframe Buttons**:
    *   **Handler**: `handleTimeframeChange(timeframe)`
    *   **Action**: Updates the `timeframe` state and clears the `dateRange` if the new timeframe is not "custom". This triggers a `useEffect` to refetch data.
*   **`onChange` on DatePicker**:
    *   **Handler**: `(update) => { setDateRange(update); handleTimeframeChange("custom"); }`
    *   **Action**: Updates the `dateRange` state with the new start and end dates and sets the `timeframe` state to "custom", which triggers a data refetch.

### API Calls

*   **Function**: `fetchDashboardData` (wrapped in `useCallback`)
*   **Trigger**: This function is called by a `useEffect` hook whenever `timeframe`, `startDate`, or `endDate` changes.
*   **Details**:
    *   **HTTP Method**: `GET`
    *   **API Endpoint URL**: `http://localhost:5000/api/admin/dashboard-stats`
    *   **Headers**: An `Authorization` header with the `Bearer` token is required.
    *   **Query Parameters**: The request includes query parameters based on the filter state.
        *   `timeframe`: e.g., `"weekly"`
        *   `startDate` (optional): e.g., `"2025-10-01T00:00:00.000Z"`
        *   `endDate` (optional): e.g., `"2025-10-08T23:59:59.999Z"`
*   **State Handling**:
    *   `setLoading(true)` is called at the beginning of the fetch.
    *   On success, the response data is stored using `setDashboardData(res.data)`.
    *   On error, a message is logged to the console.
    *   `setLoading(false)` is called in the `finally` block to hide the loader regardless of outcome.

---

## Backend

The backend provides a single, powerful API endpoint to aggregate and calculate all statistics required for the Admin Dashboard.

### API Endpoint

*   **Endpoint**: `GET /api/admin/dashboard-stats`
*   **Responsibility**: To gather, process, and return a wide range of performance and status metrics based on an optional time filter.

### Authentication & Authorization

*   **Authentication**: Requires an authenticated user. The `protect` middleware validates the JWT.
*   **Authorization**: Requires the user to have the `"admin"` role. The `authorize('admin')` middleware enforces this.

### Request Structure

*   **Headers**:
    *   `Authorization: Bearer <jwt_token>` (Required)
*   **Query Parameters**:
    *   `timeframe` (String, optional, default: `"all"`): Can be `"weekly"`, `"monthly"`, or `"custom"`.
    *   `startDate` (String, optional): An ISO 8601 date string. Required if `timeframe` is `"custom"`.
    *   `endDate` (String, optional): An ISO 8601 date string. Required if `timeframe` is `"custom"`.

### Business Logic Flow

1.  **Date Range Calculation**: The `getDateRange` helper function determines the `startDate` and `endDate` based on the `timeframe` query parameter.
2.  **Summary Statistics**: A `Promise.all` call runs multiple `countDocuments` queries in parallel on the `Question` collection to get counts for total created, approved, rejected, and resubmitted questions within the calculated date range. It also gets a separate, all-time count of pending questions.
3.  **Status Distribution**: An aggregation pipeline on the `Question` collection groups all questions by their `status` field and counts the number in each group.
4.  **Maker Performance**: A complex aggregation pipeline is executed on the `Question` collection to calculate performance for the top 10 makers within the date range. This involves filtering by date, grouping by maker, looking up maker details from the `makers` collection, and calculating historical rejections from a log within the maker document.
5.  **Checker Performance**: A similar aggregation pipeline is run to find the top 10 checkers. It filters reviewed questions by date, groups by checker, looks up details from the `checkers` collection, and calculates metrics.
6.  **Response Compilation**: All the calculated data is compiled into a single JSON object and sent in the response.

### Response Structure

*   **Success Response (`200 OK`)**:
    *   **Body**: A JSON object with the following structure:
        ```json
        {
          "summary": {
            "totalCreated": 150,
            "totalApproved": 100,
            "totalRejected": 20,
            "totalResubmitted": 5,
            "totalPending": 25
          },
          "statusDistribution": [
            { "status": "Approved", "count": 100 },
            { "status": "Rejected", "count": 20 },
            { "status": "Pending", "count": 25 },
            { "status": "Draft", "count": 5 }
          ],
          "makerPerformance": [
            {
              "name": "Maker One",
              "totalCreated": 50,
              "approved": 40,
              "pending": 5,
              "drafted": 5,
              "historicalRejections": 2
            }
          ],
          "checkerPerformance": [
            {
              "name": "Checker One",
              "totalReviewed": 60,
              "approved": 55,
              "rejected": 5,
              "falseRejections": 1
            }
          ]
        }
        ```
*   **Error Responses**:
    *   **`401 Unauthorized`**: If the JWT is missing, invalid, or expired.
    *   **`403 Forbidden`**: If the authenticated user is not an admin.
    *   **`500 Internal Server Error`**: If any of the database queries or aggregations fail.
        ```json
        { "message": "Server error while fetching dashboard statistics." }
        ```
