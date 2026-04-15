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

// ── UK — Youth Mobility ────────────────────────────────────────────────────

const ukYouthMobility: ProcessTemplate = {
  id: "uk_youth_mobility",
  keywords: ["youth mobility", "working holiday uk", "internship uk", "intern uk", "short term work uk", "yms", "uk intern"],
  destination_country: "United Kingdom",
  jurisdiction: "United Kingdom",
  authority_name: "UK Home Office / UKVI",
  title: "UK Youth Mobility Scheme",
  summary: "Allows young people (18–30) from eligible countries to live and work in the UK for up to 2 years. Includes internships and paid work.",
  timeline_summary: "Apply up to 3 months before intended travel. Decisions typically within 3 weeks.",
  next_action: "Check if your nationality qualifies, then apply online.",
  official_sources: [{ title: "UK Youth Mobility Scheme", url: "https://www.gov.uk/youth-mobility" }],
  steps: [
    {
      title: "Check eligibility",
      description: "Must be 18–30, hold a qualifying nationality, and have at least £2,530 in savings.",
      estimated_duration: "1 day",
      checklist_items: [
        { label: "Nationality confirmed as eligible for YMS", item_type: "action" },
        { label: "Age 18–30 at time of application", item_type: "action" },
        { label: "£2,530 savings held for 28 consecutive days", item_type: "document" },
      ],
    },
    {
      title: "Apply online and pay fees",
      description: "Apply online from outside the UK. Pay the visa fee and Immigration Health Surcharge.",
      estimated_duration: "1 day",
      checklist_items: [
        { label: "Online application submitted on gov.uk", item_type: "action" },
        { label: "Visa fee paid (£259)", item_type: "payment" },
        { label: "Immigration Health Surcharge paid (£776/year)", item_type: "payment" },
      ],
    },
    {
      title: "Biometrics at Visa Application Centre",
      description: "Attend a UKVI Visa Application Centre to submit biometrics and documents.",
      estimated_duration: "1–3 weeks to get appointment",
      checklist_items: [
        { label: "VAC appointment booked", item_type: "appointment" },
        { label: "Passport and bank statements brought", item_type: "document" },
        { label: "Biometrics submitted", item_type: "appointment" },
      ],
    },
    {
      title: "Receive decision and travel",
      description: "Standard decision within 3 weeks. Collect BRP within 10 days of arriving in the UK.",
      estimated_duration: "Up to 3 weeks",
      checklist_items: [
        { label: "Visa decision received", item_type: "document" },
        { label: "Travel to UK completed", item_type: "action" },
        { label: "BRP collected from post office", item_type: "action" },
      ],
    },
  ],
};

// ── Germany ────────────────────────────────────────────────────────────────

