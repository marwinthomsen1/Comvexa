import { SupabaseCrudPage } from "../_components/supabase-crud-page";
import { PlanGate } from "../_components/plan-gate";

export default function InventoryPage() {
  return (
    <PlanGate moduleName="Inventory">
    <SupabaseCrudPage
      table="inventory_items"
      title="Inventory"
      description="Manage stock items, units, supplier names, and low-stock alert levels."
      actionLabel="Add item"
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "quantity", label: "Quantity", type: "number" },
        { name: "unit", label: "Unit" },
        { name: "low_stock_alert", label: "Low stock alert", type: "number" },
        { name: "supplier", label: "Supplier" },
      ]}
      columns={[
        { key: "name", label: "Item" },
        { key: "quantity", label: "Quantity" },
        { key: "unit", label: "Unit" },
        { key: "low_stock_alert", label: "Low stock alert" },
        { key: "supplier", label: "Supplier" },
      ]}
    />
    </PlanGate>
  );
}
