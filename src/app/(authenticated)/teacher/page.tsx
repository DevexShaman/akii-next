import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Layout from "@/components/Layout/Layout";
import DashboardPage from "@/components/Dashboard/DashboardPage";
import Teacher from "@/components/Teacher/Teacher";

export default function DashboardWrapper() {
  return (
    <ProtectedRoute>
      <Teacher />
    </ProtectedRoute>
  );
}
