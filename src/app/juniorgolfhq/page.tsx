import { JsonLd } from "@/components/JsonLd";
import NewsletterPage from "@/app/[newsletter]/page";
import { JUNIOR_MAJOR_EVENTS_2026 } from "@/lib/juniorMajors";

const BASE_URL = "https://www.nichegolfhq.com";
const TITLE = "juniorgolfHQ: Junior Golf Majors, Live Scoring & Results";
const DESCRIPTION =
  "The junior golf majors in one place: schedule, live leaderboards, final results and past winners for AJGA, USGA and top invitational events.";

export const metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/juniorgolfhq" },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/juniorgolfhq`,
    siteName: "nichegolfHQ",
    images: [{ url: "/og/og-nichegolfhq.png", width: 1200, height: 630, alt: "juniorgolfHQ" }],
  },
};

const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "juniorgolfHQ",
  url: `${BASE_URL}/juniorgolfhq`,
  logo: `${BASE_URL}/brand/juniorgolfhq/logo.png`,
  parentOrganization: {
    "@type": "Organization",
    name: "nichegolfHQ",
    url: BASE_URL,
  },
  description: DESCRIPTION,
};

// The hub list doubles as the page's main content for search and answer engines.
const pageLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: TITLE,
  url: `${BASE_URL}/juniorgolfhq`,
  description: DESCRIPTION,
  isPartOf: { "@type": "WebSite", name: "nichegolfHQ", url: BASE_URL },
  mainEntity: {
    "@type": "ItemList",
    name: "Junior golf majors",
    numberOfItems: JUNIOR_MAJOR_EVENTS_2026.length,
    itemListElement: JUNIOR_MAJOR_EVENTS_2026.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: event.name,
      url: `${BASE_URL}/juniorgolfhq/${event.slug}`,
    })),
  },
};

export default async function JuniorIndexPage() {
  return (
    <>
      {/* Server-rendered (not next/script), so crawlers that skip scripts still see it. */}
      <JsonLd data={orgLd} />
      <JsonLd data={pageLd} />
      <NewsletterPage params={{ newsletter: "juniorgolfhq" }} />
    </>
  );
}