const germanyEUBlueCard: ProcessTemplate = {
  id: "de_eu_blue_card",
  keywords: ["germany work", "work in germany", "blue card", "eu blue card", "deutschland", "germany job", "skilled worker germany", "germany employment", "german work permit"],
  destination_country: "Germany",
  jurisdiction: "Germany",
  authority_name: "Local Foreigners Authority (Ausländerbehörde)",
  title: "EU Blue Card — Germany",
  summary: "Residence and work permit for highly qualified non-EU/EEA nationals with a job offer meeting the salary threshold. Valid for up to 4 years.",
  timeline_summary: "Apply at the German embassy before travel, or in Germany after arrival on a job-seeker or national visa. Processing 4–12 weeks.",
  next_action: "Confirm your job offer meets the salary threshold, then apply at the German embassy.",
  official_sources: [{ title: "Make it in Germany — EU Blue Card", url: "https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card" }],
  steps: [
    {
      title: "Confirm job offer and salary threshold",
      description: "Your job offer must meet the annual gross salary threshold (€45,300 general; €35,100 for shortage occupations in 2024).",
      estimated_duration: "1 week",
      checklist_items: [
        { label: "Signed employment contract received", item_type: "document" },
        { label: "Salary meets Blue Card threshold confirmed", item_type: "action" },
        { label: "Degree/qualifications recognised or equivalent confirmed", item_type: "action" },
      ],
    },
    {
      title: "Gather required documents",
      description: "Collect identity and qualification documents. Foreign degrees may need recognition via anabin database.",
      estimated_duration: "1–3 weeks",
      checklist_items: [
        { label: "Valid passport", item_type: "document" },
        { label: "Employment contract (signed)", item_type: "document" },
        { label: "University degree certificate + certified translation", item_type: "document" },
        { label: "Proof of degree recognition (if required)", item_type: "document" },
        { label: "Biometric passport photos", item_type: "document" },
      ],
    },
    {
      title: "Apply at German embassy / consulate",
      description: "Apply for a national (D) visa at the German embassy in your home country to enter Germany and then convert to Blue Card.",
      estimated_duration: "4–12 weeks",
      checklist_items: [
        { label: "Embassy appointment booked", item_type: "appointment" },
        { label: "Visa application fee paid (€75)", item_type: "payment" },
        { label: "All documents submitted at embassy", item_type: "appointment" },
        { label: "National visa received", item_type: "document" },
      ],
    },
    {
      title: "Register in Germany and apply for Blue Card",
      description: "After arrival, register your address (Anmeldung) and apply for the EU Blue Card at the local Ausländerbehörde.",
      estimated_duration: "2–6 weeks",
      checklist_items: [
        { label: "Address registered at local registration office (Anmeldung)", item_type: "action" },
        { label: "Appointment at Ausländerbehörde booked", item_type: "appointment" },
        { label: "EU Blue Card issued", item_type: "document" },
        { label: "Health insurance proof provided (gesetzliche or private)", item_type: "document" },
      ],
    },
  ],
};

const germanyJobSeekerVisa: ProcessTemplate = {
  id: "de_job_seeker_visa",
  keywords: ["germany job seeker", "job search germany", "looking for work germany", "jobseeker visa germany", "find job germany", "german job seeker"],
  destination_country: "Germany",
  jurisdiction: "Germany",
  authority_name: "German Embassy / Ausländerbehörde",
  title: "Germany Job Seeker Visa",
  summary: "Allows qualified non-EU/EEA nationals to travel to Germany for up to 6 months to look for work. Requires a recognised degree.",
  timeline_summary: "Apply at the German embassy in your home country. Processing typically 4–8 weeks.",
  next_action: "Book an appointment at the nearest German embassy and gather qualification documents.",
  official_sources: [{ title: "Make it in Germany — Job Seeker Visa", url: "https://www.make-it-in-germany.com/en/visa-residence/types/job-seeker-visa" }],
  steps: [
    {
      title: "Check eligibility",
      description: "Must hold a recognised university degree or vocational qualification and have sufficient funds to support yourself.",
      estimated_duration: "1 day",
      checklist_items: [
        { label: "Degree/qualifications confirmed as recognised in Germany", item_type: "action" },
        { label: "Sufficient funds confirmed (approx. €947/month)", item_type: "action" },
        { label: "German language skills assessed (B1+ recommended)", item_type: "action" },
      ],
    },
    {
      title: "Gather documents and apply",
      description: "Apply at the German embassy in your country with your qualifications and financial proof.",
      estimated_duration: "4–8 weeks",
      checklist_items: [
        { label: "Valid passport", item_type: "document" },
        { label: "University degree + certified translation", item_type: "document" },
        { label: "Proof of funds (bank statements)", item_type: "document" },
        { label: "CV / application letter", item_type: "document" },
        { label: "Embassy appointment booked and attended", item_type: "appointment" },
        { label: "Visa fee paid (€75)", item_type: "payment" },
        { label: "Job Seeker Visa received", item_type: "document" },
      ],
    },
    {
      title: "Travel to Germany and job search",
      description: "You have up to 6 months to find a job. Once you have an offer, apply to convert to a work permit or EU Blue Card.",
      estimated_duration: "Up to 6 months",
      checklist_items: [
        { label: "Address registered in Germany (Anmeldung)", item_type: "action" },
        { label: "Job offer secured", item_type: "action" },
        { label: "Work permit or EU Blue Card application submitted", item_type: "action" },
      ],
    },
  ],
};

