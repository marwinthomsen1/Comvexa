// Frontend illustration only. No campaign records or actual editor state are changed.
export function validateDemoPrice(value) {
  return (
    typeof value === "string" &&
    (value === "" || (/^\d{1,6}$/.test(value) && Number(value) <= 999999))
  );
}
export function formatDemoPrice(value) {
  if (!validateDemoPrice(value))
    throw new Error("Enter a whole price from 0 to 999999.");
  return value === ""
    ? "—"
    : new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
      }).format(Number(value));
}
