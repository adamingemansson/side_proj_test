// Process catalog — structured templates for known immigration/admin processes.
// Primary source for plan generation; Claude fills gaps when no template matches.

export interface TemplateChecklistItem {
  label: string;
  item_type: "document" | "action" | "appointment" | "payment" | "other";
  notes?: string;
}

export interface TemplateStep {
  title: string;
  description: string;
  estimated_duration?: string;
  checklist_items: TemplateChecklistItem[];
}

export interface ProcessTemplate {
  id: string;
  /** Short keywords/phrases used for matching */
  keywords: string[];
  destination_country: string;
  jurisdiction: string;
  authority_name: string;
  title: string;
  summary: string;
  timeline_summary: string;
  next_action: string;
  official_sources?: { title: string; url: string }[];
  steps: TemplateStep[];
}

// ── Sweden — Migrationsverket ──────────────────────────────────────────────

const swedenWorkPermit: ProcessTemplate = {
  id: "se_work_permit",
  keywords: ["work", "job", "employment", "arbetstillstånd", "work permit", "employer", "hired", "position", "salary"],
  destination_country: "Sweden",
  jurisdiction: "Sweden",
  authority_name: "Migrationsverket",
  title: "Work Permit (Arbetstillstånd) — Sweden",
  summary: "Required for non-EU/EEA nationals who have been offered employment in Sweden. The employer typically initiates part of the application.",
  timeline_summary: "Applications are typically decided within 4–8 months. Processing times vary by case load.",
  next_action: "Confirm your employer will support the application, then start gathering required documents.",
  official_sources: [{ title: "Migrationsverket — Work permit", url: "https://www.migrationsverket.se/en/apply-for-work-permit" }],
  steps: [
    {
      title: "Employer confirms offer and initiates application",
      description: "Your employer in Sweden must confirm the job offer meets Migrationsverket requirements: salary at least at collective agreement level, full-time or specified hours, and union notification.",
      estimated_duration: "1–2 weeks",
      checklist_items: [
        { label: "Written job offer received", item_type: "document" },
        { label: "Employer confirms salary meets collective agreement level", item_type: "action" },
        { label: "Employer notifies relevant trade union (if applicable)", item_type: "action" },
      ],
    },
    {
      title: "Gather required documents",
      description: "Collect all supporting documents before submitting. Missing documents are a common cause of delays.",
      estimated_duration: "1–2 weeks",
      checklist_items: [
        { label: "Valid passport (min. 6 months beyond planned stay)", item_type: "document" },
        { label: "Signed employment contract or offer letter", item_type: "document" },
        { label: "Proof of qualifications (degree, certificates)", item_type: "document" },
        { label: "Passport-style photo", item_type: "document" },
      ],
    },
    {
      title: "Submit application online via Migrationsverket",
      description: "Apply online through Migrationsverket's e-service. You and your employer each complete your respective parts. Pay the application fee.",
      estimated_duration: "1–3 days",
      checklist_items: [
        { label: "Online application submitted (applicant section)", item_type: "action" },
        { label: "Employer completes their section online", item_type: "action" },
        { label: "Application fee paid (SEK 2 000 for most work permits)", item_type: "payment" },
        { label: "Confirmation email / case number saved", item_type: "action" },
      ],
    },
    {
      title: "Biometrics appointment (if required)",
      description: "Depending on your situation, you may need to attend an appointment at a Swedish embassy or application centre in your country to submit biometric data.",
      estimated_duration: "1–4 weeks to get appointment",
      checklist_items: [
        { label: "Check if biometrics appointment is required", item_type: "action" },
        { label: "Book appointment at nearest Swedish embassy / VFS centre", item_type: "appointment" },
        { label: "Attend appointment and submit biometrics", item_type: "appointment" },
      ],
    },
    {
      title: "Await decision from Migrationsverket",
      description: "Processing typically takes 4–8 months. You can track your case online using your case number. Do not travel to Sweden to work before a decision is made.",
      estimated_duration: "4–8 months",
      checklist_items: [
        { label: "Case number noted for online tracking", item_type: "action" },
        { label: "Decision letter received", item_type: "document" },
        { label: "Residence permit card collected (if approved)", item_type: "action" },
      ],
    },
  ],
};

