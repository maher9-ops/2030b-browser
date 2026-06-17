//! End-to-end integration tests spanning IPC capabilities, the admin policy
//! engine, the extension MV4 host, and the redaction pipeline.

use engine_ipc::{Authority, Broker};
use policy_engine::precedence::{Layer, Resolver};

#[test]
fn capability_minted_for_origin_grants_only_requested_authority() {
    let broker = Broker::new();
    let cap = broker.mint("https://app.example", &[Authority::NetworkFetch], 60);

    // Granted authority verifies for the right origin.
    assert!(broker
        .verify(&cap, "https://app.example", Authority::NetworkFetch)
        .is_ok());

    // Different origin must be rejected (origin-bound).
    assert!(broker
        .verify(&cap, "https://evil.example", Authority::NetworkFetch)
        .is_err());

    // Authority it was not granted must be rejected (no ambient authority).
    assert!(broker
        .verify(&cap, "https://app.example", Authority::StorageWrite)
        .is_err());
}

#[test]
fn attenuation_cannot_amplify_authority() {
    let broker = Broker::new();
    let cap = broker.mint(
        "https://app.example",
        &[Authority::NetworkFetch, Authority::StorageRead],
        60,
    );

    // Attenuate down to a single authority with an earlier (never later) expiry.
    let earlier_expiry: u64 = 1;
    let weaker = cap
        .attenuate(&[Authority::StorageRead], earlier_expiry)
        .expect("attenuation to a subset must succeed");
    assert!(weaker.grants(Authority::StorageRead));
    assert!(!weaker.grants(Authority::NetworkFetch));

    // Attempting to attenuate to an authority not held must fail (no amplify).
    assert!(cap
        .attenuate(&[Authority::AgentActuate], earlier_expiry)
        .is_err());
}

#[test]
fn admin_policy_precedence_enterprise_wins() {
    let mut r = Resolver::new();
    r.set("network.https_mode", Layer::Default, "https_first", false);
    r.set("network.https_mode", Layer::User, "https_first", false);
    r.set("network.https_mode", Layer::Enterprise, "https_only", true);

    let resolved = r.resolve("network.https_mode").expect("value present");
    assert_eq!(resolved.effective, "https_only");
    assert_eq!(resolved.source, Layer::Enterprise);
    assert!(resolved.locked);
}

#[test]
fn extension_install_is_gated_by_policy_and_default_deny() {
    use mv4_host::Mv4Manifest;
    use policy_bridge::{evaluate, InstallDecision, KEY_ALLOWLIST, KEY_INSTALL_MODE};

    let manifest = Mv4Manifest {
        name: "Helper".into(),
        permissions: vec!["storage".into()],
        host_capability_origins: vec![],
        blocking_web_request_requires_admin_approval: false,
    };

    // No policy => default-deny.
    let empty = Resolver::new();
    assert!(matches!(
        evaluate(&empty, "helper", &manifest),
        InstallDecision::Deny { .. }
    ));

    // Allowlist mode with the id present => allow.
    let mut r = Resolver::new();
    r.set(KEY_INSTALL_MODE, Layer::Enterprise, "allowlist", true);
    r.set(KEY_ALLOWLIST, Layer::Enterprise, "helper", true);
    assert!(matches!(
        evaluate(&r, "helper", &manifest),
        InstallDecision::Allow { .. }
    ));
}

#[test]
fn redaction_removes_secrets_before_they_could_reach_ai() {
    use redaction::{redact, RedactionConfig};
    let input = "contact me at jane.doe@example.com or card 4111111111111111 today";
    let out = redact(input, RedactionConfig::default());
    assert!(!out.text.contains("jane.doe@example.com"));
    assert!(!out.text.contains("4111111111111111"));
    assert!(!out.findings.is_empty());
}
