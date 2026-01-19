
import { Routes, Route } from "react-router-dom";
import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";

// Import main site pages
import Index from "@/pages/Index";
import About from "@/pages/About";
import Classes from "@/pages/Classes";
import NotFound from "@/pages/NotFound";
import Signup from "@/pages/Signup";
import Success from "@/pages/Success";
import Admin from "@/pages/Admin";

// Import Quran portal pages and components
import { ClassProvider } from "@/quran/contexts/ClassContext";
import QuranLanding from "@/quran/pages/Landing";
import QuranLogin from "@/quran/pages/Login";
import QuranDashboard from "@/quran/pages/Index";
import QuranClassView from "@/quran/pages/ClassView";
import QuranClassAttendance from "@/quran/pages/ClassAttendance";
import QuranStudent from "@/quran/pages/Student";
import QuranStudentStats from "@/quran/pages/StudentStats";
import QuranSettings from "@/quran/pages/Settings";
import QuranParentDashboard from "@/quran/pages/ParentDashboard";
import QuranParentChildView from "@/quran/pages/ParentChildView";
import QuranAttendanceDashboard from "@/quran/pages/AttendanceDashboard";
import { ProtectedRoute } from "@/quran/components/routing/ProtectedRoute";
import { AdminTeacherRoute } from "@/quran/components/routing/AdminTeacherRoute";
import { ParentRoute } from "@/quran/components/routing/ParentRoute";
import { StudentRoute } from "@/quran/components/routing/StudentRoute";

// Create query client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          <ClassProvider>
            <Routes>
              {/* Main site routes */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/success" element={<Success />} />
              <Route path="/admin" element={<Admin />} />

              {/* Quran Portal routes */}
              <Route path="/quran" element={<QuranLanding />} />
              <Route path="/quran/login" element={<QuranLogin />} />

              <Route path="/quran/dashboard" element={
                <ProtectedRoute>
                  <AdminTeacherRoute>
                    <QuranDashboard />
                  </AdminTeacherRoute>
                </ProtectedRoute>
              } />

              <Route path="/quran/class/:classId" element={
                <ProtectedRoute>
                  <AdminTeacherRoute>
                    <QuranClassView />
                  </AdminTeacherRoute>
                </ProtectedRoute>
              } />

              <Route path="/quran/class/:classId/attendance" element={
                <ProtectedRoute>
                  <AdminTeacherRoute>
                    <QuranClassAttendance />
                  </AdminTeacherRoute>
                </ProtectedRoute>
              } />

              <Route path="/quran/attendance-dashboard" element={
                <ProtectedRoute>
                  <AdminTeacherRoute>
                    <QuranAttendanceDashboard />
                  </AdminTeacherRoute>
                </ProtectedRoute>
              } />

              <Route path="/quran/student" element={
                <ProtectedRoute>
                  <StudentRoute>
                    <QuranStudent />
                  </StudentRoute>
                </ProtectedRoute>
              } />

              <Route path="/quran/student/:id" element={
                <ProtectedRoute>
                  <StudentRoute>
                    <QuranStudent />
                  </StudentRoute>
                </ProtectedRoute>
              } />

              <Route path="/quran/student/:id/stats" element={
                <ProtectedRoute>
                  <QuranStudentStats />
                </ProtectedRoute>
              } />

              <Route path="/quran/parent-dashboard" element={
                <ProtectedRoute>
                  <ParentRoute>
                    <QuranParentDashboard />
                  </ParentRoute>
                </ProtectedRoute>
              } />

              <Route path="/quran/parent/child/:childId" element={
                <ProtectedRoute>
                  <ParentRoute>
                    <QuranParentChildView />
                  </ParentRoute>
                </ProtectedRoute>
              } />

              <Route path="/quran/settings" element={
                <ProtectedRoute>
                  <QuranSettings />
                </ProtectedRoute>
              } />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            <Toaster />
            <Sonner />
          </ClassProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
