//! Screen / region / element capture with conditional focus (Chrome §5.24).

/// What the user is capturing.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CaptureTarget {
    Screen,
    Window { id: u64 },
    Region { x: u32, y: u32, w: u32, h: u32 },
    Element { dom_node_id: u64 },
}

/// Conditional-focus behavior: whether starting capture focuses the target.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConditionalFocus {
    FocusCapturedSurface,
    NoFocusChange,
}

/// A capture request, gated by the per-site `ScreenCapture` permission.
#[derive(Debug, Clone)]
pub struct CaptureRequest {
    pub origin: String,
    pub target: CaptureTarget,
    pub focus: ConditionalFocus,
}

/// Validate a capture request. Element capture must reference a node; region
/// capture must have non-zero dimensions.
pub fn validate(req: &CaptureRequest) -> Result<(), &'static str> {
    match &req.target {
        CaptureTarget::Region { w, h, .. } if *w == 0 || *h == 0 => {
            Err("region capture requires non-zero dimensions")
        }
        _ => Ok(()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn zero_region_rejected() {
        let req = CaptureRequest {
            origin: "https://x.example".into(),
            target: CaptureTarget::Region {
                x: 0,
                y: 0,
                w: 0,
                h: 10,
            },
            focus: ConditionalFocus::NoFocusChange,
        };
        assert!(validate(&req).is_err());
    }

    #[test]
    fn element_capture_ok() {
        let req = CaptureRequest {
            origin: "https://x.example".into(),
            target: CaptureTarget::Element { dom_node_id: 42 },
            focus: ConditionalFocus::FocusCapturedSurface,
        };
        assert!(validate(&req).is_ok());
    }
}
