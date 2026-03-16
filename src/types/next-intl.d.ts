import type messages from "../../messages/en.json";

type Messages = typeof messages;

declare global {
  interface IntlMessages extends Messages {}
}
