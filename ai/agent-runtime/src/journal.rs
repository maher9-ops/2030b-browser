//! Action journal for reversibility and audit (forward feature 9.2).

/// A single recorded agent action.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct JournalEntry {
    pub tool: String,
    pub site: String,
}

impl JournalEntry {
    pub fn new(tool: &str, site: &str) -> Self {
        JournalEntry {
            tool: tool.to_string(),
            site: site.to_string(),
        }
    }
}

/// An append-only journal of agent actions. Supports listing for audit and a
/// best-effort `undo` that pops the most recent action (the caller is
/// responsible for performing the inverse browser operation).
#[derive(Debug, Default)]
pub struct ActionJournal {
    entries: Vec<JournalEntry>,
}

impl ActionJournal {
    pub fn new() -> Self {
        ActionJournal {
            entries: Vec::new(),
        }
    }

    pub fn record(&mut self, entry: JournalEntry) {
        self.entries.push(entry);
    }

    /// Pop the most recent action for reversal. Returns it so the caller can
    /// apply the inverse operation.
    pub fn undo(&mut self) -> Option<JournalEntry> {
        self.entries.pop()
    }

    pub fn len(&self) -> usize {
        self.entries.len()
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    pub fn entries(&self) -> &[JournalEntry] {
        &self.entries
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn records_and_undoes() {
        let mut j = ActionJournal::new();
        j.record(JournalEntry::new("click", "https://x.example"));
        j.record(JournalEntry::new("type", "https://x.example"));
        assert_eq!(j.len(), 2);
        let last = j.undo().unwrap();
        assert_eq!(last.tool, "type");
        assert_eq!(j.len(), 1);
    }
}
