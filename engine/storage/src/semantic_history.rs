//! On-device semantic history index (forward feature §9.3).
//!
//! History entries are embedded into vectors and searched locally. Nothing
//! leaves the device. Production embeddings come from the bundled local model;
//! here we use a deterministic hashing embedding so the search logic is testable
//! and self-contained.

/// A single history entry with its embedding.
#[derive(Debug, Clone)]
pub struct Entry {
    pub url: String,
    pub title: String,
    embedding: Vec<f32>,
}

/// Dimensionality of the toy embedding. Production uses the model's dimension.
const DIM: usize = 64;

/// Deterministic bag-of-words hashing embedding (placeholder for the local
/// model's encoder). Lowercased, split on non-alphanumerics, hashed into DIM
/// buckets, then L2-normalized.
pub fn embed(text: &str) -> Vec<f32> {
    let mut v = vec![0f32; DIM];
    for tok in text
        .to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|t| !t.is_empty())
    {
        let mut h: u64 = 1469598103934665603; // FNV-1a offset basis
        for b in tok.bytes() {
            h ^= b as u64;
            h = h.wrapping_mul(1099511628211);
        }
        v[(h as usize) % DIM] += 1.0;
    }
    let norm = v.iter().map(|x| x * x).sum::<f32>().sqrt();
    if norm > 0.0 {
        for x in &mut v {
            *x /= norm;
        }
    }
    v
}

fn cosine(a: &[f32], b: &[f32]) -> f32 {
    a.iter().zip(b).map(|(x, y)| x * y).sum()
}

/// The local, encrypted-at-rest semantic history index.
#[derive(Debug, Default)]
pub struct SemanticIndex {
    entries: Vec<Entry>,
}

impl SemanticIndex {
    pub fn new() -> Self {
        Self::default()
    }

    /// Add a visited page to the index.
    pub fn add(&mut self, url: &str, title: &str) {
        let embedding = embed(&format!("{title} {url}"));
        self.entries.push(Entry {
            url: url.to_string(),
            title: title.to_string(),
            embedding,
        });
    }

    /// Search the index by natural-language query, returning up to `k` results
    /// ranked by cosine similarity.
    pub fn search(&self, query: &str, k: usize) -> Vec<(&Entry, f32)> {
        let q = embed(query);
        let mut scored: Vec<(&Entry, f32)> = self
            .entries
            .iter()
            .map(|e| (e, cosine(&q, &e.embedding)))
            .collect();
        scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        scored.truncate(k);
        scored
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_semantically_relevant_entry() {
        let mut idx = SemanticIndex::new();
        idx.add("https://rust-lang.org", "Rust programming language");
        idx.add("https://recipes.example", "Chocolate cake recipe");
        let results = idx.search("programming language", 1);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].0.url, "https://rust-lang.org");
    }

    #[test]
    fn embedding_is_normalized() {
        let v = embed("hello world");
        let norm: f32 = v.iter().map(|x| x * x).sum::<f32>().sqrt();
        assert!((norm - 1.0).abs() < 1e-5);
    }
}
