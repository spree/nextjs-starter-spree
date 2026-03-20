import type { Metafield } from "@spree/sdk";

interface ProductMetafieldsProps {
  metafields?: Array<Metafield>;
}

function normalizeType(type: string): string {
  return type.split("::").pop() || type;
}

function renderValue(metafield: Metafield, normalizedType: string) {
  switch (normalizedType) {
    case "Boolean":
      return metafield.value ? "Yes" : "No";
    case "Json":
      return typeof metafield.value === "string"
        ? metafield.value
        : JSON.stringify(metafield.value);
    case "RichText":
      return <span dangerouslySetInnerHTML={{ __html: metafield.value }} />;
    default:
      return String(metafield.value);
  }
}

export function ProductMetafields({ metafields }: ProductMetafieldsProps) {
  if (!metafields || metafields.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 border-t pt-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Properties</h2>
      <dl className="space-y-3">
        {metafields.map((metafield) => {
          const type = normalizeType(metafield.type);
          return (
            <div key={metafield.id} className="flex">
              <dt className="w-32 shrink-0 text-gray-500 text-sm">
                {metafield.name}
              </dt>
              <dd className="text-gray-900 text-sm min-w-0">
                {renderValue(metafield, type)}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
