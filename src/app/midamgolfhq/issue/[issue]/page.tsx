import type { Metadata } from "next";
import IssuePage, {
  generateMetadata as issueMetadata,
} from "@/app/[newsletter]/issue/[issue]/page";

// /midamgolfhq/[slug]/[article] (tournament articles, dynamicParams = false)
// outranks the shared /[newsletter]/issue/[issue] route, so every
// /midamgolfhq/issue/... URL was answered as a missing article and 404'd.
// A static "issue" segment here beats [slug], so issue URLs land on the
// shared issue page again.
const NEWSLETTER = "midamgolfhq";

type Params = { issue: string };

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { issue } = await params;
  return issueMetadata({ params: { newsletter: NEWSLETTER, issue } });
}

export default async function MidAmIssuePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { issue } = await params;
  return IssuePage({ params: { newsletter: NEWSLETTER, issue } });
}