// ── Netherlands ────────────────────────────────────────────────────────────

const netherlandsHighlySkilledMigrant: ProcessTemplate = {
  id: "nl_highly_skilled_migrant",
  keywords: ["netherlands work", "holland work", "dutch work permit", "highly skilled migrant", "kennismigrant", "amsterdam job", "netherlands employment", "dutch employer"],
  destination_country: "Netherlands",
  jurisdiction: "Netherlands",
  authority_name: "IND (Immigration and Naturalisation Service)",
  title: "Highly Skilled Migrant Permit — Netherlands",
  summary: "Work and residence permit for non-EU/EEA skilled workers with a job offer from an IND-recognised sponsor employer. One of the fastest routes to the Netherlands.",
  timeline_summary: "Your employer applies first. IND decides within 2 weeks for recognised sponsors.",
  next_action: "Confirm your employer is an IND-recognised sponsor, then have them initiate the application.",
  official_sources: [{ title: "IND — Highly Skilled Migrant", url: "https://ind.nl/en/residence-permits/work/highly-skilled-migrant" }],
  steps: [
    {
      title: "Employer initiates application with IND",
      description: "Your employer must be an IND-recognised sponsor and submit the application on your behalf.",
      estimated_duration: "1–2 weeks",
      checklist_items: [
        { label: "Employer confirmed as IND recognised sponsor", item_type: "action" },
        { label: "Salary meets HSM threshold confirmed (€5,331/month gross in 2024 for 30+)", item_type: "action" },
        { label: "Employer submits application to IND", item_type: "action" },
      ],
    },
    {
      title: "Gather personal documents",
      description: "Provide identity documents to your employer for submission.",
      estimated_duration: "1 week",
      checklist_items: [
        { label: "Valid passport", item_type: "document" },
        { label: "Degree certificates (if applicable)", item_type: "document" },
        { label: "Signed employment contract", item_type: "document" },
      ],
    },
    {
      title: "IND issues MVV / entry visa (if required)",
      description: "If you need a short-stay visa to enter the Netherlands, IND issues an MVV (provisional residence permit).",
      estimated_duration: "2 weeks (recognised sponsors)",
      checklist_items: [
        { label: "MVV / entry visa received (if applicable)", item_type: "document" },
        { label: "Travel to Netherlands completed", item_type: "action" },
      ],
    },
    {
      title: "Register and collect residence permit",
      description: "After arrival, register at the municipality and collect your residence permit card from IND.",
      estimated_duration: "2–4 weeks",
      checklist_items: [
        { label: "Registered at municipality (gemeente)", item_type: "action" },
        { label: "BSN (citizen service number) obtained", item_type: "action" },
        { label: "Residence permit card collected from IND desk", item_type: "document" },
      ],
    },
  ],
};

// ── Ireland ────────────────────────────────────────────────────────────────

