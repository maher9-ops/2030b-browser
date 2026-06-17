//! # mcp-host
//!
//! The browser as a Model Context Protocol (MCP) host. It registers a set of
//! tools that an AI agent may invoke (click, type, scroll, navigate, read).
//! Each tool invocation is checked against the per-site agent policy before it
//! is allowed (build brief §9.2). See https://modelcontextprotocol.io.

use std::collections::HashMap;

/// A tool the browser exposes to agents over MCP.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Tool {
    pub name: String,
    pub description: String,
    /// The agent permission this tool requires (e.g. "agent.actuate").
    pub required_permission: String,
}

/// A request from an agent to invoke a tool on a given site.
#[derive(Debug, Clone)]
pub struct ToolCall {
    pub tool: String,
    pub site: String,
    pub arguments: HashMap<String, String>,
}

/// Per-site agent policy: which permissions are granted on which sites.
#[derive(Debug, Default)]
pub struct AgentPolicy {
    /// site -> granted permissions.
    grants: HashMap<String, Vec<String>>,
}

impl AgentPolicy {
    pub fn new() -> Self {
        AgentPolicy {
            grants: HashMap::new(),
        }
    }

    pub fn grant(&mut self, site: &str, permission: &str) {
        self.grants
            .entry(site.to_string())
            .or_default()
            .push(permission.to_string());
    }

    fn allows(&self, site: &str, permission: &str) -> bool {
        self.grants
            .get(site)
            .is_some_and(|ps| ps.iter().any(|p| p == permission))
    }
}

/// The MCP host: a tool registry plus the agent policy gate.
#[derive(Debug, Default)]
pub struct McpHost {
    tools: HashMap<String, Tool>,
    policy: AgentPolicy,
}

/// Outcome of attempting a tool call.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CallOutcome {
    /// The call is permitted and should be executed.
    Allowed,
    /// The named tool is not registered.
    UnknownTool,
    /// The site does not grant the required permission.
    Denied { required: String },
}

impl McpHost {
    pub fn new(policy: AgentPolicy) -> Self {
        McpHost {
            tools: HashMap::new(),
            policy,
        }
    }

    /// Register the standard browser actuation toolset.
    pub fn with_standard_tools(policy: AgentPolicy) -> Self {
        let mut host = McpHost::new(policy);
        for (name, perm) in [
            ("navigate", "agent.actuate"),
            ("click", "agent.actuate"),
            ("type", "agent.actuate"),
            ("scroll", "agent.actuate"),
            ("read_page", "agent.observe"),
            ("fetch", "agent.network"),
        ] {
            host.register(Tool {
                name: name.to_string(),
                description: format!("Browser tool: {name}"),
                required_permission: perm.to_string(),
            });
        }
        host
    }

    pub fn register(&mut self, tool: Tool) {
        self.tools.insert(tool.name.clone(), tool);
    }

    /// Decide whether a tool call is permitted, enforcing the per-site policy.
    pub fn authorize(&self, call: &ToolCall) -> CallOutcome {
        let Some(tool) = self.tools.get(&call.tool) else {
            return CallOutcome::UnknownTool;
        };
        if self.policy.allows(&call.site, &tool.required_permission) {
            CallOutcome::Allowed
        } else {
            CallOutcome::Denied {
                required: tool.required_permission.clone(),
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn call(tool: &str, site: &str) -> ToolCall {
        ToolCall {
            tool: tool.into(),
            site: site.into(),
            arguments: HashMap::new(),
        }
    }

    #[test]
    fn denies_actuation_without_grant() {
        let host = McpHost::with_standard_tools(AgentPolicy::new());
        assert_eq!(
            host.authorize(&call("click", "https://x.example")),
            CallOutcome::Denied {
                required: "agent.actuate".into()
            }
        );
    }

    #[test]
    fn allows_when_site_granted() {
        let mut policy = AgentPolicy::new();
        policy.grant("https://x.example", "agent.actuate");
        let host = McpHost::with_standard_tools(policy);
        assert_eq!(
            host.authorize(&call("click", "https://x.example")),
            CallOutcome::Allowed
        );
    }

    #[test]
    fn unknown_tool_reported() {
        let host = McpHost::with_standard_tools(AgentPolicy::new());
        assert_eq!(
            host.authorize(&call("teleport", "https://x.example")),
            CallOutcome::UnknownTool
        );
    }
}
