import { CardWorkspacePage } from "../_components/card-workspace-page";
import { PlanGate } from "../_components/plan-gate";

export default function PaymentsPage() {
  return (
    <PlanGate moduleName="Payments">
      <CardWorkspacePage
        table="payments"
        title="Payments"
        eyebrow="Payment ledger"
        description="Record money collected and review payments as a finance activity stream."
        actionLabel="Record payment"
        titleKey="payment_method"
        metaKeys={["notes"]}
        moneyKey="amount"
        dateKey="payment_date"
        variant="cashflow"
        fields={[
          { name: "amount", label: "Amount", type: "number", required: true },
          { name: "payment_method", label: "Payment method", type: "select", options: ["Card", "Bank transfer", "Cash", "Online"] },
          { name: "payment_date", label: "Payment date", type: "date" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </PlanGate>
  );
}
