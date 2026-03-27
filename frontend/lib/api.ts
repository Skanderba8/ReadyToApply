const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface CVData {
  name: string;
  title: string;
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
  };
  summary: string;
  experience: {
    company: string;
    title: string;
    location: string;
    start: string;
    end: string;
    bullets: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    year: string;
  }[];
  skills: string[];
  certifications: {
    name: string;
    issuer: string;
    year: string;
  }[];
  languages: {
    language: string;
    level: string;
  }[];
  projects: {
    name: string;
    description: string;
    url?: string;
    year?: string;
  }[];
}

export interface Keywords {
  technical: string[];
  soft: string[];
  industry: string[];
}

export interface ExtractResult {
  cv: CVData;
  keywords: Keywords;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildFileFormData(file: File | null, pastedText: string | null): FormData {
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  } else if (pastedText) {
    const textBlob = new Blob([pastedText], { type: "text/plain" });
    formData.append("file", textBlob, "profile.pdf");
  } else {
    throw new Error("Please provide a LinkedIn PDF or paste your profile text.");
  }
  return formData;
}

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const json = await response.json();
    if (json.detail) return json.detail;
  } catch {
    // ignore
  }
  return "Something went wrong. Please try again.";
}

// ---------------------------------------------------------------------------
// Step 1 — Extract CV data + keywords (no .docx yet)
// ---------------------------------------------------------------------------
export async function extractCV(
  file: File | null,
  pastedText: string | null,
  jobDescription: string
): Promise<ExtractResult> {
  const formData = buildFileFormData(file, pastedText);
  formData.append("job_description", jobDescription);

  let response: Response;
  try {
    response = await fetch(`${API_URL}/extract`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error("Network error. Please check your connection and try again.");
  }

  if (!response.ok) {
    const detail = await parseErrorResponse(response);
    throw new Error(detail);
  }

  return response.json() as Promise<ExtractResult>;
}

// ---------------------------------------------------------------------------
// Step 2 — Generate .docx from (possibly edited) CV data
// ---------------------------------------------------------------------------
export async function generateCV(
  cvData: CVData,
  jobDescription: string,
  template: string,
  keywords?: Keywords
): Promise<Blob> {
  const formData = new FormData();
  formData.append("cv_data", JSON.stringify(cvData));
  formData.append("job_description", jobDescription);
  formData.append("template", template);
  if (keywords) {
    formData.append("keywords", JSON.stringify(keywords));
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/generate`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error("Network error. Please check your connection and try again.");
  }

  if (!response.ok) {
    const detail = await parseErrorResponse(response);
    throw new Error(detail);
  }

  return response.blob();
}

// ---------------------------------------------------------------------------
// Step 2b — Generate PDF
// ---------------------------------------------------------------------------
export async function generateCVPdf(
  cvData: CVData,
  jobDescription: string,
  template: string,
  keywords?: Keywords
): Promise<Blob> {
  const formData = new FormData();
  formData.append("cv_data", JSON.stringify(cvData));
  formData.append("job_description", jobDescription);
  formData.append("template", template);
  if (keywords) {
    formData.append("keywords", JSON.stringify(keywords));
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/generate-pdf`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error("Network error. Please check your connection and try again.");
  }

  if (!response.ok) {
    const detail = await parseErrorResponse(response);
    throw new Error(detail);
  }

  return response.blob();
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}