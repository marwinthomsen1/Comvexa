import { LocalUltraCrudPage } from "../_components/local-ultra-crud-page";

export default function PurchaseOrdersPage() {
  return (
    <LocalUltraCrudPage
      moduleName="Purchase Orders"
      title="Purchase Orders"
      description="Create and track supplier purchase orders, delivery dates, branch needs, and approval status."
      storageKey="comvexa-ultra-purchase-orders"
      actionLabel="Add purchase order"
      variant="procurement"
      fields={[
        { name: "supplier", label: "Supplier", required: true },
        { name: "item", label: "Item or order title", required: true },
        { name: "branch", label: "Branch" },
        { name: "amount", label: "Amount", type: "number" },
        { name: "expectedDate", label: "Expected delivery", type: "date" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "supplier", label: "Supplier" },
        { key: "item", label: "Order" },
        { key: "branch", label: "Branch" },
        { key: "amount", label: "Amount" },
        { key: "expectedDate", label: "Delivery" },
      ]}
    />
  );
}
