import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ToastContainer from "./components/ToastContainer";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import CreateFamily from "./pages/CreateFamily";
import FamilySettings from "./pages/FamilySettings";
import FamilyMembers from "./pages/FamilyMembers";
import JoinRequests from "./pages/JoinRequests";
import JoinFamily from "./pages/JoinFamily";
import EditProfile from "./pages/EditProfile";
import FamilyTree from "./pages/FamilyTree";
import Posts from "./pages/Posts";
import MyPosts from "./pages/MyPosts";
import AlbumsPage from "./pages/AlbumsPage";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import EventsPage from "./pages/EventsPage"; // Family Events & Calendar

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Albums & Media Routes */}
          <Route
            path="/albums"
            element={
              <ProtectedRoute>
                <AlbumsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/albums/:id"
            element={
              <ProtectedRoute>
                <AlbumDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Family Events & Calendar Route */}
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventsPage />
              </ProtectedRoute>
            }
          />

          {/* Workspace & Directory Routes */}
          <Route
            path="/families/create"
            element={
              <ProtectedRoute>
                <CreateFamily />
              </ProtectedRoute>
            }
          />
          <Route
            path="/families/join"
            element={
              <ProtectedRoute>
                <JoinFamily />
              </ProtectedRoute>
            }
          />
          <Route
            path="/families/settings"
            element={
              <ProtectedRoute>
                <FamilySettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/families/members"
            element={
              <ProtectedRoute>
                <FamilyMembers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/families/join-requests"
            element={
              <ProtectedRoute>
                <JoinRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/families/tree"
            element={
              <ProtectedRoute>
                <FamilyTree />
              </ProtectedRoute>
            }
          />

          {/* Posts Routes */}
          <Route
            path="/posts"
            element={
              <ProtectedRoute>
                <Posts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/posts/my-posts"
            element={
              <ProtectedRoute>
                <MyPosts />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}