export interface ProcessSuggestion {
  title: string;
  country: string;
  authority: string;
  reason: string;
}

type ProcessRef = { title: string; country: string | null; destination_country?: string | null };

const RULES: {
  matches: (p: ProcessRef) => boolean;
  suggestions: ProcessSuggestion[];
}[] = [
  {
    // Any Switzerland process → B/L permit + KVG health insurance
    matches: (p) => {
      const loc = `${p.destination_country ?? p.country ?? ""}`.toLowerCase();
      const t = p.title.toLowerCase();
      return loc.includes("switzerland") || t.includes("swiss") || t.includes("switzerland");
    },
    suggestions: [
      {
        title: "Residence Permit (B/L Permit) — Switzerland",
        country: "Switzerland",
        authority: "Cantonal Migration Authority (Migrationsamt)",
        reason:
          "Anyone living in Switzerland must hold a residence permit. The type (B, L, C…) depends on your nationality and purpose of stay.",
      },
      {
        title: "Compulsory Health Insurance (KVG / LAMal) — Switzerland",
        country: "Switzerland",
        authority: "Federal Office of Public Health (FOPH)",
        reason:
          "Swiss law requires all residents to enrol in basic health insurance within 3 months of arriving in the country.",
      },
    ],
  },
  {
    // Sweden work permit → personnummer registration
    matches: (p) => {
      const loc = `${p.destination_country ?? p.country ?? ""}`.toLowerCase();
      const t = p.title.toLowerCase();
      return (
        (loc.includes("sweden") || t.includes("sweden")) &&
        (t.includes("work") || t.includes("arbetstillstånd") || t.includes("employment"))
      );
    },
    suggestions: [
      {
        title: "Personal Identity Number (Personnummer) — Sweden",
        country: "Sweden",
        authority: "Skatteverket (Swedish Tax Agency)",
        reason:
          "Once you hold a Swedish work or residence permit, registering for a personnummer unlocks banking, healthcare, and other essential services.",
      },
    ],
  },
  {
    // Any UK process → NHS GP registration + National Insurance number
    matches: (p) => {
      const loc = `${p.destination_country ?? p.country ?? ""}`.toLowerCase();
      const t = p.title.toLowerCase();
      return (
        loc.includes("united kingdom") ||
        loc.includes("uk") ||
        t.includes("uk ") ||
        t.includes("united kingdom")
      );
    },
    suggestions: [
      {
        title: "Register with a GP (NHS) — United Kingdom",
        country: "United Kingdom",
        authority: "NHS",
        reason:
          "After arriving in the UK, registering with a local GP gives you access to the National Health Service at no cost.",
      },
      {
        title: "National Insurance Number Application — United Kingdom",
        country: "United Kingdom",
        authority: "Department for Work and Pensions (DWP)",
        reason:
          "A National Insurance number is required to work legally, pay tax, and access state benefits in the UK.",
      },
    ],
  },
];

/** Returns suggestions relevant to the user's existing processes,
 *  excluding any process they already appear to have. */
export function getSuggestedProcesses(existing: ProcessRef[]): ProcessSuggestion[] {
  const seen = new Map<string, ProcessSuggestion>();

  for (const proc of existing) {
    for (const rule of RULES) {
      if (!rule.matches(proc)) continue;
      for (const sug of rule.suggestions) {
        if (seen.has(sug.title)) continue;
        // Skip if user already has a similar process (simple title overlap check)
        const alreadyHas = existing.some((ep) =>
          ep.title.toLowerCase().includes(sug.title.toLowerCase().slice(0, 20)) ||
          sug.title.toLowerCase().includes(ep.title.toLowerCase().slice(0, 20))
        );
        if (!alreadyHas) seen.set(sug.title, sug);
      }
    }
  }

  return Array.from(seen.values());
}
