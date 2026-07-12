import { requireAdmin } from "@/src/lib/admin/api";

export const dynamic = "force-dynamic";

type OverpassElement = {
  id: number;
  type: string;
  tags?: Record<string, string>;
  center?: { lat?: number; lon?: number };
  lat?: number;
  lon?: number;
};

type NominatimPlace = {
  osm_id?: number;
  osm_type?: string;
  display_name?: string;
  name?: string;
  type?: string;
  addresstype?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
  extratags?: Record<string, string>;
};

const cities = [
  { city: "Dubai", country: "United Arab Emirates", area: "Dubai", bbox: [55.08, 24.98, 55.55, 25.35] },
  { city: "Riyadh", country: "Saudi Arabia", area: "Riyadh", bbox: [46.48, 24.45, 47.02, 25.02] },
  { city: "London", country: "United Kingdom", area: "London", bbox: [-0.51, 51.28, 0.33, 51.69] },
  { city: "Toronto", country: "Canada", area: "Toronto", bbox: [-79.64, 43.58, -79.12, 43.86] },
  { city: "Sydney", country: "Australia", area: "Sydney", bbox: [150.52, -34.12, 151.35, -33.58] },
  { city: "Singapore", country: "Singapore", area: "Singapore", bbox: [103.6, 1.16, 104.1, 1.48] },
  { city: "Berlin", country: "Germany", area: "Berlin", bbox: [13.09, 52.34, 13.76, 52.68] },
  { city: "Paris", country: "France", area: "Paris", bbox: [2.22, 48.81, 2.47, 48.91] },
  { city: "Doha", country: "Qatar", area: "Doha", bbox: [51.42, 25.18, 51.63, 25.41] },
  { city: "Cape Town", country: "South Africa", area: "Cape Town", bbox: [18.31, -34.36, 18.93, -33.7] },
  { city: "New York", country: "United States", area: "New York", bbox: [-74.26, 40.49, -73.7, 40.92] },
  { city: "Kuala Lumpur", country: "Malaysia", area: "Kuala Lumpur", bbox: [101.58, 3.03, 101.78, 3.25] },
];

const industries = {
  "Salon / beauty": [`["shop"="beauty"]`, `["shop"="hairdresser"]`, `["beauty"]`],
  "Dental clinic / clinic": [`["amenity"="dentist"]`, `["amenity"="clinic"]`, `["amenity"="doctors"]`],
  "Car detailing / car wash": [`["amenity"="car_wash"]`, `["shop"="car_repair"]`],
  "Maintenance / handyman": [`["craft"="handicraft"]`, `["shop"="hardware"]`, `["craft"="electrician"]`, `["craft"="plumber"]`],
  "Event planner": [`["office"="event_management"]`, `["shop"="party"]`],
  "Cleaning company": [`["office"="cleaning"]`, `["shop"="laundry"]`, `["amenity"="dry_cleaning"]`],
  "Marketing agency": [`["office"="advertising_agency"]`, `["office"="marketing"]`, `["office"="advertising"]`],
} as const;

const searchTerms: Record<keyof typeof industries, string[]> = {
  "Salon / beauty": ["salon", "beauty salon", "hairdresser"],
  "Dental clinic / clinic": ["dental clinic", "clinic", "dentist"],
  "Car detailing / car wash": ["car wash", "car detailing"],
  "Maintenance / handyman": ["handyman", "plumber", "electrician"],
  "Event planner": ["event planner", "event management"],
  "Cleaning company": ["cleaning company", "laundry"],
  "Marketing agency": ["marketing agency", "advertising agency"],
};

const overpassEndpoints = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

function randomItem<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function overpassQuery(area: string, filters: readonly string[], limit: number) {
  const selectors = filters
    .flatMap((filter) => [`node${filter}(area.searchArea);`, `way${filter}(area.searchArea);`, `relation${filter}(area.searchArea);`])
    .join("\n");

  return `
    [out:json][timeout:25];
    area["name"="${area}"]["boundary"="administrative"]->.searchArea;
    (
      ${selectors}
    );
    out center tags ${Math.max(5, Math.min(limit * 4, 80))};
  `;
}

function bboxQuery(bbox: number[], filters: readonly string[], limit: number) {
  const bounds = `${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]}`;
  const selectors = filters
    .flatMap((filter) => [`node${filter}(${bounds});`, `way${filter}(${bounds});`, `relation${filter}(${bounds});`])
    .join("\n");

  return `
    [out:json][timeout:18];
    (
      ${selectors}
    );
    out center tags ${Math.max(5, Math.min(limit * 4, 80))};
  `;
}

async function fetchOverpass(query: string) {
  for (const endpoint of overpassEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: query }),
      });

      if (response.ok) {
        return (await response.json()) as { elements?: OverpassElement[] };
      }
    } catch {
      // Try the next public mirror.
    }
  }

  return null;
}