const swedenStudentPermit: ProcessTemplate = {
  id: "se_student_permit",
  keywords: ["study", "student", "university", "school", "course", "admission", "högskola", "student permit", "studies"],
  destination_country: "Sweden",
  jurisdiction: "Sweden",
  authority_name: "Migrationsverket",
  title: "Student Permit (Uppehållstillstånd för studier) — Sweden",
  summary: "Required for non-EU/EEA students studying in Sweden for more than 90 days. You must have a confirmed place at a Swedish educational institution.",
  timeline_summary: "Apply at least 2–3 months before your course starts. Decisions typically take 1–3 months.",
  next_action: "Confirm your admission letter is in hand, then apply online as early as possible.",
  official_sources: [{ title: "Migrationsverket — Student permit", url: "https://www.migrationsverket.se/en/student-permit" }],
  steps: [
    {
      title: "Obtain admission letter from Swedish institution",
      description: "You must have an unconditional offer of a place at a Swedish university, college, or school before applying.",
      estimated_duration: "Varies",
      checklist_items: [
        { label: "Unconditional admission letter received", item_type: "document" },
        { label: "Course start date confirmed", item_type: "action" },
        { label: "Tuition fee payment confirmed (if applicable)", item_type: "payment" },
      ],
    },
    {
      title: "Gather required documents",
      description: "Prepare all documents before submitting the application.",
      estimated_duration: "1 week",
      checklist_items: [
        { label: "Valid passport (covering the full study period)", item_type: "document" },
        { label: "Admission letter from Swedish institution", item_type: "document" },
        { label: "Proof of sufficient funds (min. SEK 8 514/month)", item_type: "document" },
        { label: "Proof of health insurance (if applicable)", item_type: "document" },
        { label: "Passport-style photo", item_type: "document" },
      ],
    },
    {
      title: "Apply online via Migrationsverket",
      description: "Submit your application online. Pay the application fee. Apply well before your course starts — processing takes time.",
      estimated_duration: "1–2 days",
      checklist_items: [
        { label: "Online application completed and submitted", item_type: "action" },
        { label: "Application fee paid (SEK 1 000)", item_type: "payment" },
        { label: "All documents uploaded", item_type: "document" },
        { label: "Case number saved", item_type: "action" },
      ],
    },
    {
      title: "Await decision",
      description: "Processing typically takes 1–3 months. If you need to submit biometrics, Migrationsverket will contact you.",
      estimated_duration: "1–3 months",
      checklist_items: [
        { label: "Decision received from Migrationsverket", item_type: "document" },
        { label: "Residence permit card collected (if approved)", item_type: "action" },
      ],
    },
  ],
};

