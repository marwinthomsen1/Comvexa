import { AdminDashboard } from "./admin-dashboard";
import { AdminMfaGuard } from "./admin-mfa-guard";
import "./admin.css";

export default function AdminPage() {
  return (
    <AdminMfaGuard>
      <AdminDashboard />
    </AdminMfaGuard>
  );
}
