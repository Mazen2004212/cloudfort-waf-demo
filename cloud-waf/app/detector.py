"""
Attack Detector
===============
Pattern-based detection engine with:
- Severity-weighted scoring per attack category
- Confidence threshold to reduce false positives
- Normalisation pass (URL-decode, HTML-entity decode, null-byte strip)
  so attackers cannot bypass patterns with simple encoding tricks
"""

import re
import urllib.parse
import html

from config import DETECTION_BLOCK_THRESHOLD


# ---------------------------------------------------------------------------
# Pattern registry
# Each entry: (compiled_regex, severity_score)
# Severity: 1 = low, 2 = medium, 3 = high
# A request's total score across all matches is compared to BLOCK_THRESHOLD.
# ---------------------------------------------------------------------------

_RAW_PATTERNS: dict[str, list[tuple[str, int]]] = {

    "SQL Injection": [
        (r"(?i)\bUNION\b.{0,30}\bSELECT\b",               3),
        (r"(?i)\bSELECT\b.{0,60}\bFROM\b",                 2),
        (r"(?i)\bDROP\b\s+\bTABLE\b",                      3),
        (r"(?i)\bINSERT\b\s+\bINTO\b",                     2),
        (r"(?i)\bDELETE\b\s+\bFROM\b",                     2),
        (r"(?i)\bUPDATE\b.{0,60}\bSET\b",                  2),
        (r"(?i)\bOR\b\s+['\"]?\d+['\"]?\s*=\s*['\"]?\d+",  3),  # OR 1=1 / OR '1'='1'
        (r"(?i)'\s*--",                                     3),  # comment-based bypass
        (r"(?i)\bEXEC\b\s*\(",                              3),
        (r"(?i)\bCAST\s*\(",                                2),
        (r"(?i)\bCONVERT\s*\(",                             2),
        (r"(?i)\bSLEEP\s*\(\d+\)",                          3),  # time-based blind
        (r"(?i)\bWAITFOR\b\s+\bDELAY\b",                   3),
        (r"(?i)\bINFORMATION_SCHEMA\b",                     2),
        (r"(?i)\bSYSOBJECTS\b|\bSYSCOLUMNS\b",             2),
        (r"(?i)\bLOAD_FILE\s*\(",                           3),
        (r"(?i)\bINTO\s+OUTFILE\b",                         3),
        (r"(?i)\bBENCHMARK\s*\(",                           3),
    ],

    "XSS": [
        (r"(?i)<script[\s>]",                               3),
        (r"(?i)</script\s*>",                               3),
        (r"(?i)\bon\w+\s*=",                                2),  # onerror=, onload= …
        (r"(?i)javascript\s*:",                             3),
        (r"(?i)vbscript\s*:",                               3),
        (r"(?i)data\s*:\s*text/html",                       2),
        (r"(?i)alert\s*\(",                                 2),
        (r"(?i)confirm\s*\(",                               2),
        (r"(?i)prompt\s*\(",                                2),
        (r"(?i)document\s*\.\s*cookie",                     3),
        (r"(?i)document\s*\.\s*write\s*\(",                 2),
        (r"(?i)window\s*\.\s*location",                     2),
        (r"(?i)<iframe[\s>]",                               3),
        (r"(?i)<object[\s>]",                               2),
        (r"(?i)<embed[\s>]",                                2),
        (r"(?i)eval\s*\(",                                  2),
        (r"(?i)fromCharCode\s*\(",                          2),
        (r"(?i)&#x?\d+;",                                   1),  # HTML entities (low)
    ],

    "Path Traversal": [
        (r"(?:\.\./){2,}",                                  3),  # ../../  (2+ levels)
        (r"(?:\.\.\\){2,}",                                 3),
        (r"%2e%2e%2f",                                      3),  # URL-encoded ../
        (r"%2e%2e/",                                        3),
        (r"\.\.%2f",                                        3),
        (r"(?i)/etc/passwd",                                3),
        (r"(?i)/etc/shadow",                                3),
        (r"(?i)/proc/self/",                                2),
        (r"(?i)boot\.ini",                                  3),
        (r"(?i)win\.ini",                                   2),
        (r"(?i)/windows/system32",                          3),
    ],

    "Command Injection": [
        (r"[;&|`]\s*(ls|dir|cat|type|whoami|id|pwd|uname)",  3),
        (r"\$\s*\(",                                          2),  # $(cmd)
        (r"`[^`]+`",                                          2),  # `cmd`
        (r"(?i)\|\s*(bash|sh|cmd|powershell)",               3),
        (r"(?i)\bwget\b|\bcurl\b",                            2),
        (r"(?i)\bchmod\b|\bchown\b",                          2),
        (r"(?i)\bnetcat\b|\bnc\b\s+-",                       3),
        (r"(?i)\bnmap\b",                                     2),
        (r"(?i)/bin/(bash|sh|zsh|ksh)",                      3),
        (r"(?i)cmd\.exe",                                     3),
        (r"(?i)powershell\s+-",                              3),
    ],

    "SSRF": [
        (r"(?i)http://localhost",                             3),
        (r"(?i)http://127\.",                                 3),
        (r"(?i)http://0\.0\.0\.0",                           3),
        (r"(?i)http://\[::1\]",                              3),
        (r"(?i)file://",                                      3),
        (r"(?i)dict://",                                      2),
        (r"(?i)gopher://",                                    2),
        (r"(?i)169\.254\.169\.254",                          3),  # AWS metadata
        (r"(?i)metadata\.google\.internal",                  3),  # GCP metadata
    ],

    "XXE": [
        (r"(?i)<!ENTITY",                                    3),
        (r"(?i)SYSTEM\s+[\"']file://",                      3),
        (r"(?i)SYSTEM\s+[\"']http://",                      2),
        (r"(?i)<!DOCTYPE[^>]*\[",                            2),
    ],

    "Log4Shell": [
        (r"(?i)\$\{jndi:",                                   3),
        (r"(?i)\$\{.*:.*://",                                3),
    ],
}

