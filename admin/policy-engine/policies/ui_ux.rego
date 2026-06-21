# UI/UX policy (admin domain 8).
package b2030b.ui_ux

import rego.v1

default force_vertical_tabs := false

force_vertical_tabs if {
	some l in input.layers
	l.layer in {"enterprise", "local_admin"}
	l.uiUx.forceVerticalTabs == true
}

locked_theme := t if {
	some l in input.layers
	l.layer == "enterprise"
	t := l.uiUx.lockTheme
}

decision := {"force_vertical_tabs": force_vertical_tabs, "locked_theme": locked_theme}
