import re

def format_e164_phone_number(raw_phone, default_country_code="+91"):
    """
    Format any phone number into E.164 international format (+<country_code><number>).
    Handles Indian 10-digit numbers, US 10-digit numbers, and pre-formatted numbers without double prefixing.
    """
    if not raw_phone:
        return ""

    cleaned = re.sub(r'[^\d+]', '', str(raw_phone).strip())

    if cleaned.startswith('+'):
        return cleaned

    if cleaned.startswith('00'):
        return '+' + cleaned[2:]

    if cleaned.startswith('0') and len(cleaned) == 11:
        cleaned = cleaned[1:]

    if len(cleaned) == 10 and cleaned[0] in '6789':
        return f"{default_country_code}{cleaned}"

    if len(cleaned) == 10:
        return f"+1{cleaned}"

    if len(cleaned) == 12 and cleaned.startswith('91'):
        return f"+{cleaned}"

    if len(cleaned) == 11 and cleaned.startswith('1'):
        return f"+{cleaned}"

    return f"+{cleaned}"
