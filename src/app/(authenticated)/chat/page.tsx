import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Chat from "@/components/Chat/Chat";

export default function DashboardWrapper() {
  return (
    <ProtectedRoute>
      <Chat />
    </ProtectedRoute>
  );
}
