import { escapeAttr, escapeHtml } from '../utils.js'
import { SafeHTMLElement } from './base.js'

const DEFAULT_HREF = 'https://lidco.de'
const DEFAULT_AUTHOR = 'lidcode'
const DEFAULT_PREFIX = 'Made by'
const DEFAULT_TARGET = '_blank'
const DEFAULT_REL = 'noopener noreferrer'
const DEFAULT_SR_TEXT = '(opens in a new tab)'

export class LidcodeMadeBy extends SafeHTMLElement {
  static observedAttributes = ['href', 'author', 'prefix', 'target', 'rel', 'sr-text']

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
          display: inline-block;
          vertical-align: middle;
        }
        .made-by {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--lidcode-made-by-color, var(--muted-foreground, #a1a1aa));
          font-family: var(--lidcode-font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);
          font-size: var(--lidcode-made-by-font-size, 11px);
          text-decoration: none;
          transition: color 0.15s ease;
          line-height: 1.4;
          box-sizing: border-box;
        }
        .made-by:hover {
          color: var(--lidcode-made-by-hover-color, var(--primary, #6366f1));
        }
        .made-by:focus-visible {
          outline: 2px solid var(--lidcode-focus-color, var(--primary, #6366f1));
          outline-offset: 2px;
        }
        strong {
          color: var(--lidcode-made-by-strong-color, var(--foreground, #ffffff));
          font-weight: 700;
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
      </style>
      <a
        class="made-by"
        href="${escapeAttr(href)}"
        target="${escapeAttr(target)}"
        rel="${escapeAttr(rel)}"
      >
        ${escapeHtml(prefix)} <strong>${escapeHtml(author)}</strong>
        <svg
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
