import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/routing/AdminRoute";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import NotAuthorized from "./pages/NotAuthorized";
import TeacherHome from "./pages/TeacherHome";
import StudentsPage from "./pages/StudentsPage";
import RoomsPage from "./pages/RoomsPage";
import { RoomDetailPage } from "./pages/RoomDetailPage";
import { StudentActivityPage } from "./pages/StudentActivityPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import ProfilePage from "./pages/ProfilePage";
import StudentPortalRedirect from "./pages/StudentPortalRedirect";
import StudentPortalPage from "./pages/StudentPortalPage";
import StudentPracticeModePage from "./pages/StudentPracticeModePage";
import QuestionPapersPage from "./pages/QuestionPapersPage";
import TeacherOnboardingPage from "./pages/TeacherOnboardingPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminTeachers from "./pages/admin/AdminTeachers";
import AdminNewsletters from "./pages/admin/AdminNewsletters";
import AdminOnboardTeacher from "./pages/admin/AdminOnboardTeacher";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAvailability from "./pages/admin/AdminAvailability";
import ClassConfigurations from "./pages/admin/ClassConfigurations";
import ClassSchedule from "./pages/admin/ClassSchedule";
import { Footer } from "@/components/layout/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import { GradeFilterProvider } from "@/contexts/GradeFilterContext";
import { SubmissionStoreProvider } from "@/context/SubmissionStore";
import TeacherCreateAssignmentPage from "./pages/teacher/TeacherCreateAssignmentPage";
import TeacherAssignmentsListPage from "./pages/teacher/TeacherAssignmentsListPage";
import TeacherResultDeclarationPage from "./pages/teacher/TeacherResultDeclarationPage";
import TeacherAssignmentReviewPage from "./pages/teacher/TeacherAssignmentReviewPage";
import StudentAssignmentsListPage from "./pages/student/StudentAssignmentsListPage";
import StudentSubmitAssignmentPage from "./pages/student/StudentSubmitAssignmentPage";
import StudentFeedbackPage from "@/pages/student/StudentFeedbackPage";
import StudentLoginPage from "./pages/student/StudentLoginPage";
import StudentHomePage from "./pages/student/StudentHomePage";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <Auth0Provider
        domain="dev-jbrriuc5vyjmiwtx.us.auth0.com"
        clientId="hRgZXlSYVCedu8jYuTWadyoTA3T8EISD"
        cacheLocation="localstorage"
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: "https://dev-jbrriuc5vyjmiwtx.us.auth0.com/userinfo"
        }}
      >
        <AuthProvider>
        <GradeFilterProvider>
        <SubmissionStoreProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {/* Main app content */}
            <div className="min-h-screen flex flex-col">
              <Routes>
                {/* Routes without sidebar */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/teacher-onboarding" element={<TeacherOnboardingPage />} />
                <Route path="/student-portal" element={<StudentPortalPage />} />

                {/* Student PIN-based login */}
                <Route path="/student" element={<StudentLoginPage />} />
                <Route path="/student/home" element={<StudentHomePage />} />

                {/* Practice Mode route for students */}
                <Route path="/student/practice" element={<StudentPracticeModePage />} />
                <Route path="/not-authorized" element={<NotAuthorized />} />
                <Route path="/admin" element={<AdminLoginPage />} />
                
                {/* Admin routes */}
                <Route path="/admin/dashboard" element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }>
                  <Route index element={<AdminDashboard />} />
                </Route>
                <Route path="/admin/teachers" element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }>
                  <Route index element={<AdminTeachers />} />
                </Route>
                <Route path="/admin/onboard" element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }>
                  <Route index element={<AdminOnboardTeacher />} />
                </Route>
                <Route path="/admin/newsletters" element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }>
                  <Route index element={<AdminNewsletters />} />
                </Route>
                <Route path="/admin/availability" element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }>
                  <Route index element={<AdminAvailability />} />
                </Route>
                <Route path="/admin/students" element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }>
                  <Route index element={<AdminStudents />} />
                </Route>
                <Route path="/admin/classes" element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }>
                  <Route index element={<ClassConfigurations />} />
                </Route>
                <Route path="/admin/schedule" element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }>
                  <Route index element={<ClassSchedule />} />
                </Route>
                <Route path="/admin/settings" element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }>
                  <Route index element={<AdminSettings />} />
                </Route>

                {/* Subjective assignments - teacher/student UX */}
                <Route path="/teacher/assignments" element={<TeacherAssignmentsListPage />} />
                <Route path="/teacher/assignments/new" element={<TeacherCreateAssignmentPage />} />
                <Route path="/student/assignments" element={<StudentAssignmentsListPage />} />
                <Route
                  path="/student/assignments/:assignmentId/submit"
                  element={<StudentSubmitAssignmentPage />}
                />
                <Route path="/student/feedback/:submissionId" element={<StudentFeedbackPage />} />
                
                {/* Protected routes - full width, no sidebar */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <TeacherHome />
                  </ProtectedRoute>
                } />
                <Route path="/students" element={
                  <ProtectedRoute>
                    <StudentsPage />
                  </ProtectedRoute>
                } />
                <Route path="/rooms" element={
                  <ProtectedRoute>
                    <RoomsPage />
                  </ProtectedRoute>
                } />
                <Route path="/rooms/:roomId" element={
                  <ProtectedRoute>
                    <RoomDetailPage />
                  </ProtectedRoute>
                } />
                <Route path="/rooms/:roomId/student/:studentId" element={
                  <ProtectedRoute>
                    <StudentActivityPage />
                  </ProtectedRoute>
                } />
                <Route path="/assignments" element={
                  <ProtectedRoute>
                    <AssignmentsPage />
                  </ProtectedRoute>
                } />
                <Route path="/assignments/review-results" element={
                  <ProtectedRoute>
                    <TeacherResultDeclarationPage />
                  </ProtectedRoute>
                } />
                <Route path="/teacher/assignment-review/:assignmentId" element={
                  <ProtectedRoute>
                    <TeacherAssignmentReviewPage />
                  </ProtectedRoute>
                } />
                <Route path="/question-papers" element={
                  <ProtectedRoute>
                    <QuestionPapersPage />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/student-portal-redirect" element={
                  <ProtectedRoute>
                    <StudentPortalRedirect />
                  </ProtectedRoute>
                } />
                
                {/* 404 - Must be last */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Footer />
            </div>
          </BrowserRouter>
        </TooltipProvider>
        </SubmissionStoreProvider>
        </GradeFilterProvider>
        </AuthProvider>
      </Auth0Provider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
