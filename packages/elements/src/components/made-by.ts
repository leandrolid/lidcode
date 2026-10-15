import { escapeAttr, escapeHtml } from '../utils.js'
import { SafeHTMLElement } from './base.js'

const DEFAULT_HREF = 'https://lidco.de'
const DEFAULT_AUTHOR = 'lidcode'
const DEFAULT_PREFIX = 'Made by'
const DEFAULT_TARGET = '_blank'
const DEFAULT_REL = 'noopener noreferrer'
const DEFAULT_SR_TEXT = '(opens in a new tab)'

export class LidcodeMadeBy extends SafeHTMLElement {
  static observedAttributes = ['href', 'author', 'prefix', 'target', 'rel', 'sr-text', 'variant']

  connectedCallback(): void {
    this.render()
  }

  attributeChangedCallback(): void {
    if (this.shadowRoot) {
      this.render()
    }
  }

  get href(): string {
    return this.getAttribute('href') ?? DEFAULT_HREF
  }

  set href(value: string) {
    this.setAttribute('href', value)
  }

  get author(): string {
    return this.getAttribute('author') ?? DEFAULT_AUTHOR
  }

  set author(value: string) {
    this.setAttribute('author', value)
  }

  get prefix(): string {
    return this.getAttribute('prefix') ?? DEFAULT_PREFIX
  }

  set prefix(value: string) {
    this.setAttribute('prefix', value)
  }

  get target(): string {
    return this.getAttribute('target') ?? DEFAULT_TARGET
  }

  set target(value: string) {
    this.setAttribute('target', value)
  }

  get rel(): string {
    return this.getAttribute('rel') ?? DEFAULT_REL
  }

  set rel(value: string) {
    this.setAttribute('rel', value)
  }

  get srText(): string {
    return this.getAttribute('sr-text') ?? DEFAULT_SR_TEXT
  }

  set srText(value: string) {
    this.setAttribute('sr-text', value)
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

  private render(): void {
    const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' })
    const href = this.href
    const author = this.author
    const prefix = this.prefix
    const target = this.target
    const rel = this.rel
    const srText = this.srText

    shadow.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          vertical-align: middle;
          box-sizing: border-box;
          border: none !important;
          padding: 0 !important;
        }
        :host([hidden]) {
          display: none !important;
        }
        a {
          display: inline-flex;
          align-items: center;
          gap: var(--lidcode-made-by-gap, 4px);
          color: var(--lidcode-made-by-color, var(--lidcode-muted, var(--muted-foreground, var(--muted, inherit))));
          font-family: var(--lidcode-font, inherit);
          font-size: var(--lidcode-made-by-font-size, 11px);
          font-weight: var(--lidcode-made-by-font-weight, inherit);
          text-decoration: none;
          transition: color 0.15s ease;
          line-height: 1.4;
          white-space: nowrap;
          box-sizing: border-box;
        }
        :host(:hover) a,
        a:hover {
          color: var(--lidcode-made-by-hover-color, var(--lidcode-primary, var(--lidcode-accent, var(--primary, var(--accent, #6366f1)))));
        }
        a:focus-visible {
          outline: 2px solid var(--lidcode-focus-color, var(--lidcode-primary, var(--lidcode-accent, var(--ring, var(--accent, #6366f1)))));
          outline-offset: 2px;
        }
        strong {
          color: var(--lidcode-made-by-strong-color, var(--lidcode-foreground, var(--foreground, var(--text, currentColor))));
          font-weight: var(--lidcode-made-by-strong-weight, 700);
        }
        svg {
          display: inline-block;
          vertical-align: middle;
          width: var(--lidcode-made-by-icon-size, 14px);
          height: var(--lidcode-made-by-icon-size, 14px);
          flex-shrink: 0;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        :host([variant="subtle"]) a {
          padding: 4px 8px;
          background: var(--lidcode-made-by-subtle-bg, var(--panel-raised, rgba(255, 255, 255, 0.06)));
          border-radius: 6px;
        }
      </style>
      <a
        part="link"
        class="made-by"
        href="${escapeAttr(href)}"
        target="${escapeAttr(target)}"
        rel="${escapeAttr(rel)}"
      >
        <span part="prefix">${escapeHtml(prefix)}</span> <strong part="author">${escapeHtml(author)}</strong>
        <svg
          part="icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M7 7h10v10" />
          <path d="M7 17 17 7" />
        </svg>
        <span class="sr-only"> ${escapeHtml(srText)}</span>
      </a>
    `
  }
}
