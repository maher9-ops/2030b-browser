# Local-First Safe Browsing Classifier

Replaces Google Safe Browsing's URL-checking with an **on-device ML classifier**
(Chrome parity §5.11, status: replaced). Browser 2030B never sends visited URLs
to any server.

- **Input:** URL lexical features + page DOM features (local only).
- **Output:** {benign, phishing, malware} with a confidence score.
- **Update:** model + heuristic lists updated via signed bundles over Oblivious
  HTTP; the update channel cannot learn which URLs you visit.
- **Fallback:** if confidence is low, the user sees a soft warning, never a
  server round-trip.
