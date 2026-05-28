from pypdf import PdfReader

def extract_text(file_path: str) -> str:
    reader = PdfReader(file_path)

    text = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            text.append(t)

    return "\n".join(text)