const irelandCriticalSkills: ProcessTemplate = {
  id: "ie_critical_skills",
  keywords: ["ireland work", "irish work permit", "critical skills ireland", "dublin job", "ireland employment permit", "work in ireland", "ireland tech job"],
  destination_country: "Ireland",
  jurisdiction: "Ireland",
  authority_name: "Department of Enterprise, Trade and Employment (DETE)",
  title: "Critical Skills Employment Permit — Ireland",
  summary: "Fast-track work permit for non-EEA nationals in high-demand occupations (tech, healthcare, engineering). Valid for 2 years, renewable.",
  timeline_summary: "Online application via DETE portal. Processing typically 4–8 weeks.",
  next_action: "Check that your occupation is on the Critical Skills Occupations List and that your salary meets the threshold (€38,000+).",
  official_sources: [{ title: "DETE — Critical Skills Employment Permit", url: "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/permit-types/critical-skills-employment-permit/" }],
  steps: [
    {
      title: "Confirm eligibility",
      description: "Job must be on the Critical Skills Occupations List (or pay €64,000+ regardless of role). Requires a degree or equivalent.",
      estimated_duration: "1 day",
      checklist_items: [
        { label: "Occupation on Critical Skills list confirmed", item_type: "action" },
        { label: "Salary meets threshold (€38,000+ or €64,000+)", item_type: "action" },
        { label: "Degree or equivalent qualification confirmed", item_type: "action" },
      ],
    },
    {
      title: "Gather documents",
      estimated_duration: "1–2 weeks",
      description: "Collect all required documents for the online application.",
      checklist_items: [
        { label: "Valid passport", item_type: "document" },
        { label: "Signed contract of employment", item_type: "document" },
        { label: "Degree certificate + translation (if not in English)", item_type: "document" },
        { label: "Tax clearance / compliance documentation (employer)", item_type: "document" },
      ],
    },
    {
      title: "Apply online via DETE portal",
      description: "The application can be submitted by the employer or the applicant. Pay the fee online.",
      estimated_duration: "4–8 weeks processing",
      checklist_items: [
        { label: "Online application submitted at dete.ie", item_type: "action" },
        { label: "Application fee paid (€1,000 for 2-year permit)", item_type: "payment" },
        { label: "Permit letter received", item_type: "document" },
      ],
    },
    {
      title: "Entry visa and registration in Ireland",
      description: "Use the permit letter to apply for an entry visa (if required). Register with GNIB/IRP within 90 days of arrival.",
      estimated_duration: "2–4 weeks",
      checklist_items: [
        { label: "Entry visa applied for (if required)", item_type: "action" },
        { label: "Travel to Ireland completed", item_type: "action" },
        { label: "IRP (Irish Residence Permit) registered within 90 days", item_type: "appointment" },
      ],
    },
  ],
};

// ── Australia ──────────────────────────────────────────────────────────────

