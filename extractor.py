import json
import os
import anthropic
from dotenv import load_dotenv
from prompts import NDA_PROMPT

load_dotenv()

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# claude-sonnet-4-6 pricing (USD per million tokens)
_INPUT_COST_PER_MTK = 3.00
_OUTPUT_COST_PER_MTK = 15.00

def extract_nda(text: str):
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        system=NDA_PROMPT,
        messages=[
            {
                "role": "user",
                "content": text
            }
        ]
    )

    input_tokens = response.usage.input_tokens
    output_tokens = response.usage.output_tokens
    cost_usd = (input_tokens * _INPUT_COST_PER_MTK + output_tokens * _OUTPUT_COST_PER_MTK) / 1_000_000

    raw = response.content[0].text

    try:
        result = json.loads(raw)
    except Exception:
        result = {
            "error": "invalid_json",
            "raw": raw
        }

    result["_usage"] = {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cost_usd": round(cost_usd, 6)
    }

    return result
