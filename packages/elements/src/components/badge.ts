import { escapeHtml } from '../utils.js'
import { SafeHTMLElement } from './base.js'

const DEFAULT_TEXT = 'A lidcode tool'

export class LidcodeBadge extends SafeHTMLElement {
  static observedAttributes = ['text']

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

  private render(): void {
    const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' })
    const text = this.text

    shadow.innerHTML = `
      <style>
        :host {
          display: inline-block;
          vertical-align: middle;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: var(--lidcode-badge-padding, 9px 12px);
          border: var(--lidcode-badge-border, 1px solid var(--border, rgba(255, 255, 255, 0.1)));
          border-radius: var(--lidcode-badge-radius, 5px);
          color: var(--lidcode-badge-color, var(--muted-foreground, #a1a1aa));
          background: var(--lidcode-badge-bg, transparent);
          font-family: var(--lidcode-font-mono, var(--mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace));
          font-size: var(--lidcode-badge-font-size, 10px);
          font-weight: 400;
          letter-spacing: 0.065em;
          text-transform: uppercase;
          line-height: 1;
          white-space: nowrap;
          box-sizing: border-box;
        }
      </style>
      <span class="badge"><slot>${escapeHtml(text)}</slot></span>
    `
  }
}
