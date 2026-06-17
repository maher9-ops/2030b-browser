//! Structured decision provenance (build brief §7.4): every policy decision
//! emits a span with decision, inputs, matched rule, and provenance. In
//! production these are OpenTelemetry spans; here we model the structured record
//! and a stable serialization for the audit log.

use super::precedence::Layer;

/// A structured record of a single policy decision.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DecisionSpan {
    pub domain: String,
    pub key: String,
    pub decision: String,
    pub matched_rule: String,
    pub source_layer: Layer,
    /// Sorted (k=v) input pairs for reproducibility.
    pub inputs: Vec<(String, String)>,
}

impl DecisionSpan {
    pub fn new(domain: &str, key: &str, decision: &str, matched_rule: &str, source: Layer) -> Self {
        DecisionSpan {
            domain: domain.to_string(),
            key: key.to_string(),
            decision: decision.to_string(),
            matched_rule: matched_rule.to_string(),
            source_layer: source,
            inputs: Vec::new(),
        }
    }

    /// Attach an input; inputs are kept sorted for deterministic serialization.
    pub fn with_input(mut self, k: &str, v: &str) -> Self {
        self.inputs.push((k.to_string(), v.to_string()));
        self.inputs.sort();
        self
    }

    /// Deterministic single-line serialization used by the audit log and tests.
    pub fn to_log_line(&self) -> String {
        let inputs: Vec<String> = self
            .inputs
            .iter()
            .map(|(k, v)| format!("{k}={v}"))
            .collect();
        format!(
            "domain={} key={} decision={} rule={} source={} inputs=[{}]",
            self.domain,
            self.key,
            self.decision,
            self.matched_rule,
            self.source_layer.name(),
            inputs.join(",")
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn serializes_deterministically() {
        let span = DecisionSpan::new(
            "network",
            "doh.provider",
            "allow",
            "enterprise_doh",
            Layer::Enterprise,
        )
        .with_input("data_residency", "eu")
        .with_input("origin", "https://x.example");
        assert_eq!(
            span.to_log_line(),
            "domain=network key=doh.provider decision=allow rule=enterprise_doh source=enterprise inputs=[data_residency=eu,origin=https://x.example]"
        );
    }
}
