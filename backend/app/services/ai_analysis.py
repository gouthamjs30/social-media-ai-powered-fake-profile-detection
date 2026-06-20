"""
MAYAJAL AI Analysis Service
Uses LLM API (Gemini, OpenAI, or Anthropic) for intelligent fraud analysis.
Falls back to heuristic analysis if no API key is configured.

Configuration (set in environment):
  AI_PROVIDER = "gemini" | "openai" | "anthropic" | "heuristic"
  GEMINI_API_KEY = your_gemini_key
  OPENAI_API_KEY = your_openai_key
  ANTHROPIC_API_KEY = your_anthropic_key
"""

import os
import re
import json
import math
import urllib.request
import urllib.error
from typing import Optional, List, Dict, Any


# ── Config ─────────────────────────────────────────────────────────────────
AI_PROVIDER = os.getenv("AI_PROVIDER", "heuristic").lower()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")


def _build_analysis_prompt(profile: Dict) -> str:
    return f"""You are an expert social media fraud analyst. Analyze this profile and determine if it is fake or suspicious.

Profile Data:
- Platform: {profile.get('platform', 'Unknown')}
- Username: {profile.get('username', 'N/A')}
- Display Name: {profile.get('display_name', 'N/A')}
- Bio: {profile.get('bio', 'N/A')}
- Followers: {profile.get('follower_count', 0)}
- Following: {profile.get('following_count', 0)}
- Posts: {profile.get('post_count', 0)}
- Account Age (days): {profile.get('account_age_days', 0)}
- Sample Posts: {json.dumps(profile.get('sample_posts', []))}
- Investigator Notes: {profile.get('notes', 'None')}

Analyze for:
1. Follower-to-following ratio anomalies
2. Account statistics suspicious patterns
3. Bio quality and authenticity
4. Post content genuineness
5. Engagement likelihood
6. Common fake account patterns

Respond ONLY with a JSON object, no other text:
{{
  "risk_score": <number 0-100>,
  "risk_level": "<Low|Medium|High>",
  "profile_score": <number 0-100>,
  "image_score": <number 0-100>,
  "content_score": <number 0-100>,
  "behavioral_score": <number 0-100>,
  "follower_score": <number 0-100>,
  "reasons": [<list of 3-5 specific reasons>],
  "recommendations": [<list of 3-5 action items>],
  "summary": "<2-3 sentence summary>"
}}"""


def _call_gemini(prompt: str) -> Optional[Dict]:
    """Call Google Gemini API."""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        payload = json.dumps({
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 800}
        }).encode()
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        # Strip markdown fences
        text = re.sub(r"```json\s*|\s*```", "", text).strip()
        return json.loads(text)
    except Exception as e:
        print(f"Gemini API error: {e}")
        return None


def _call_openai(prompt: str) -> Optional[Dict]:
    """Call OpenAI API."""
    try:
        url = "https://api.openai.com/v1/chat/completions"
        payload = json.dumps({
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
            "max_tokens": 800
        }).encode()
        req = urllib.request.Request(url, data=payload, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}"
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
        text = data["choices"][0]["message"]["content"]
        text = re.sub(r"```json\s*|\s*```", "", text).strip()
        return json.loads(text)
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return None


