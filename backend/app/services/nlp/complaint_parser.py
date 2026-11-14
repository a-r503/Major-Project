import re
from typing import Dict, Any, Optional, Tuple

# Predefined categories:
# 1. Missing Food Item / Ingredient
# 2. Package Tampering / Condition Change
# 3. Food Spillage / Leakage
# 4. Foreign Object in Food
# 5. Other Order Issues (Unsupported by CV)

KNOWN_INGREDIENTS = [
    "paneer", "cheese", "onion", "tomato", "capsicum", "mushroom", 
    "olive", "pepperoni", "chicken", "bacon", "jalapeno", "corn", 
    "garlic", "basil", "sauce", "patty", "lettuce", "pickle", 
    "mayo", "fries", "egg", "noodles", "rice", "crust"
]

CATEGORY_KEYWORDS = {
    "Missing Food Item / Ingredient": [
        "missing", "no paneer", "no cheese", "no onion", "without", "lacks", 
        "forgot", "omitted", "didn't include", "did not include", "ingredient", 
        "topping", "where is", "left out", "not included", "absent"
    ],
    "Package Tampering / Condition Change": [
        "tamper", "seal broken", "opened", "seal cut", "tape removed", 
        "packaging altered", "torn package", "unsealed", "box ripped", 
        "opened container", "bag open", "unwrapped", "tampered"
    ],
    "Food Spillage / Leakage": [
        "spill", "leak", "leaked", "leaking", "spilled", "spilt", "mess", 
        "oil stain", "crushed", "soaked bag", "gravy out", "curry spilled", 
        "container squished", "liquid everywhere"
    ],
    "Foreign Object in Food": [
        "foreign object", "hair", "insect", "bug", "plastic", "stone", 
        "metal", "wire", "staple", "nail", "glass", "thread", "debris", 
        "fly", "cockroach", "worm", "sharp piece"
    ]
}

UNSUPPORTED_KEYWORDS = [
    "cold", "late", "delayed", "rude", "taste bad", "stale", "wrong address", 
    "undelivered", "smell", "flavor", "salty", "spicy", "too long", "slow"
]

def extract_target_ingredient(query: str) -> Optional[str]:
    """
    Dynamically extract the target ingredient from complaint text.
    E.g. 'I ordered a paneer pizza, but there is no paneer on it.' -> 'paneer'
    """
    lower_query = query.lower()
    
    # Priority check for common 'no <ingredient>', 'missing <ingredient>' patterns
    patterns = [
        r"(?:no|missing|without|lacks?|forgot(?:ten)?|omitted)\s+([a-z]+)",
        r"(?:where is the|left out the|did not add)\s+([a-z]+)",
        r"([a-z]+)\s+(?:is missing|was missing|was not added|is not on it|is absent)"
    ]
    for pattern in patterns:
        match = re.search(pattern, lower_query)
        if match:
            candidate = match.group(1).strip()
            if candidate in KNOWN_INGREDIENTS:
                return candidate
            # also accept common variations
            if candidate.endswith("s") and candidate[:-1] in KNOWN_INGREDIENTS:
                return candidate[:-1]
            return candidate

    # Fallback: scan for any known ingredient mention in the query
    for ing in KNOWN_INGREDIENTS:
        if re.search(r"\b" + re.escape(ing) + r"\b", lower_query):
            return ing
            
    return None

def classify_complaint_text(query: str, user_selected_category: Optional[str] = None) -> Tuple[str, Optional[str], str]:
    """
    Returns (category, target_ingredient, model_name)
    """
    lower_query = query.lower()
    
    # Check if category is already explicitly provided by user
    if user_selected_category and user_selected_category != "Auto-Detect":
        cat = user_selected_category
    else:
        # Check for unsupported issues first
        for ukw in UNSUPPORTED_KEYWORDS:
            if ukw in lower_query and not any(kw in lower_query for kw in ["spill", "leak", "tamper", "hair", "insect", "paneer"]):
                return (
                    "Other Order Issues",
                    None,
                    "None"
                )

        # Match against category keywords
        matched_category = None
        max_matches = 0
        for category, keywords in CATEGORY_KEYWORDS.items():
            matches = sum(1 for kw in keywords if kw in lower_query)
            if matches > max_matches:
                max_matches = matches
                matched_category = category

        cat = matched_category or "Missing Food Item / Ingredient"

    target_ing = None
    if cat == "Missing Food Item / Ingredient":
        target_ing = extract_target_ingredient(query)
        model = "Model 1: Food Ingredient Detection"
    elif cat == "Package Tampering / Condition Change":
        model = "Model 2: Package Tampering & Condition Verification"
    elif cat == "Food Spillage / Leakage":
        model = "Model 3: Food Spillage & Leakage Detection"
    elif cat == "Foreign Object in Food":
        model = "Model 4: Foreign Object Detection"
    else:
        model = "None"

    return cat, target_ing, model
