import { escapeHtml } from '../utils.js'
import { SafeHTMLElement } from './base.js'

const DEFAULT_TEXT = 'A lidcode tool'

export class LidcodeBadge extends SafeHTMLElement {
  static observedAttributes = ['text', 'variant', 'size']

  connectedCallback(): void {
    this.render()
  }

  attributeChangedCallback(): void {
    if (this.shadowRoot) {
      this.render()
    }
  }

  get text(): string {
    return this.getAttribute('text') ?? DEFAULT_TEXT
  }

  set text(value: string) {
    this.setAttribute('text', value)
  }

  get variant(): string | null {
    return this.getAttribute('variant')
  }

  set variant(value: string | null) {
    if (value === null) {
      this.removeAttribute('variant')
    } else {
      this.setAttribute('variant', value)
    }
  }

  get size(): string | null {
    return this.getAttribute('size')
  }

  set size(value: string | null) {
    if (value === null) {
      this.removeAttribute('size')
    } else {
      this.setAttribute('size', value)
    }
  }

  private render(): void {
    const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' })
    const text = this.text

    shadow.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          vertical-align: middle;
          border: none !important;
          padding: 0 !important;
          background: transparent !important;
          box-sizing: border-box;
        }
        :host([hidden]) {
          display: none !important;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          padding: var(--lidcode-badge-padding, 9px 12px);
          border: var(--lidcode-badge-border, 1px solid var(--lidcode-border, var(--border, var(--line, rgba(255, 255, 255, 0.15)))));
          border-radius: var(--lidcode-badge-radius, 5px);
          color: var(--lidcode-badge-color, var(--lidcode-muted, var(--muted-foreground, var(--muted, inherit))));
          background: var(--lidcode-badge-bg, transparent);
          font-family: var(--lidcode-mono, var(--mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace));
          font-size: var(--lidcode-badge-font-size, 10px);
          font-weight: var(--lidcode-badge-font-weight, 400);
          letter-spacing: var(--lidcode-badge-letter-spacing, 0.065em);
          text-transform: var(--lidcode-badge-text-transform, uppercase);
          line-height: 1;
          white-space: nowrap;
          transition: border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease;
        }
        :host([size="sm"]) .badge {
          padding: var(--lidcode-badge-padding, 5px 8px);
          font-size: var(--lidcode-badge-font-size, 9px);
        }
        :host([size="lg"]) .badge {
          padding: var(--lidcode-badge-padding, 11px 16px);
          font-size: var(--lidcode-badge-font-size, 11px);
        }
        :host([variant="pill"]) .badge {
          border-radius: var(--lidcode-badge-radius, 9999px);
        }
        :host([variant="subtle"]) .badge {
          background: var(--lidcode-badge-subtle-bg, var(--panel-raised, rgba(255, 255, 255, 0.06)));
          border-color: transparent;
        }
        :host([variant="outline"]) .badge {
          background: transparent;
        }
        :host([variant="solid"]) .badge {
          background: var(--lidcode-badge-solid-bg, var(--lidcode-primary, var(--lidcode-accent, var(--primary, var(--accent, #6366f1)))));
          color: var(--lidcode-badge-solid-color, var(--primary-foreground, var(--background, #ffffff)));
          border-color: transparent;
        }
      </style>
      <span part="badge" class="badge"><slot>${escapeHtml(text)}</slot></span>
    `
  }
}
