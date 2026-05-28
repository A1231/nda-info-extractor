def validate_nda(data: dict):
    flags = []
    score = 0

    # Missing governing law
    if not data.get("governing_law"):
        flags.append("Missing governing law")
        score += 10

    # Missing destruction clause
    if not data.get("return_or_destroy_required"):
        flags.append("No data destruction requirement")
        score += 25

    # Long confidentiality period
    survival = data.get("confidentiality_survival")
    if survival and "year" in survival:
        try:
            years = int(''.join(filter(str.isdigit, survival)))
            if years >= 5:
                flags.append("Long confidentiality period")
                score += 20
        except:
            pass

    # Risk keywords
    text_blob = str(data).lower()
    for kw in ["indefinite", "perpetual", "sole discretion"]:
        if kw in text_blob:
            flags.append(f"Risk keyword: {kw}")
            score += 10

    if score >= 40:
        level = "HIGH"
    elif score >= 20:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "risk_flags": flags,
        "risk_score": score,
        "risk_level": level
    }