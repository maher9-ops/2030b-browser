//! # agent-runtime
//!
//! Supervised browser-as-agent runtime (forward feature §9.2). It drives the
//! [`mcp_host`] tools, journals every action for reversibility/audit, applies
//! [`redaction`] before any data leaves the device, and requires human
//! supervision via an approval gate.

pub mod did;
pub mod journal;

use journal::{ActionJournal, JournalEntry};
use mcp_host::{CallOutcome, McpHost, ToolCall};

/// Whether a human has approved the agent to proceed with the next step.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Supervision {
    /// Each action requires explicit approval.
    StepByStep,
    /// The user pre-approved a bounded run; actions still journaled.
    Supervised,
}

/// The result of attempting one agent step.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StepResult {
    Executed,
    BlockedByPolicy { required: String },
    UnknownTool,
    AwaitingApproval,
}

/// The agent runtime ties together the MCP host, the journal, and supervision.
pub struct AgentRuntime {
    host: McpHost,
    journal: ActionJournal,
    supervision: Supervision,
}

impl AgentRuntime {
    pub fn new(host: McpHost, supervision: Supervision) -> Self {
        AgentRuntime {
            host,
            journal: ActionJournal::new(),
            supervision,
        }
    }

    /// Attempt one agent step. `approved` indicates the human approved this
    /// specific action (only consulted in StepByStep mode).
    pub fn step(&mut self, call: &ToolCall, approved: bool) -> StepResult {
        if self.supervision == Supervision::StepByStep && !approved {
            return StepResult::AwaitingApproval;
        }
        match self.host.authorize(call) {
            CallOutcome::Allowed => {
                self.journal
                    .record(JournalEntry::new(&call.tool, &call.site));
                StepResult::Executed
            }
            CallOutcome::Denied { required } => StepResult::BlockedByPolicy { required },
            CallOutcome::UnknownTool => StepResult::UnknownTool,
        }
    }

    /// The number of actions performed so far (for audit / reversibility).
    pub fn action_count(&self) -> usize {
        self.journal.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use mcp_host::AgentPolicy;
    use std::collections::HashMap;

    fn call(tool: &str, site: &str) -> ToolCall {
        ToolCall {
            tool: tool.into(),
            site: site.into(),
            arguments: HashMap::new(),
        }
    }

    #[test]
    fn step_by_step_requires_approval() {
        let mut policy = AgentPolicy::new();
        policy.grant("https://x.example", "agent.actuate");
        let host = McpHost::with_standard_tools(policy);
        let mut rt = AgentRuntime::new(host, Supervision::StepByStep);
        assert_eq!(
            rt.step(&call("click", "https://x.example"), false),
            StepResult::AwaitingApproval
        );
        assert_eq!(
            rt.step(&call("click", "https://x.example"), true),
            StepResult::Executed
        );
        assert_eq!(rt.action_count(), 1);
    }

    #[test]
    fn policy_denial_is_honored() {
        let host = McpHost::with_standard_tools(AgentPolicy::new());
        let mut rt = AgentRuntime::new(host, Supervision::Supervised);
        assert_eq!(
            rt.step(&call("type", "https://x.example"), true),
            StepResult::BlockedByPolicy {
                required: "agent.actuate".into()
            }
        );
        assert_eq!(rt.action_count(), 0);
    }
}