async function fetchNominatim(city: (typeof cities)[number], industry: keyof typeof industries, limit: number) {
  const term = randomItem(searchTerms[industry]);
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${term} in ${city.city}, ${city.country}`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("limit", String(Math.max(5, Math.min(limit, 25))));

  const response = await fetch(url, {
    headers: {
      "User-Agent": "ComvexaAdminLeadFinder/1.0 (https://comvexa.net)",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as NominatimPlace[];
}

function tag(tags: Record<string, string>, ...keys: string[]) {
  return keys.map((key) => tags[key]).find(Boolean) ?? "";
}

function normalizeUrl(value: string) {
  if (!value) {
    return "";
  }

  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);

  if (admin.error) {
    return admin.error;
  }

  try {
    const body = (await request.json()) as { industry?: keyof typeof industries | "Random"; limit?: number };
    const limit = Math.max(3, Math.min(Number(body.limit ?? 10), 25));
    const city = randomItem(cities);
    const industry =
      body.industry && body.industry !== "Random" && body.industry in industries
        ? body.industry
        : randomItem(Object.keys(industries) as Array<keyof typeof industries>);

    const overpassData =
      (await fetchOverpass(overpassQuery(city.area, industries[industry], limit))) ??
      (await fetchOverpass(bboxQuery(city.bbox, industries[industry], limit)));
    const nominatimData = overpassData?.elements?.length ? null : await fetchNominatim(city, industry, limit);
    const overpassLeads = (overpassData?.elements ?? [])
      .map((element) => {
        const tags = element.tags ?? {};
        const name = tag(tags, "name", "brand");

        if (!name) {
          return null;
        }

        const website = normalizeUrl(tag(tags, "website", "contact:website", "url"));
        const instagram = normalizeUrl(tag(tags, "contact:instagram", "instagram"));
        const email = tag(tags, "email", "contact:email");
        const whatsapp = tag(tags, "contact:whatsapp", "phone", "contact:phone");

        return {
          company_name: name,
          country: city.country,
          city: city.city,
          industry,
          instagram_url: instagram || null,
          email: email || null,
          whatsapp: whatsapp || null,
          website: website || null,
          status: "New",
          source: website ? "Website" : "Manual",
          notes: `Auto-discovered from public map data. OSM ${element.type}/${element.id}. Verify details before outreach.`,
        };
      })
      .filter((lead): lead is NonNullable<typeof lead> => Boolean(lead));
    const nominatimLeads = (nominatimData ?? [])
      .map((place) => {
        const displayName = place.name || place.display_name?.split(",")[0]?.trim();

        if (!displayName) {
          return null;
        }

        const extratags = place.extratags ?? {};
        const website = normalizeUrl(tag(extratags, "website", "contact:website", "url"));
        const email = tag(extratags, "email", "contact:email");
        const whatsapp = tag(extratags, "contact:whatsapp", "phone", "contact:phone");

        return {
          company_name: displayName,
          country: place.address?.country || city.country,
          city: place.address?.city || place.address?.town || place.address?.village || city.city,
          industry,
          instagram_url: null,
          email: email || null,
          whatsapp: whatsapp || null,
          website: website || null,
          status: "New",
          source: website ? "Website" : "Manual",
          notes: `Auto-discovered from public map search. OSM ${place.osm_type ?? "place"}/${place.osm_id ?? "unknown"}. Verify details before outreach.`,
        };
      })
      .filter((lead): lead is NonNullable<typeof lead> => Boolean(lead));
    const leads = [...overpassLeads, ...nominatimLeads]
      .slice(0, limit);

    if (!leads.length) {
      return Response.json({
        imported: 0,
        skipped: 0,
        city,
        industry,
        message: "No matching companies were found in this random city. Try again.",
      });
    }

    const existing = await admin.supabase
      .from("leads")
      .select("company_name, city, country")
      .in(
        "company_name",
        leads.map((lead) => lead.company_name),
      );

    if (existing.error) {
      throw existing.error;
    }

    const existingKeys = new Set(
      (existing.data ?? []).map((lead) => `${lead.company_name}|${lead.city ?? ""}|${lead.country ?? ""}`.toLowerCase()),
    );
    const freshLeads = leads.filter(
      (lead) => !existingKeys.has(`${lead.company_name}|${lead.city}|${lead.country}`.toLowerCase()),
    );

    if (!freshLeads.length) {
      return Response.json({ imported: 0, skipped: leads.length, city, industry });
    }

    const { data: inserted, error } = await admin.supabase.from("leads").insert(freshLeads).select("*");

    if (error) {
      throw error;
    }

    return Response.json({
      imported: inserted?.length ?? 0,
      skipped: leads.length - freshLeads.length,
      city,
      industry,
      leads: inserted ?? [],
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not discover leads." },
      { status: 500 },
    );
  }
}
