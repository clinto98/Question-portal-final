// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AdminLogin from "./pages/login/AdminLogin";
import ExpertLogin from "./pages/login/ExpertLogin.jsx";
import AdminPage from "./pages/AdminPage";
import MakerPage from "./pages/MakerPage";
import CheckerPage from "./pages/CheckerPage";
import ExpertPage from "./pages/ExpertPage.jsx";
import "./App.css"
import CreateQuestion from "./pages/maker/CreateQuestion";
import DraftQuestions from "./pages/maker/DraftQuestions";
import SubmittedQuestions from "./pages/maker/SubmittedQuestions";
import CheckerReview from "./pages/checker/CheckerReview";
import AcceptedQuestions from "./pages/checker/AcceptedQuestions";
import PdfUploadPage from "./pages/admin/PdfUploadPage";
import CreateUserPage from "./pages/admin/CreateUserPage";
import ShowallUsersPage from "./pages/admin/ShowallUsersPage";
import PdfListPage from "./pages/admin/PdfListPage";
import QuestionDetailPage from "./pages/checker/QuestionDetailPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AvailablePdfsPage from "./pages/maker/AvailablePdfsPage";
import ClaimedPdfsPage from "./pages/maker/ClaimedPdfsPage";
import ShowQuestionPaper from "./pages/checker/ShowQuestionPaper";
import CreateCoursePage from "./pages/admin/CreateCoursePage";
import ViewCoursesPage from "./pages/admin/ViewCoursesPage";
import EditRejectedQuestion from "./pages/maker/EditRejectedQuestion";
import MakerDashboard from "./pages/maker/MakerDashboard";
import CheckerDashboard from "./pages/checker/CheckerDashboard";
import ExpertEditPage from "./pages/expert/ExpertEditPage.jsx";
import FinalizeQuestionPage from "./pages/expert/FinalizeQuestionPage.jsx";
import FinalizedQuestionsPage from "./pages/expert/FinalizedQuestionsPage.jsx";
import ExpertQuestionDetailPage from "./pages/expert/ExpertQuestionDetailPage.jsx";
import LoginPage from "./pages/login/LoginPage";
import { Toaster } from "react-hot-toast";
import Loader from "./components/Loader";
import ReportPage from "./pages/admin/ReportPage";
import PayoutPage from "./pages/admin/PayoutPage"; // Import PayoutPage
import UpdatePricing from "./pages/admin/UpdatePricing";
import UpdatePasswordPage from "./pages/maker/UpdatePasswordPage";

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();

  // Show loader while checking auth
  if (loading) {
    return (
      <Loader></Loader>
    );
  }

  // Check role (safely, since user is guaranteed now)
  if (role && user.role !== role) {
    if (user.role === "maker")
      return <Navigate to="/maker/create" replace />;
    if (user.role === "checker")
      return <Navigate to="/checker/review" replace />;
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "expert") return <Navigate to="/expert/finalize" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}



export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/login/expert" element={<ExpertLogin />} />

          {/* Protected */}

          <Route
            path="/admin"
            element={
              <PrivateRoute role="admin">
                <AdminPage />
              </PrivateRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="pdf-upload" element={<PdfUploadPage />} />
            <Route path="create-user" element={<CreateUserPage />} />
            <Route path="show-users" element={<ShowallUsersPage />} />
            <Route path="list-pdf" element={<PdfListPage />} />
            <Route path="admin-dashboard" element={<AdminDashboard />} />
            <Route path="create-courses" element={<CreateCoursePage />} />
            <Route path="view-courses" element={<ViewCoursesPage />} />
            <Route path="reports" element={<ReportPage />} />
            <Route path="payouts" element={<PayoutPage />} /> {/* New Payouts Route */}
            <Route path="update-pricing" element={<UpdatePricing />} />
          </Route>
          <Route
            path="/maker"
            element={
              <PrivateRoute role="maker">
                <MakerPage />
              </PrivateRoute>
            }
          >
            <Route index element={<MakerDashboard />} />
            <Route path="create" element={<CreateQuestion />} />
            <Route path="create/:id" element={<CreateQuestion />} />
            <Route path="editrejected/:id" element={<EditRejectedQuestion />} />
            <Route path="drafts" element={<DraftQuestions />} />
            <Route path="submitted" element={<SubmittedQuestions />} />
            <Route path="availabe-pdfs" element={<AvailablePdfsPage />} />
            <Route path="claimed-pdfs" element={<ClaimedPdfsPage />} />
            <Route path="dashboard" element={<MakerDashboard />} />
            <Route path="update-password" element={<UpdatePasswordPage />} />
          </Route>

          <Route
            path="/checker"
            element={
              <PrivateRoute role="checker">
                <CheckerPage />
              </PrivateRoute>
            }
          >
            <Route index element={<CheckerDashboard />} />
            <Route path="review" element={<CheckerReview />} />
            <Route path="accepted" element={<AcceptedQuestions />} />
            <Route path="details/:id" element={<QuestionDetailPage />} />
            <Route path="claimed-pdfs" element={<ShowQuestionPaper />} />
            <Route path="dashboard" element={<CheckerDashboard />} />
          </Route>

          <Route
            path="/expert"
            element={
              <PrivateRoute role="expert">
                <ExpertPage />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="finalize" replace />} />
            <Route path="finalize" element={<FinalizeQuestionPage />} />
            <Route path="finalized" element={<FinalizedQuestionsPage />} />
            <Route path="question/edit/:id" element={<ExpertEditPage />} />
            <Route path="question/view/:id" element={<ExpertQuestionDetailPage />} />
            <Route path="finalized-question/view/:id" element={<ExpertQuestionDetailPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
