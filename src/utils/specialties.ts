// short descriptions for specialties we recognize, matched by name
const DESCRIPTIONS: Record<string, string> = {
  "family medicine": "General primary care for individuals and families, including checkups, preventive care, and common illnesses.",
  "internal medicine": "Primary care for adults, focused on preventing, diagnosing, and managing ongoing health conditions.",
  cardiology: "Care for the heart and blood vessels, including conditions such as high blood pressure and irregular heartbeat.",
  dermatology: "Care for conditions that affect the skin, hair, and nails.",
  orthopedics: "Care for bones, joints, muscles, and ligaments, including injuries and conditions that affect movement.",
  neurology: "Care for conditions of the brain, spinal cord, and nerves, such as headaches, seizures, and numbness.",
  endocrinology: "Care for hormone related conditions, such as diabetes and thyroid disorders.",
};

// description for a specialty, with a general sentence for names we don't recognize
export function specialtyDescription(name: string) {
  return DESCRIPTIONS[name.trim().toLowerCase().replace(/\s+/g, " ")] ?? "Care from our physicians who practice in this specialty.";
}
