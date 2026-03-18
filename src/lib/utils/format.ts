export function formatDate(dateString: string | null, fallback = "-"): string {
  if (!dateString) return fallback;
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getPaymentStatusColor(state: string | null): string {
  switch (state) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "balance_due":
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
    case "void":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getFulfillmentStatusColor(state: string | null): string {
  switch (state) {
    case "shipped":
    case "delivered":
      return "bg-green-100 text-green-800";
    case "ready":
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "canceled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
