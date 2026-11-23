import type { Metadata } from "next";
import IssuePage, {
  generateMetadata as issueMetadata,
} from "@/app/[newsletter]/issue/[issue]/page";

// /seniorgolfhq/[slug]/[article] (tournament articles, dynamicParams = false)
// outranks the shared /[newsletter]/issue/[issue] route, so every
// /seniorgolfhq/issue/... URL was answered as a missing article and 404'd.
// A static "issue" segment here beats [slug], so issue URLs land on the
// shared issue page again.
const NEWSLETTER = "seniorgolfhq";

type Params = { issue: string };

export function generateStaticParams() {
  // Issues render on demand, then cache, same as the shared route.
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { issue } = await params;
  return issueMetadata({ params: { newsletter: NEWSLETTER, issue } });
}

export default async function SeniorIssuePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { issue } = await params;
  return IssuePage({ params: { newsletter: NEWSLETTER, issue } });
}
