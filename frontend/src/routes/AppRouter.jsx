import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "../auth/useAuthStore";

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      <p className="text-gray-600 text-sm">Loading...</p>
    </div>
  </div>
);

// Auth components (keep these as regular imports since they're used immediately)
import Login from "../auth/Login";
import Register from "../auth/Register";
import ClientPasswordReset from "../auth/ClientPasswordReset";
import AdminLogin from "../auth/AdminLogin";

// Layouts (keep these as regular imports since they're structural)
import ClientLayout from "../layout/ClientLayout";
import SuperAdminLayout from "../layout/SuperAdminLayout";

// Dynamic imports for code splitting
const ClientDashboard = React.lazy(() => import("../pages/client/Dashboard"));
const TicketCreate = React.lazy(() => import("../pages/client/TicketCreate"));
const TicketView = React.lazy(() => import("../pages/client/TicketView"));
const TicketDetailView = React.lazy(() =>
  import("../pages/client/TicketDetailView")
);
const Profile = React.lazy(() => import("../pages/client/Profile"));

// Super Admin/Admin pages - lazy loaded
const SuperAdminDashboard = React.lazy(() =>
  import("../pages/superadmin/Dashboard")
);
const ClientsView = React.lazy(() => import("../pages/superadmin/ClientsView"));
const SuperAdminTicketsView = React.lazy(() =>
  import("../pages/superadmin/TicketsView")
);
const SuperAdminTicketDetailPage = React.lazy(() =>
  import("../pages/superadmin/SuperAdminTicketDetailPage")
);
const ClientDetailView = React.lazy(() =>
  import("../pages/superadmin/ClientDetailView")
);
const CompaniesView = React.lazy(() =>
  import("../pages/superadmin/CompaniesView")
);
const CreateCompany = React.lazy(() =>
  import("../pages/superadmin/CreateCompany")
);
const CompanyDetailView = React.lazy(() =>
  import("../pages/superadmin/CompanyDetailView")
);
const EditCompany = React.lazy(() => import("../pages/superadmin/EditCompany"));

// Protected Route
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const AppRouter = () => {
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  const getDashboardPath = () => {
    if (user?.role === "superadmin" || user?.role === "admin")
      return "/superadmin/dashboard";
    return "/client/dashboard";
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={getDashboardPath()} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to={getDashboardPath()} replace />
          ) : (
            <Register />
          )
        }
      />
      <Route path="/client/password-reset" element={<ClientPasswordReset />} />
      <Route
        path="/admin/login"
        element={
          isAuthenticated ? (
            <Navigate to={getDashboardPath()} replace />
          ) : (
            <AdminLogin />
          )
        }
      />

      {/* Client Routes */}
      <Route
        path="/client"
        element={
          <ProtectedRoute allowedRoles={["client"]}>
            <ClientLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<PageLoader />}>
              <ClientDashboard />
            </Suspense>
          }
        />
        <Route
          path="create-ticket"
          element={
            <Suspense fallback={<PageLoader />}>
              <TicketCreate />
            </Suspense>
          }
        />
        <Route
          path="tickets"
          element={
            <Suspense fallback={<PageLoader />}>
              <TicketView />
            </Suspense>
          }
        />
        <Route
          path="tickets/:ticket_id"
          element={
            <Suspense fallback={<PageLoader />}>
              <TicketDetailView />
            </Suspense>
          }
        />
        <Route
          path="profile"
          element={
            <Suspense fallback={<PageLoader />}>
              <Profile />
            </Suspense>
          }
        />
      </Route>

      {/* Superadmin/Admin Shared Routes */}
      <Route
        path="/superadmin"
        element={
          <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<PageLoader />}>
              <SuperAdminDashboard />
            </Suspense>
          }
        />
        <Route
          path="clients"
          element={
            <Suspense fallback={<PageLoader />}>
              <ClientsView />
            </Suspense>
          }
        />
        <Route
          path="clients/:client_id"
          element={
            <Suspense fallback={<PageLoader />}>
              <ClientDetailView />
            </Suspense>
          }
        />
        <Route
          path="tickets"
          element={
            <Suspense fallback={<PageLoader />}>
              <SuperAdminTicketsView />
            </Suspense>
          }
        />
        <Route
          path="tickets/:ticket_id"
          element={
            <div className="p-6 min-h-screen bg-white">
              <Suspense fallback={<PageLoader />}>
                <SuperAdminTicketDetailPage />
              </Suspense>
            </div>
          }
        />
        <Route
          path="companies"
          element={
            <Suspense fallback={<PageLoader />}>
              <CompaniesView />
            </Suspense>
          }
        />
        <Route
          path="companies/create"
          element={
            <Suspense fallback={<PageLoader />}>
              <CreateCompany />
            </Suspense>
          }
        />
        <Route
          path="companies/edit/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <EditCompany />
            </Suspense>
          }
        />
        <Route
          path="companies/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <CompanyDetailView />
            </Suspense>
          }
        />
      </Route>

      {/* Redirect root to appropriate dashboard */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={getDashboardPath()} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Unauthorized Page */}
      <Route
        path="/unauthorized"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md mx-auto p-6">
              <div className="mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <svg
                    className="h-8 w-8 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-red-600 mb-4">
                  Unauthorized
                </h1>
                <p className="text-gray-600 mb-6">
                  You don't have permission to access this page. Your current
                  role ({user?.role || "unknown"}) is not authorized for this
                  resource.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => window.history.back()}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Go Back
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Logout & Login as Different User
                </button>

                <button
                  onClick={() =>
                    (window.location.href = isAuthenticated
                      ? getDashboardPath()
                      : "/login")
                  }
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Go to Dashboard
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Need help? Contact your system administrator.
                </p>
              </div>
            </div>
          </div>
        }
      />

      {/* 404 Not Found */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md mx-auto p-6">
              <div className="mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                  <svg
                    className="h-8 w-8 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-gray-600 mb-6">
                  The page you're looking for doesn't exist.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => window.history.back()}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Go Back
                </button>

                <button
                  onClick={() =>
                    (window.location.href = isAuthenticated
                      ? getDashboardPath()
                      : "/login")
                  }
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRouter;