const australiaSkilledIndependent: ProcessTemplate = {
  id: "au_skilled_independent_189",
  keywords: ["australia work visa", "australia skilled", "skilled independent australia", "subclass 189", "189 visa", "australia permanent residency", "move to australia", "au work permit"],
  destination_country: "Australia",
  jurisdiction: "Australia",
  authority_name: "Department of Home Affairs",
  title: "Skilled Independent Visa (Subclass 189) — Australia",
  summary: "Points-tested permanent residency visa for skilled workers not sponsored by an employer or family member. No sponsor required.",
  timeline_summary: "Submit an Expression of Interest (EOI) via SkillSelect. Invitation to apply typically issued within 1–24 months depending on points score.",
  next_action: "Get your skills assessed by the relevant assessing authority and calculate your points score.",
  official_sources: [{ title: "Home Affairs — Subclass 189", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189" }],
  steps: [
    {
      title: "Skills assessment",
      description: "Have your qualifications assessed by the relevant Australian assessing body for your occupation.",
      estimated_duration: "4–12 weeks",
      checklist_items: [
        { label: "Relevant assessing authority identified (e.g. Engineers Australia, ACS, AHPRA)", item_type: "action" },
        { label: "Skills assessment application submitted", item_type: "action" },
        { label: "Positive skills assessment received", item_type: "document" },
      ],
    },
    {
      title: "English language test",
      description: "Sit an approved English test (IELTS, PTE, TOEFL) and achieve the required score.",
      estimated_duration: "2–4 weeks",
      checklist_items: [
        { label: "English test booked (IELTS / PTE / TOEFL)", item_type: "appointment" },
        { label: "Required score achieved", item_type: "document" },
      ],
    },
    {
      title: "Submit Expression of Interest (EOI) in SkillSelect",
      description: "Create an EOI online. You will be ranked by points. Higher scores receive invitations faster.",
      estimated_duration: "1 day (then wait for invitation)",
      checklist_items: [
        { label: "EOI submitted in SkillSelect", item_type: "action" },
        { label: "Points score maximised (age, English, work experience, education)", item_type: "action" },
        { label: "Invitation to Apply (ITA) received", item_type: "document" },
      ],
    },
    {
      title: "Lodge visa application",
      description: "After receiving an ITA, you have 60 days to lodge the full application online and pay the fee.",
      estimated_duration: "8–18 months processing",
      checklist_items: [
        { label: "Full visa application lodged online (within 60 days of ITA)", item_type: "action" },
        { label: "Visa application fee paid (AUD $4,640 primary applicant)", item_type: "payment" },
        { label: "Health examination completed", item_type: "appointment" },
        { label: "Police clearance certificates provided", item_type: "document" },
        { label: "Visa grant received", item_type: "document" },
      ],
    },
  ],
};

// ── Canada ─────────────────────────────────────────────────────────────────

const canadaExpressEntry: ProcessTemplate = {
  id: "ca_express_entry",
  keywords: ["canada work visa", "canada immigration", "express entry", "federal skilled worker canada", "canada permanent residency", "canadian work permit", "canada pr", "move to canada"],
  destination_country: "Canada",
  jurisdiction: "Canada",
  authority_name: "Immigration, Refugees and Citizenship Canada (IRCC)",
  title: "Express Entry — Federal Skilled Worker (Canada)",
  summary: "Points-based permanent residency pathway for skilled workers. Managed through the Express Entry pool. No employer or provincial sponsor required.",
  timeline_summary: "IRCC targets a 6-month processing time after invitation to apply. Wait for invitation varies by CRS score.",
  next_action: "Check your eligibility (NOC TEER 0-3 occupation, language test, and 1 year skilled work experience), then create an Express Entry profile.",
  official_sources: [{ title: "IRCC — Express Entry", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html" }],
  steps: [
    {
      title: "Language test",
      description: "Sit an approved test (IELTS General or CELPIP for English; TEF Canada for French) and meet CLB 7 minimum.",
      estimated_duration: "2–4 weeks",
      checklist_items: [
        { label: "Language test booked (IELTS / CELPIP / TEF)", item_type: "appointment" },
        { label: "CLB 7 or higher achieved", item_type: "document" },
      ],
    },
    {
      title: "Educational Credential Assessment (ECA)",
      description: "Have foreign education assessed by a IRCC-designated organisation (e.g. WES).",
      estimated_duration: "4–12 weeks",
      checklist_items: [
        { label: "ECA organisation selected (e.g. WES, ICAS)", item_type: "action" },
        { label: "ECA application submitted", item_type: "action" },
        { label: "ECA report received", item_type: "document" },
      ],
    },
    {
      title: "Create Express Entry profile",
      description: "Submit your profile to the Express Entry pool. You will receive a Comprehensive Ranking System (CRS) score.",
      estimated_duration: "1 day (then wait for draw)",
      checklist_items: [
        { label: "Express Entry profile created on IRCC portal", item_type: "action" },
        { label: "CRS score calculated and noted", item_type: "action" },
        { label: "Invitation to Apply (ITA) received at a draw", item_type: "document" },
      ],
    },
    {
      title: "Submit application for permanent residence",
      description: "After ITA, submit a complete application within 60 days. IRCC targets 6-month processing.",
      estimated_duration: "6 months processing",
      checklist_items: [
        { label: "Full application submitted (within 60 days of ITA)", item_type: "action" },
        { label: "Application fee paid (CAD $1,365 + right of permanent residence fee CAD $515)", item_type: "payment" },
        { label: "Medical exam completed", item_type: "appointment" },
        { label: "Police clearance certificates provided", item_type: "document" },
        { label: "Confirmation of Permanent Residence (COPR) received", item_type: "document" },
      ],
    },
  ],
};

// ── USA ────────────────────────────────────────────────────────────────────

const usaJ1InternTrainee: ProcessTemplate = {
  id: "us_j1_intern_trainee",
  keywords: ["usa intern", "us internship", "j1 visa", "j-1 intern", "exchange visitor usa", "intern united states", "trainee usa", "us exchange program"],
  destination_country: "United States",
  jurisdiction: "United States",
  authority_name: "U.S. Department of State / USCIS",
  title: "J-1 Intern / Trainee Visa — USA",
  summary: "Exchange visitor visa for internships (current students/recent graduates, up to 12 months) or trainee programs (professionals, up to 18 months) in the USA.",
  timeline_summary: "Apply at least 2–3 months before start date. DS-160 + embassy interview required.",
  next_action: "Secure a sponsor organisation (designated programme sponsor) who will issue your DS-2019 form.",
  official_sources: [{ title: "U.S. Dept of State — J-1 Visa", url: "https://j1visa.state.gov/programs/intern" }],
  steps: [
    {
      title: "Secure a J-1 sponsor organisation",
      description: "You must work through a U.S. Department of State designated sponsor who issues the DS-2019.",
      estimated_duration: "2–6 weeks",
      checklist_items: [
        { label: "Designated sponsor organisation identified and agreed", item_type: "action" },
        { label: "DS-2019 (Certificate of Eligibility) received from sponsor", item_type: "document" },
        { label: "SEVIS fee paid ($35 intern / $220 trainee) at FMJfee.com", item_type: "payment" },
      ],
    },
    {
      title: "Complete DS-160 application and pay visa fee",
      description: "Complete the DS-160 online, pay the MRV fee, and schedule a U.S. embassy interview.",
      estimated_duration: "1–2 weeks",
      checklist_items: [
        { label: "DS-160 application completed online", item_type: "action" },
        { label: "MRV visa fee paid ($185)", item_type: "payment" },
        { label: "Embassy appointment scheduled", item_type: "appointment" },
      ],
    },
    {
      title: "Embassy / consulate interview",
      description: "Attend the interview at the U.S. embassy in your country with all required documents.",
      estimated_duration: "1–3 weeks to get appointment",
      checklist_items: [
        { label: "Valid passport brought", item_type: "document" },
        { label: "DS-2019 and SEVIS fee receipt brought", item_type: "document" },
        { label: "DS-160 confirmation page brought", item_type: "document" },
        { label: "Proof of ties to home country", item_type: "document" },
        { label: "Interview attended; J-1 visa stamp in passport", item_type: "appointment" },
      ],
    },
    {
      title: "Travel to USA and SEVIS activation",
      description: "Enter the USA no earlier than 30 days before your programme start date. Your sponsor activates your SEVIS record.",
      estimated_duration: "1 day",
      checklist_items: [
        { label: "Entry to USA completed (port of entry)", item_type: "action" },
        { label: "SEVIS record activated by sponsor", item_type: "action" },
        { label: "Local address and emergency contact registered with sponsor", item_type: "action" },
      ],
    },
  ],
};

// ── Catalog export ─────────────────────────────────────────────────────────

export const PROCESS_TEMPLATES: ProcessTemplate[] = [
  // Sweden
  swedenWorkPermit,
  swedenStudentPermit,
  swedenResidencePermitRenewal,
  swedenFamilyReunification,
  swedenCitizenship,
  // United Kingdom
  ukStudentVisa,
  ukSkilledWorkerVisa,
  ukGraduateVisa,
  ukYouthMobility,
  // Germany
  germanyEUBlueCard,
  germanyJobSeekerVisa,
  // Netherlands
  netherlandsHighlySkilledMigrant,
  // Ireland
  irelandCriticalSkills,
  // Australia
  australiaSkilledIndependent,
  // Canada
  canadaExpressEntry,
  // USA
  usaJ1InternTrainee,
];
