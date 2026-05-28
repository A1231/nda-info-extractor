import tempfile
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from pdf_reader import extract_text
from extractor import extract_nda
from validation import validate_nda

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    # save file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        path = tmp.name

    # extract text
    text = extract_text(path)

    # LLM extraction
    result = extract_nda(text)

    # validation layer
    if "error" not in result:
        result["validation"] = validate_nda(result)

    return result