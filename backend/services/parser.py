import pdfplumber
import io

def parse_pdf(file_bytes: bytes) -> str:
    """
    Takes raw PDF bytes, returns extracted text as a single string.
    """
    text_parts = []

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)

    full_text = "\n".join(text_parts).strip()

    if not full_text:
        raise ValueError("Could not extract any text from the PDF. Make sure it is not a scanned image.")

    return full_text