const swedenResidencePermitRenewal: ProcessTemplate = {
  id: "se_residence_permit_renewal",
  keywords: ["residence permit", "renew", "renewal", "uppehållstillstånd", "extend", "extension", "living in sweden", "stay in sweden"],
  destination_country: "Sweden",
  jurisdiction: "Sweden",
  authority_name: "Migrationsverket",
  title: "Residence Permit Renewal — Sweden",
  summary: "If you already hold a Swedish residence permit and wish to continue living in Sweden, you must apply for renewal before your current permit expires.",
  timeline_summary: "Apply at least 3 months before your permit expires. Processing can take 4–12 months.",
  next_action: "Check your current permit expiry date and apply as early as possible — at least 3 months before expiry.",
  official_sources: [{ title: "Migrationsverket — Extend residence permit", url: "https://www.migrationsverket.se/en/extend-permit" }],
  steps: [
    {
      title: "Check eligibility and gather documents",
      description: "Confirm you meet the requirements for renewal based on your permit type (work, family, etc.). Gather all supporting documents.",
      estimated_duration: "1–2 weeks",
      checklist_items: [
        { label: "Current residence permit details noted (expiry, type)", item_type: "document" },
        { label: "Valid passport obtained", item_type: "document" },
        { label: "Supporting documents gathered (employment contract, payslips, etc.)", item_type: "document" },
        { label: "Biometric photos taken (35×45mm)", item_type: "document" },
      ],
    },
    {
      title: "Submit application online",
      description: "Apply through Migrationsverket's online service. You can apply while still in Sweden on your current permit.",
      estimated_duration: "1–2 days",
      checklist_items: [
        { label: "Online application submitted", item_type: "action" },
        { label: "Application fee paid (SEK 2 000 for work-based)", item_type: "payment" },
        { label: "Case number saved", item_type: "action" },
      ],
    },
    {
      title: "Book and attend service centre appointment",
      description: "For some permit types you need to attend a Migrationsverket service centre to submit biometrics. Book early — wait times can be 2–4 weeks.",
      estimated_duration: "2–4 weeks to get appointment",
      checklist_items: [
        { label: "Appointment booked at Migrationsverket service centre", item_type: "appointment" },
        { label: "All documents organised for appointment", item_type: "action" },
        { label: "Appointment attended", item_type: "appointment" },
      ],
    },
    {
      title: "Await decision",
      description: "Processing times vary by permit type and case load, typically 4–12 months. You can legally stay in Sweden while your renewal application is being processed.",
      estimated_duration: "4–12 months",
      checklist_items: [
        { label: "Decision received from Migrationsverket", item_type: "document" },
        { label: "New permit card collected", item_type: "action" },
      ],
    },
  ],
};

const swedenFamilyReunification: ProcessTemplate = {
  id: "se_family_reunification",
  keywords: ["family", "spouse", "partner", "child", "parent", "reunification", "join", "anhöriginvandring", "relative"],
  destination_country: "Sweden",
  jurisdiction: "Sweden",
  authority_name: "Migrationsverket",
  title: "Family Reunification (Anhöriginvandring) — Sweden",
  summary: "Allows family members to join a person who holds a valid residence or work permit in Sweden. The sponsor in Sweden must meet income and housing requirements.",
  timeline_summary: "Processing typically takes 6–12 months. Apply as early as possible.",
  next_action: "Confirm the sponsor's permit status and start gathering required documents.",
  official_sources: [{ title: "Migrationsverket — Family reunification", url: "https://www.migrationsverket.se/en/family-reunification" }],
  steps: [
    {
      title: "Confirm sponsor eligibility",
      description: "The person in Sweden (the sponsor) must hold a valid permit for at least one year and meet income and housing requirements.",
      estimated_duration: "1 week",
      checklist_items: [
        { label: "Sponsor's valid residence/work permit confirmed", item_type: "document" },
        { label: "Sponsor's income meets requirement (check current threshold)", item_type: "action" },
        { label: "Sponsor has suitable housing for the family", item_type: "action" },
      ],
    },
    {
      title: "Submit application online",
      description: "The applying family member submits an online application via Migrationsverket's e-service (My Pages). The sponsor in Sweden also completes their part.",
      estimated_duration: "1–3 days",
      checklist_items: [
        { label: "Online application submitted by family member", item_type: "action" },
        { label: "Application fee paid (SEK 1 500 per adult)", item_type: "payment" },
        { label: "Sponsor completes their section online", item_type: "action" },
        { label: "Case number saved", item_type: "action" },
      ],
    },
    {
      title: "Submit supporting documents",
      description: "Provide certified documents proving the family relationship, housing, and income.",
      estimated_duration: "1–3 weeks",
      checklist_items: [
        { label: "Passports for all applicants", item_type: "document" },
        { label: "Proof of relationship (marriage certificate, birth certificate)", item_type: "document" },
        { label: "Certified translation of relationship documents (into Swedish)", item_type: "document" },
        { label: "Sponsor's income documentation (payslips, employment contract)", item_type: "document" },
        { label: "Housing documentation (tenancy agreement or ownership)", item_type: "document" },
      ],
    },
    {
      title: "Embassy appointment and biometrics",
      description: "The applying family member attends an appointment at the nearest Swedish embassy or consulate in their country of residence to submit biometric data.",
      estimated_duration: "1–6 weeks to get appointment",
      checklist_items: [
        { label: "Appointment booked at Swedish embassy/consulate", item_type: "appointment" },
        { label: "All original documents brought to appointment", item_type: "action" },
        { label: "Biometrics submitted", item_type: "appointment" },
      ],
    },
    {
      title: "Await decision and collect permit",
      description: "Migrationsverket reviews the application. A positive decision results in a residence permit card, which must be collected in person in Sweden.",
      estimated_duration: "6–12 months",
      checklist_items: [
        { label: "Decision received from Migrationsverket", item_type: "document" },
        { label: "Permit card collected in Sweden (if approved)", item_type: "action" },
        { label: "Address registration in Sweden completed (Folkbokföring)", item_type: "action" },
      ],
    },
  ],
};

