const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function generateCV(
  file: File | null,
  pastedText: string | null,
  jobDescription: string,
  template: string
): Promise<Blob> {
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  } else if (pastedText) {
    // Convert pasted text to a blob that the backend treats as a file
    const textBlob = new Blob([pastedText], { type: "text/plain" });
    formData.append("file", textBlob, "profile.txt");
  } else {
    throw new Error("Please provide a LinkedIn PDF or paste your profile text.");
  }

  formData.append("job_description", jobDescription);
  formData.append("template", template);

  let response: Response;

  try {
    response = await fetch(`${API_URL}/generate`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error("Network error. Please check your connection.");
  }

  if (!response.ok) {
    let detail = "Something went wrong. Please try again.";
    try {
      const json = await response.json();
      if (json.detail) detail = json.detail;
    } catch {
      // ignore parse error, use default message
    }
    throw new Error(detail);
  }

  return response.blob();
}

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