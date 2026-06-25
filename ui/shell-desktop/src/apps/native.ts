/**
 * Built-in native apps (UI/UX manifesto §10): Notes, Tasks, Password Manager,
 * AI Chat — first-class, not extensions. Pure models with no DOM/storage
 * coupling; persistence is layered on top via the IndexedDB store.
 */

export interface Note {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
}

export interface Task {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

/** A password manager entry. Secret material is encrypted by the Rust backend;
 *  this model only holds metadata + an opaque ciphertext handle. */
export interface VaultEntry {
  id: string;
  origin: string;
  username: string;
  /** Opaque handle to ciphertext stored/encrypted by the Rust keychain. */
  secretRef: string;
  updatedAt: number;
}

export class NotesApp {
  private notes = new Map<string, Note>();

  upsert(note: Note): void {
    this.notes.set(note.id, { ...note, updatedAt: note.updatedAt });
  }
  remove(id: string): void {
    this.notes.delete(id);
  }
  list(): Note[] {
    return [...this.notes.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  }
  get count(): number {
    return this.notes.size;
  }
}

export class TasksApp {
  private tasks = new Map<string, Task>();

  add(task: Task): void {
    this.tasks.set(task.id, task);
  }
  toggle(id: string): void {
    const t = this.tasks.get(id);
    if (t) t.done = !t.done;
  }
  remove(id: string): void {
    this.tasks.delete(id);
  }
  list(): Task[] {
    return [...this.tasks.values()].sort((a, b) => a.createdAt - b.createdAt);
  }
  get openCount(): number {
    return [...this.tasks.values()].filter((t) => !t.done).length;
  }
}

export class PasswordVault {
  private entries = new Map<string, VaultEntry>();

  put(entry: VaultEntry): void {
    this.entries.set(entry.id, entry);
  }
  forOrigin(origin: string): VaultEntry[] {
    return [...this.entries.values()].filter((e) => e.origin === origin);
  }
  remove(id: string): void {
    this.entries.delete(id);
  }
  get count(): number {
    return this.entries.size;
  }
}