const swedenCitizenship: ProcessTemplate = {
  id: "se_citizenship",
  keywords: ["citizenship", "medborgarskap", "naturalisation", "naturalization", "become swedish", "swedish citizen", "passport"],
  destination_country: "Sweden",
  jurisdiction: "Sweden",
  authority_name: "Migrationsverket",
  title: "Swedish Citizenship (Medborgarskap)",
  summary: "You can apply for Swedish citizenship after living in Sweden for a number of years with a residence permit, meeting language and residency requirements.",
  timeline_summary: "Processing typically takes 6–12 months after a complete application is submitted.",
  next_action: "Check how many years you have lived in Sweden and whether you meet the residency requirement.",
  official_sources: [{ title: "Migrationsverket — Swedish citizenship", url: "https://www.migrationsverket.se/en/citizenship" }],
  steps: [
    {
      title: "Check eligibility",
      description: "Most applicants must have lived in Sweden for at least 5 years with a valid permit, have a clean criminal record, and be able to support themselves.",
      estimated_duration: "1 week",
      checklist_items: [
        { label: "Years of residence in Sweden confirmed", item_type: "action" },
        { label: "Permanent residence permit or long-term permit confirmed", item_type: "document" },
        { label: "No disqualifying criminal convictions (self-check)", item_type: "action" },
      ],
    },
    {
      title: "Gather documents",
      description: "Collect identity documents and proof of residence.",
      estimated_duration: "1–2 weeks",
      checklist_items: [
        { label: "Valid passport or national identity document", item_type: "document" },
        { label: "Residence permit card", item_type: "document" },
        { label: "Population register extract (from Skatteverket)", item_type: "document" },
      ],
    },
    {
      title: "Apply online via Migrationsverket",
      description: "Submit application online and pay the fee.",
      estimated_duration: "1 day",
      checklist_items: [
        { label: "Online application submitted", item_type: "action" },
        { label: "Application fee paid (SEK 1 500)", item_type: "payment" },
        { label: "Case number saved", item_type: "action" },
      ],
    },
    {
      title: "Await decision",
      description: "Processing takes 6–12 months. Migrationsverket may request additional information.",
      estimated_duration: "6–12 months",
      checklist_items: [
        { label: "Decision letter received", item_type: "document" },
        { label: "Swedish passport applied for (if approved)", item_type: "action" },
      ],
    },
  ],
};

// ── UK — Home Office ───────────────────────────────────────────────────────

