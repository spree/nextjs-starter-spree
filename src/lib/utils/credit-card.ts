import type { PaymentType } from "react-svg-credit-card-payment-icons";

const CC_TYPE_MAP: Record<string, PaymentType> = {
  visa: "Visa",
  mastercard: "Mastercard",
  master: "Mastercard",
  american_express: "AmericanExpress",
  amex: "AmericanExpress",
  discover: "Discover",
  jcb: "JCB",
  diners_club: "DinersClub",
  maestro: "Maestro",
  unionpay: "UnionPay",
};

export function getCardIconType(ccType: string): PaymentType {
  return CC_TYPE_MAP[ccType.toLowerCase()] ?? "Generic";
}

export function getCardLabel(ccType: string): string {
  switch (ccType.toLowerCase()) {
    case "visa":
      return "Visa";
    case "mastercard":
    case "master":
      return "Mastercard";
    case "american_express":
    case "amex":
      return "Amex";
    case "discover":
      return "Discover";
    case "jcb":
      return "JCB";
    case "diners_club":
      return "Diners Club";
    case "maestro":
      return "Maestro";
    case "unionpay":
      return "UnionPay";
    default:
      return ccType || "Card";
  }
}
