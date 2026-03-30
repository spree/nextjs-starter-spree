import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPolicy } from "@/lib/data/policies";
import { getStoreName } from "@/lib/seo";

interface PolicyPageProps {
  params: Promise<{
    country: string;
    locale: string;
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: PolicyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const policy = await getPolicy(slug);

  if (!policy) {
    return { title: "Policy Not Found" };
  }

  const storeName = getStoreName();

  return {
    title: storeName ? `${policy.name} | ${storeName}` : policy.name,
  };
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = await params;
  const policy = await getPolicy(slug);

  if (!policy) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{policy.name}</h1>
      {policy.body_html ? (
        <div
          className="prose prose-gray"
          dangerouslySetInnerHTML={{ __html: policy.body_html }}
        />
      ) : policy.body ? (
        <div className="prose prose-gray whitespace-pre-wrap">
          {policy.body}
        </div>
      ) : (
        <p className="text-gray-500">No content available for this policy.</p>
      )}
    </div>
  );
}