const ukStudentVisa: ProcessTemplate = {
  id: "uk_student_visa",
  keywords: ["uk student", "student visa uk", "study uk", "university uk", "england", "britain", "student route", "cas", "confirmation of acceptance"],
  destination_country: "United Kingdom",
  jurisdiction: "United Kingdom",
  authority_name: "UK Home Office / UKVI",
  title: "UK Student Visa (Student Route)",
  summary: "Required for non-UK nationals studying a full-time course at a licensed UK student sponsor (university, college, or school) for more than 6 months.",
  timeline_summary: "Apply up to 6 months before your course starts. Decisions typically take 3 weeks (priority) or up to 12 weeks (standard).",
  next_action: "Obtain your Confirmation of Acceptance for Studies (CAS) from your UK institution before applying.",
  official_sources: [{ title: "UK Visas and Immigration — Student visa", url: "https://www.gov.uk/student-visa" }],
  steps: [
    {
      title: "Receive CAS from your UK institution",
      description: "Your university or college will issue a Confirmation of Acceptance for Studies (CAS) number. You cannot apply without it.",
      estimated_duration: "Varies by institution",
      checklist_items: [
        { label: "Unconditional offer letter received", item_type: "document" },
        { label: "CAS number issued by institution", item_type: "document" },
        { label: "Tuition fees paid or payment plan confirmed", item_type: "payment" },
      ],
    },
    {
      title: "Gather required documents",
      description: "Prepare all documents before applying online.",
      estimated_duration: "1–2 weeks",
      checklist_items: [
        { label: "Valid passport", item_type: "document" },
        { label: "CAS reference number", item_type: "document" },
        { label: "Proof of funds (28 consecutive days in bank account)", item_type: "document" },
        { label: "ATAS certificate (if course requires it)", item_type: "document" },
        { label: "English language certificate (if required)", item_type: "document" },
        { label: "Tuberculosis test certificate (if from listed country)", item_type: "document" },
        { label: "Parental consent (if under 18)", item_type: "document" },
      ],
    },
    {
      title: "Apply online and pay the fee",
      description: "Apply online via UKVI. You must also pay the Immigration Health Surcharge (IHS) as part of the application.",
      estimated_duration: "1–2 days",
      checklist_items: [
        { label: "Online application submitted on gov.uk", item_type: "action" },
        { label: "Visa application fee paid (£363 from outside UK)", item_type: "payment" },
        { label: "Immigration Health Surcharge paid (£776/year)", item_type: "payment" },
      ],
    },
    {
      title: "Biometrics appointment at Visa Application Centre",
      description: "Book and attend an appointment at a UKVI Visa Application Centre to submit biometric data and original documents.",
      estimated_duration: "1–4 weeks to get appointment",
      checklist_items: [
        { label: "VAC appointment booked", item_type: "appointment" },
        { label: "All original documents brought", item_type: "action" },
        { label: "Biometrics submitted", item_type: "appointment" },
      ],
    },
    {
      title: "Await decision and collect BRP",
      description: "Standard processing takes up to 12 weeks; priority service takes up to 5 working days (extra fee). On arrival in UK, collect your Biometric Residence Permit within 10 days.",
      estimated_duration: "3–12 weeks",
      checklist_items: [
        { label: "Visa decision received", item_type: "document" },
        { label: "Travel to UK completed", item_type: "action" },
        { label: "BRP collected from post office within 10 days of arrival", item_type: "action" },
      ],
    },
  ],
};

