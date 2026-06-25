/**
 * First-run setup wizard model (deliverable: "provide an installation UI with
 * wizard form"). This is the in-app onboarding wizard shown on first launch;
 * the *installer* (NSIS/MSI) also reuses these choices via a config file the
 * Rust backend writes. Pure state machine -> testable + renderer-agnostic.
 */

import type { ThemeMode } from './theme.js';
import type { LayoutPreset } from './layouts.js';

export type WizardStepId = 'welcome' | 'profile' | 'appearance' | 'privacy' | 'apps' | 'done';

export const WIZARD_STEPS: readonly WizardStepId[] = [
  'welcome',
  'profile',
  'appearance',
  'privacy',
  'apps',
  'done',
];

export interface WizardConfig {
  displayName: string;
  defaultSpace: string;
  theme: ThemeMode;
  autoByTime: boolean;
  layout: LayoutPreset;
  /** Default-deny posture toggles (all privacy-forward by default). */
  blockTrackers: boolean;
  blockThirdPartyCookies: boolean;
  httpsOnly: boolean;
  /** Built-in apps to enable on first run. */
  enableNotes: boolean;
  enableTasks: boolean;
  enablePasswords: boolean;
  enableCopilot: boolean;
}

export const DEFAULT_WIZARD_CONFIG: WizardConfig = {
  displayName: '',
  defaultSpace: 'Personal',
  theme: 'system',
  autoByTime: false,
  layout: 'vertical',
  blockTrackers: true,
  blockThirdPartyCookies: true,
  httpsOnly: true,
  enableNotes: true,
  enableTasks: true,
  enablePasswords: true,
  enableCopilot: true,
};

export class SetupWizard {
  private index = 0;
  readonly config: WizardConfig;

  constructor(initial: Partial<WizardConfig> = {}) {
    this.config = { ...DEFAULT_WIZARD_CONFIG, ...initial };
  }

  get step(): WizardStepId {
    return WIZARD_STEPS[this.index]!;
  }
  get stepIndex(): number {
    return this.index;
  }
  get total(): number {
    return WIZARD_STEPS.length;
  }
  get isFirst(): boolean {
    return this.index === 0;
  }
  get isLast(): boolean {
    return this.index === WIZARD_STEPS.length - 1;
  }

  /** Whether the current step's required fields are satisfied. */
  canAdvance(): boolean {
    if (this.step === 'profile') return this.config.defaultSpace.trim().length > 0;
    return true;
  }

  next(): WizardStepId {
    if (!this.isLast && this.canAdvance()) this.index++;
    return this.step;
  }
  back(): WizardStepId {
    if (!this.isFirst) this.index--;
    return this.step;
  }
  goto(step: WizardStepId): WizardStepId {
    const i = WIZARD_STEPS.indexOf(step);
    if (i >= 0) this.index = i;
    return this.step;
  }

  update(patch: Partial<WizardConfig>): void {
    Object.assign(this.config, patch);
  }

  /** Progress 0..1 for the step meter. */
  get progress(): number {
    return this.index / (WIZARD_STEPS.length - 1);
  }
}
