//! WebRender-equivalent compositor abstraction (Firefox §6.30).
//!
//! The real compositor batches display-list items into GPU draw calls. This
//! module models the display-list → batch reduction so scheduling logic is
//! testable without a GPU.

/// A single item in a display list.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DisplayItem {
    Rect { layer: u32 },
    Text { layer: u32 },
    Image { layer: u32 },
}

impl DisplayItem {
    fn layer(&self) -> u32 {
        match self {
            DisplayItem::Rect { layer }
            | DisplayItem::Text { layer }
            | DisplayItem::Image { layer } => *layer,
        }
    }
}

/// A batch of items that can be drawn in a single GPU call (same layer + kind).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Batch {
    pub layer: u32,
    pub kind: &'static str,
    pub count: usize,
}

fn kind_of(item: &DisplayItem) -> &'static str {
    match item {
        DisplayItem::Rect { .. } => "rect",
        DisplayItem::Text { .. } => "text",
        DisplayItem::Image { .. } => "image",
    }
}

/// Reduce a display list into batches. Items are grouped by (layer, kind),
/// preserving layer order, to minimize GPU state changes.
pub fn batch(items: &[DisplayItem]) -> Vec<Batch> {
    let mut out: Vec<Batch> = Vec::new();
    for item in items {
        let layer = item.layer();
        let kind = kind_of(item);
        if let Some(last) = out.last_mut() {
            if last.layer == layer && last.kind == kind {
                last.count += 1;
                continue;
            }
        }
        out.push(Batch {
            layer,
            kind,
            count: 1,
        });
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn consecutive_same_kind_layer_coalesce() {
        let items = vec![
            DisplayItem::Rect { layer: 0 },
            DisplayItem::Rect { layer: 0 },
            DisplayItem::Text { layer: 0 },
        ];
        let batches = batch(&items);
        assert_eq!(batches.len(), 2);
        assert_eq!(batches[0].count, 2);
        assert_eq!(batches[1].kind, "text");
    }
}
