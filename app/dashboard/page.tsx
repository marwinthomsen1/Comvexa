import { DashboardOverview } from "./dashboard-overview";
import { PaymentGate } from "./_components/payment-gate";

export default function DashboardPage() {
  return (
    <PaymentGate>
      <DashboardOverview />
    </PaymentGate>
  );
}
