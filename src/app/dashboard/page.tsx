import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import Layout from '@/components/Layout/Layout';
import DashboardPage from '@/components/Dashboard/DashboardPage';

export default function DashboardWrapper() {
  return (
    <ProtectedRoute>
        <DashboardPage />
    </ProtectedRoute>
  );
}