# Compile all patterns once at import time
ATTACK_PATTERNS: dict[str, list[tuple[re.Pattern, int]]] = {
    category: [(re.compile(pat), score) for pat, score in entries]
    for category, entries in _RAW_PATTERNS.items()
}


# ---------------------------------------------------------------------------
# Normalisation helpers
# ---------------------------------------------------------------------------

def _normalise(data: str) -> str:
    """
    Return a normalised copy of *data* that makes encoded bypass attempts
    visible to our regex patterns.
    Steps:
      1. Strip null bytes
      2. URL-decode (up to 3 passes to catch double-encoding)
      3. HTML-entity decode
      4. Collapse duplicate whitespace
    """
    cleaned = data.replace("\x00", "")
    for _ in range(3):
        decoded = urllib.parse.unquote(cleaned)
        if decoded == cleaned:
            break
        cleaned = decoded
    cleaned = html.unescape(cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

class DetectionResult:
    __slots__ = ("attack_type", "score", "matched_patterns")

    def __init__(self, attack_type: str, score: int, matched_patterns: list[str]):
        self.attack_type = attack_type
        self.score = score
        self.matched_patterns = matched_patterns

    def __bool__(self) -> bool:
        return self.score >= DETECTION_BLOCK_THRESHOLD


def detect_attack(data: str) -> DetectionResult | None:
    """
    Inspect *data* for attack patterns.

    Returns a :class:`DetectionResult` if the combined severity score of any
    single attack category meets or exceeds ``DETECTION_BLOCK_THRESHOLD``,
    otherwise returns ``None``.

    The highest-scoring category is returned when multiple categories match.
    """
    normalised = _normalise(data)

    best: DetectionResult | None = None

    for category, patterns in ATTACK_PATTERNS.items():
        total_score = 0
        matched: list[str] = []

        for regex, severity in patterns:
            if regex.search(normalised):
                total_score += severity
                matched.append(regex.pattern)

        if total_score > 0:
            result = DetectionResult(category, total_score, matched)
            if result and (best is None or total_score > best.score):
                best = result

    return best