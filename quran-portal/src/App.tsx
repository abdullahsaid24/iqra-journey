
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ClassProvider } from "@/contexts/ClassContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Index from "./pages/Index";
import ClassView from "./pages/ClassView";
import ClassAttendance from "./pages/ClassAttendance";
import Student from "./pages/Student";
import StudentStats from "./pages/StudentStats";
import NotFound from "./pages/NotFound";
import ParentChildView from "./pages/ParentChildView";
import Settings from "./pages/Settings";
import ParentDashboard from "./pages/ParentDashboard";
import AttendanceDashboard from "./pages/AttendanceDashboard";
import { ProtectedRoute } from "./components/routing/ProtectedRoute";
import { AdminTeacherRoute } from "./components/routing/AdminTeacherRoute";
import { ParentRoute } from "./components/routing/ParentRoute";
import { StudentRoute } from "./components/routing/StudentRoute";

// Create a new QueryClient instance
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          <ClassProvider>
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                
                {/* Default redirect for authenticated users */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <AdminTeacherRoute>
                        <Index />
                      </AdminTeacherRoute>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Admin/Teacher only routes */}
                <Route 
                  path="/class/:classId" 
                  element={
                    <ProtectedRoute>
                      <AdminTeacherRoute>
                        <ClassView />
                      </AdminTeacherRoute>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/class/:classId/attendance" 
                  element={
                    <ProtectedRoute>
                      <AdminTeacherRoute>
                        <ClassAttendance />
                      </AdminTeacherRoute>
                    </ProtectedRoute>
                  } 
                />
                
                {/* New Attendance Dashboard route */}
                <Route 
                  path="/attendance-dashboard" 
                  element={
                    <ProtectedRoute>
                      <AdminTeacherRoute>
                        <AttendanceDashboard />
                      </AdminTeacherRoute>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Student routes */}
                <Route 
                  path="/student" 
                  element={
                    <ProtectedRoute>
                      <StudentRoute>
                        <Student />
                      </StudentRoute>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/student/:id" 
                  element={
                    <ProtectedRoute>
                      <StudentRoute>
                        <Student />
                      </StudentRoute>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Shared routes (accessible to all authenticated users) */}
                <Route 
                  path="/student/:id/stats" 
                  element={
                    <ProtectedRoute>
                      <StudentStats />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Parent routes */}
                <Route 
                  path="/parent-dashboard" 
                  element={
                    <ProtectedRoute>
                      <ParentRoute>
                        <ParentDashboard />
                      </ParentRoute>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/parent/child/:childId" 
                  element={
                    <ProtectedRoute>
                      <ParentRoute>
                        <ParentChildView />
                      </ParentRoute>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Settings route (available to all authenticated users) */}
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Catch-all for non-existent routes */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              <Sonner />
            </BrowserRouter>
          </ClassProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
