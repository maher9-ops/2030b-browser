/**
 * Renderer entrypoint. Binds the pure Shell model to a minimal DOM chrome.
 * Kept intentionally small: all real logic lives in the testable models.
 */
import { Shell } from './index.js';
import { CommandPalette, type Command } from '@b2030b/command-palette';

/** Wire the palette commands to their handlers and render a status line. */
function mount(root: HTMLElement, shell: Shell): void {
  const palette = new CommandPalette();
  const handlers = new Map<string, () => void>();

  const add = (command: Command, run: () => void): void => {
    palette.register(command);
    handlers.set(command.id, run);
  };

  add({ id: 'new-tab', label: 'New Tab', shortcut: 'Ctrl+T' }, () =>
    shell.tabs.addTab({
      id: crypto.randomUUID(),
      title: 'New Tab',
      url: 'about:home',
      audible: false,
      muted: false,
      pinned: false,
    }),
  );
  add({ id: 'layout-vertical', label: 'Use Vertical Tabs' }, () => shell.setLayout('vertical'));
  add({ id: 'copilot', label: 'Open AI Copilot', shortcut: 'Ctrl+Shift+.' }, () =>
    shell.sidePanel.open({ kind: 'builtin', panel: 'copilot' }),
  );

  const render = (): void => {
    status.textContent = `Browser 2030B — ${shell.layoutConfig.preset} layout, ${shell.tabs.tabCount} tabs`;
  };

  const status = document.createElement('div');
  status.id = 'status';
  root.replaceChildren(status);
  render();

  // Ctrl/Cmd+K opens the palette; Enter runs the top match.
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const [top] = palette.search('');
      if (top) {
        handlers.get(top.id)?.();
        render();
      }
    }
  });
}

const root = document.getElementById('app');
if (root) {
  mount(root, new Shell());
}
