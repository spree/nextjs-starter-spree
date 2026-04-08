import type { CustomField } from "@spree/sdk";
import { useTranslations } from "next-intl";

interface ProductCustomFieldsProps {
  customFields?: Array<CustomField>;
}

function normalizeType(type: string): string {
  return type.split("::").pop() || type;
}

function renderBooleanValue(
  value: unknown,
  t: ReturnType<typeof useTranslations<"products">>,
): React.ReactNode {
  return value ? t("yes") : t("no");
}

function renderValue(
  field: CustomField,
  normalizedType: string,
  t: ReturnType<typeof useTranslations<"products">>,
): React.ReactNode {
  switch (normalizedType) {
    case "Boolean":
      return renderBooleanValue(field.value, t);
    case "Json":
      return typeof field.value === "string"
        ? field.value
        : JSON.stringify(field.value);
    case "RichText":
      // Value is admin-authored HTML from the Spree CMS backend (trusted source)
      return <span dangerouslySetInnerHTML={{ __html: field.value }} />;
    default:
      return String(field.value);
  }
}

export function ProductCustomFields({
  customFields,
}: ProductCustomFieldsProps): React.JSX.Element | null {
  const t = useTranslations("products");

  if (!customFields || customFields.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 border-t pt-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        {t("properties")}
      </h2>
      <dl className="space-y-3">
        {customFields.map((field) => {
          const type = normalizeType(field.type);
          return (
            <div key={field.id} className="flex">
              <dt className="w-32 shrink-0 text-gray-500 text-sm">
                {field.label}
              </dt>
              <dd className="text-gray-900 text-sm min-w-0">
                {renderValue(field, type, t)}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
