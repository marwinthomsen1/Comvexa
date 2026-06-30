import { SupabaseCrudPage } from "../_components/supabase-crud-page";
import { PaymentGate } from "../_components/payment-gate";

export default function CustomersPage() {
  return (
    <PaymentGate>
    <SupabaseCrudPage
      table="customers"
      title="Customer Management"
      description="Create and manage customer profiles for the signed-in company workspace."
      actionLabel="Add customer"
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone", type: "tel" },
        { name: "address", label: "Address" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "name", label: "Customer" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "address", label: "Address" },
        { key: "created_at", label: "Created", format: "date" },
      ]}
    />
    </PaymentGate>
  );
}