const ukSkilledWorkerVisa: ProcessTemplate = {
  id: "uk_skilled_worker",
  keywords: ["skilled worker", "uk work visa", "work in uk", "tier 2", "sponsor licence", "certificate of sponsorship", "cos", "england work", "britain job"],
  destination_country: "United Kingdom",
  jurisdiction: "United Kingdom",
  authority_name: "UK Home Office / UKVI",
  title: "UK Skilled Worker Visa",
  summary: "Allows skilled workers with a job offer from a UK-licensed sponsor to work in the UK. The role must meet the skill and salary thresholds.",
  timeline_summary: "Apply up to 3 months before your start date. Priority decisions in 5 working days; standard up to 8 weeks.",
  next_action: "Your UK employer must hold a sponsor licence and issue a Certificate of Sponsorship (CoS) before you can apply.",
  official_sources: [{ title: "UK Visas and Immigration — Skilled Worker visa", url: "https://www.gov.uk/skilled-worker-visa" }],
  steps: [
    {
      title: "Employer issues Certificate of Sponsorship",
      description: "Your employer must be a licensed UK sponsor and assign you a CoS with a reference number. You cannot apply without it.",
      estimated_duration: "1–2 weeks",
      checklist_items: [
        { label: "Employer holds UKVI sponsor licence (verify)", item_type: "action" },
        { label: "Certificate of Sponsorship (CoS) reference number received", item_type: "document" },
        { label: "Role meets skill level (RQF3+) and salary thresholds", item_type: "action" },
      ],
    },
    {
      title: "Gather required documents",
      description: "Prepare documents before applying online.",
      estimated_duration: "1 week",
      checklist_items: [
        { label: "Valid passport", item_type: "document" },
        { label: "CoS reference number", item_type: "document" },
        { label: "Proof of English language ability", item_type: "document" },
        { label: "Bank statements showing maintenance funds (if required)", item_type: "document" },
        { label: "Tuberculosis test result (if from listed country)", item_type: "document" },
        { label: "Criminal record certificate (if required)", item_type: "document" },
      ],
    },
    {
      title: "Apply online and pay fees",
      description: "Apply online via UKVI. Pay the application fee and the Immigration Health Surcharge.",
      estimated_duration: "1 day",
      checklist_items: [
        { label: "Online application submitted", item_type: "action" },
        { label: "Visa fee paid (£719 for 3+ years from outside UK)", item_type: "payment" },
        { label: "Immigration Health Surcharge paid (£1,035/year)", item_type: "payment" },
      ],
    },
    {
      title: "Biometrics appointment",
      description: "Attend a UKVI Visa Application Centre to submit biometrics and documents.",
      estimated_duration: "1–3 weeks",
      checklist_items: [
        { label: "VAC appointment booked", item_type: "appointment" },
        { label: "Biometrics and documents submitted", item_type: "appointment" },
      ],
    },
    {
      title: "Await decision and travel to UK",
      description: "Standard processing up to 8 weeks; priority 5 working days. Collect your BRP within 10 days of arrival in the UK.",
      estimated_duration: "5 days – 8 weeks",
      checklist_items: [
        { label: "Decision received", item_type: "document" },
        { label: "Travel to UK completed", item_type: "action" },
        { label: "BRP collected within 10 days of arrival", item_type: "action" },
      ],
    },
  ],
};

const ukGraduateVisa: ProcessTemplate = {
  id: "uk_graduate_visa",
  keywords: ["graduate visa", "graduate route", "uk after graduation", "stay after study uk", "post study work", "psw"],
  destination_country: "United Kingdom",
  jurisdiction: "United Kingdom",
  authority_name: "UK Home Office / UKVI",
  title: "UK Graduate Visa (Graduate Route)",
  summary: "Allows international students who have completed a UK degree to stay and work (or look for work) in the UK for 2 years (3 years for PhD graduates).",
  timeline_summary: "Apply before your current Student visa expires. Decision typically within 8 weeks.",
  next_action: "Confirm your degree has been formally awarded by your UK institution before applying.",
  official_sources: [{ title: "UK Visas and Immigration — Graduate visa", url: "https://www.gov.uk/graduate-visa" }],
  steps: [
    {
      title: "Confirm degree completion",
      description: "Your UK institution must confirm your degree has been awarded. Apply before your current Student visa expires.",
      estimated_duration: "Varies",
      checklist_items: [
        { label: "Degree formally awarded / confirmation letter obtained", item_type: "document" },
        { label: "Current Student visa expiry date noted", item_type: "action" },
      ],
    },
    {
      title: "Apply online",
      description: "Apply online from inside the UK before your current visa expires.",
      estimated_duration: "1 day",
      checklist_items: [
        { label: "Online application submitted (from inside UK)", item_type: "action" },
        { label: "Application fee paid (£700)", item_type: "payment" },
        { label: "Immigration Health Surcharge paid", item_type: "payment" },
        { label: "Biometrics provided via UKVCAS appointment", item_type: "appointment" },
      ],
    },
    {
      title: "Await decision",
      description: "Decisions typically take up to 8 weeks. You can work full-time while waiting if you applied in-country before your visa expired.",
      estimated_duration: "Up to 8 weeks",
      checklist_items: [
        { label: "Decision received", item_type: "document" },
        { label: "BRP collected if issued", item_type: "action" },
      ],
    },
  ],
};

// ── Catalog export ─────────────────────────────────────────────────────────

export const PROCESS_TEMPLATES: ProcessTemplate[] = [
  swedenWorkPermit,
  swedenStudentPermit,
  swedenResidencePermitRenewal,
  swedenFamilyReunification,
  swedenCitizenship,
  ukStudentVisa,
  ukSkilledWorkerVisa,
  ukGraduateVisa,
];
