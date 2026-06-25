/**
 * Thin bridge to the Tauri host (Tauri v2). Because we ship a *custom titlebar*
 * (`decorations: false`), the window controls (minimize/maximize/close) and
 * dragging are wired through here. Everything degrades gracefully to no-ops in
 * a plain browser (`vite dev` / `vite preview`) so the same build runs both
 * places and unit tests never touch the IPC layer.
 */

interface TauriWindow {
  minimize(): Promise<void>;
  toggleMaximize(): Promise<void>;
  close(): Promise<void>;
  startDragging(): Promise<void>;
  setTheme(theme: 'light' | 'dark' | null): Promise<void>;
}

interface TauriGlobal {
  window?: { getCurrentWindow?: () => TauriWindow };
  core?: { invoke?: <T>(cmd: string, args?: unknown) => Promise<T> };
}

function tauri(): TauriGlobal | null {
  const g = globalThis as unknown as { __TAURI__?: TauriGlobal };
  return g.__TAURI__ ?? null;
}

export function isTauri(): boolean {
  return tauri() !== null;
}

function currentWindow(): TauriWindow | null {
  return tauri()?.window?.getCurrentWindow?.() ?? null;
}

export async function minimizeWindow(): Promise<void> {
  await currentWindow()?.minimize().catch(() => undefined);
}
export async function toggleMaximizeWindow(): Promise<void> {
  await currentWindow()?.toggleMaximize().catch(() => undefined);
}
export async function closeWindow(): Promise<void> {
  await currentWindow()?.close().catch(() => undefined);
}
export async function startDragging(): Promise<void> {
  await currentWindow()?.startDragging().catch(() => undefined);
}

/** Tell the native window which theme is active (affects shadows/blur on macOS/Windows). */
export async function setNativeTheme(theme: 'light' | 'dark'): Promise<void> {
  await currentWindow()?.setTheme(theme).catch(() => undefined);
}

/** Fetch build info from the Rust host (used in the About card). */
export async function buildInfo(): Promise<{ name: string; version: string; default_deny: boolean } | null> {
  const invoke = tauri()?.core?.invoke;
  if (!invoke) return null;
  try {
    return await invoke('build_info');
  } catch {
    return null;
  }
}
