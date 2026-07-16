import { AdminDashboard } from "./admin-dashboard";
import { AdminMfaGuard } from "./admin-mfa-guard";

export default function AdminPage() {
  return (
    <AdminMfaGuard>
      <AdminDashboard />
    </AdminMfaGuard>
  );
}