def _call_anthropic(prompt: str) -> Optional[Dict]:
    """Call Anthropic Claude API."""
    try:
        url = "https://api.anthropic.com/v1/messages"
        payload = json.dumps({
            "model": "claude-haiku-4-5-20251001",
            "max_tokens": 800,
            "messages": [{"role": "user", "content": prompt}]
        }).encode()
        req = urllib.request.Request(url, data=payload, headers={
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
        text = data["content"][0]["text"]
        text = re.sub(r"```json\s*|\s*```", "", text).strip()
        return json.loads(text)
    except Exception as e:
        print(f"Anthropic API error: {e}")
        return None


# ── Heuristic fallback ─────────────────────────────────────────────────────
SCAM_KEYWORDS = [
    "send money", "western union", "gift card", "wire transfer", "bitcoin",
    "investment opportunity", "guaranteed returns", "work from home", "make money fast",
    "claim your prize", "limited time", "act now", "dating", "stranded",
]

def _heuristic_analyze(profile: Dict) -> Dict:
    """Rule-based fraud analysis - used when no LLM API is available."""
    score = 0
    reasons = []
    flags = []

    followers = profile.get("follower_count") or 0
    following = profile.get("following_count") or 0
    posts = profile.get("post_count") or 0
    age = profile.get("account_age_days") or 0
    bio = (profile.get("bio") or "").lower()
    sample_posts = profile.get("sample_posts") or []

    # Follower ratio
    if following > 0 and followers >= 0:
        ratio = following / max(followers, 1)
        if ratio > 50:
            score += 30
            reasons.append(f"Extremely high following-to-follower ratio ({int(ratio)}:1)")
        elif ratio > 20:
            score += 20
            reasons.append(f"Suspicious following-to-follower ratio ({int(ratio)}:1)")
        elif ratio > 10:
            score += 10
            reasons.append("Elevated following-to-follower ratio")

    # Very low followers
    if followers < 50 and following > 500:
        score += 15
        reasons.append("Very few followers with high following count")

    # Engagement proxy
    if posts > 0 and followers < 100:
        score += 10
        reasons.append("Very low follower count relative to post count")

    # Account age
    if age > 0 and age < 30:
        score += 10
        reasons.append("Very new account (less than 30 days old)")

    # Bio analysis
    if bio:
        all_text = bio + " " + " ".join(sample_posts).lower()
        scam_count = sum(1 for kw in SCAM_KEYWORDS if kw in all_text)
        if scam_count >= 3:
            score += 25
            reasons.append(f"Multiple scam keywords detected ({scam_count} found)")
        elif scam_count >= 1:
            score += 10
            reasons.append("Suspicious keywords found in content")

        if len(bio) < 20:
            score += 8
            reasons.append("Very minimal or generic bio")
    else:
        score += 12
        reasons.append("No bio provided — common in fake accounts")

    # Generic username
    username = (profile.get("username") or "").lstrip("@")
    if re.match(r"^[a-z]+\d{4,}$", username, re.I):
        score += 8
        reasons.append("Username follows generic pattern (name + numbers)")

    # Cap and compute sub-scores
    score = min(score, 100)
    profile_score = min(score + 5, 100)
    image_score = min(score - 4, 100) if score > 10 else 20
    content_score = min(score + 8, 100)
    behavioral_score = min(score + 10, 100)
    follower_score = min(score + 12, 100)

    risk_level = "High" if score >= 75 else "Medium" if score >= 45 else "Low"

    if not reasons:
        reasons.append("No strong indicators of suspicious activity found")
    
    recommendations = []
    if score >= 75:
        recommendations = [
            "Exercise extreme caution before interacting with this account",
            "Do not send money or personal information",
            "Verify identity through a video call before trusting",
            "Report to platform administrators",
            "Block and avoid further contact",
        ]
    elif score >= 45:
        recommendations = [
            "Exercise caution when interacting with this account",
            "Verify the person's identity through other channels",
            "Do not share sensitive personal information",
            "Monitor for further suspicious behavior",
        ]
    else:
        recommendations = [
            "Profile appears relatively safe",
            "Continue to use standard online safety practices",
            "Report any suspicious behavior if noticed",
        ]

    return {
        "risk_score": score,
        "fraud_score": score,
        "risk_level": risk_level,
        "profile_score": profile_score,
        "image_score": image_score,
        "content_score": content_score,
        "behavioral_score": behavioral_score,
        "follower_score": follower_score,
        "reasons": reasons,
        "recommendations": recommendations,
        "summary": f"This profile received a fraud probability score of {score}% ({risk_level} Risk). " + (reasons[0] if reasons else ""),
        "image_analysis": {"score": image_score, "flags": flags},
        "text_analysis": {"score": content_score, "flags": []},
        "behavioral_analysis": {"score": behavioral_score, "flags": []},
        "network_analysis": {"score": follower_score, "flags": []},
    }


def _normalize_llm_result(result: Dict, profile: Dict) -> Dict:
    """Normalize LLM output to expected format."""
    score = int(result.get("risk_score", 50))
    risk_level = result.get("risk_level", "Medium")
    
    # Normalize risk level
    if isinstance(risk_level, str):
        rl = risk_level.lower()
        if "high" in rl: risk_level = "High"
        elif "medium" in rl or "moderate" in rl: risk_level = "Medium"
        else: risk_level = "Low"
    
    return {
        "risk_score": score,
        "fraud_score": score,
        "risk_level": risk_level,
        "profile_score": int(result.get("profile_score", min(score + 5, 100))),
        "image_score": int(result.get("image_score", max(score - 5, 0))),
        "content_score": int(result.get("content_score", min(score + 8, 100))),
        "behavioral_score": int(result.get("behavioral_score", min(score + 10, 100))),
        "follower_score": int(result.get("follower_score", min(score + 12, 100))),
        "reasons": result.get("reasons", []),
        "recommendations": result.get("recommendations", []),
        "summary": result.get("summary", f"Fraud probability: {score}% ({risk_level} Risk)"),
        "image_analysis": {"score": int(result.get("image_score", score)), "flags": []},
        "text_analysis": {"score": int(result.get("content_score", score)), "flags": []},
        "behavioral_analysis": {"score": int(result.get("behavioral_score", score)), "flags": []},
        "network_analysis": {"score": int(result.get("follower_score", score)), "flags": []},
    }


def analyze_profile(profile: Dict) -> Dict:
    """
    Main analysis entry point.
    Tries LLM providers in order, falls back to heuristics.
    """
    prompt = _build_analysis_prompt(profile)
    result = None

    # Try configured provider first
    if AI_PROVIDER == "gemini" and GEMINI_API_KEY:
        result = _call_gemini(prompt)
    elif AI_PROVIDER == "openai" and OPENAI_API_KEY:
        result = _call_openai(prompt)
    elif AI_PROVIDER == "anthropic" and ANTHROPIC_API_KEY:
        result = _call_anthropic(prompt)
    
    # Auto-detect from available keys
    if result is None:
        if ANTHROPIC_API_KEY:
            result = _call_anthropic(prompt)
        elif GEMINI_API_KEY:
            result = _call_gemini(prompt)
        elif OPENAI_API_KEY:
            result = _call_openai(prompt)

    if result:
        return _normalize_llm_result(result, profile)
    
    # Fallback to heuristics
    print("Using heuristic analysis (no LLM API configured)")
    return _heuristic_analyze(profile)
