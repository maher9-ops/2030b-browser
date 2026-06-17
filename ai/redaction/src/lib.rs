//! # redaction
//!
//! On-device redaction of PII and secrets from AI prompts and crash dumps
//! (build brief §7.3.7 AI & Data, §9 crash reporter). Runs before any data may
//! leave the device. Uses std-only pattern matching (no regex crate) so it
//! compiles everywhere; production augments this with the configured regex
//! rules from the AI & Data policy domain.

/// What kind of sensitive token was found.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Finding {
    Email,
    CreditCard,
    ApiKeyLike,
}

/// Configuration toggles mirrored from the AI & Data policy domain.
#[derive(Debug, Clone, Copy)]
pub struct RedactionConfig {
    pub redact_pii: bool,
    pub redact_secrets: bool,
}

impl Default for RedactionConfig {
    fn default() -> Self {
        // Default-deny: redact everything we can detect.
        RedactionConfig {
            redact_pii: true,
            redact_secrets: true,
        }
    }
}

/// Result of redacting a piece of text.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Redacted {
    pub text: String,
    pub findings: Vec<Finding>,
}

fn looks_like_email(tok: &str) -> bool {
    let at = tok.find('@');
    match at {
        Some(i) if i > 0 && i < tok.len() - 1 => tok[i + 1..].contains('.'),
        _ => false,
    }
}

fn digits(tok: &str) -> usize {
    tok.chars().filter(|c| c.is_ascii_digit()).count()
}

fn looks_like_card(tok: &str) -> bool {
    let stripped: String = tok.chars().filter(|c| c.is_ascii_digit()).collect();
    (13..=19).contains(&stripped.len()) && digits(tok) == stripped.len() && luhn(&stripped)
}

/// Luhn checksum used to reduce false positives on card detection.
fn luhn(num: &str) -> bool {
    let mut sum = 0u32;
    let mut alt = false;
    for c in num.chars().rev() {
        let mut d = c.to_digit(10).unwrap_or(0);
        if alt {
            d *= 2;
            if d > 9 {
                d -= 9;
            }
        }
        sum += d;
        alt = !alt;
    }
    sum % 10 == 0
}

fn looks_like_api_key(tok: &str) -> bool {
    // Heuristic: long, high-entropy-ish alnum token, or common prefixes.
    let prefixes = ["sk-", "ghp_", "AKIA", "AIza", "xoxb-"];
    if prefixes.iter().any(|p| tok.starts_with(p)) {
        return true;
    }
    tok.len() >= 32
        && tok
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
}

/// Redact a text string according to `cfg`. Detected tokens are replaced with a
/// typed placeholder and reported in `findings`.
pub fn redact(input: &str, cfg: RedactionConfig) -> Redacted {
    let mut findings = Vec::new();
    let out: Vec<String> = input
        .split_whitespace()
        .map(|tok| {
            if cfg.redact_pii && looks_like_email(tok) {
                findings.push(Finding::Email);
                return "[REDACTED_EMAIL]".to_string();
            }
            if cfg.redact_pii && looks_like_card(tok) {
                findings.push(Finding::CreditCard);
                return "[REDACTED_CARD]".to_string();
            }
            if cfg.redact_secrets && looks_like_api_key(tok) {
                findings.push(Finding::ApiKeyLike);
                return "[REDACTED_SECRET]".to_string();
            }
            tok.to_string()
        })
        .collect();
    Redacted {
        text: out.join(" "),
        findings,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn redacts_email() {
        let r = redact(
            "contact me at alice@example.com please",
            RedactionConfig::default(),
        );
        assert!(r.text.contains("[REDACTED_EMAIL]"));
        assert!(r.findings.contains(&Finding::Email));
    }

    #[test]
    fn redacts_api_key_prefix() {
        let r = redact(
            "token sk-abcdefghijklmnopqrstuvwx",
            RedactionConfig::default(),
        );
        assert!(r.text.contains("[REDACTED_SECRET]"));
    }

    #[test]
    fn redacts_valid_card_number() {
        // 4111111111111111 is a well-known Luhn-valid test number.
        let r = redact("card 4111111111111111 end", RedactionConfig::default());
        assert!(r.text.contains("[REDACTED_CARD]"));
    }

    #[test]
    fn leaves_ordinary_text() {
        let r = redact("the quick brown fox", RedactionConfig::default());
        assert_eq!(r.text, "the quick brown fox");
        assert!(r.findings.is_empty());
    }

    #[test]
    fn respects_disabled_toggles() {
        let cfg = RedactionConfig {
            redact_pii: false,
            redact_secrets: false,
        };
        let r = redact("alice@example.com sk-abcdefghijklmnopqrstuvwx", cfg);
        assert!(r.findings.is_empty());
    }
}
