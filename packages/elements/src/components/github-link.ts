import { escapeAttr } from '../utils.js'
import { SafeHTMLElement } from './base.js'

const DEFAULT_HREF = 'https://github.com/leandrolid/lidcode'
const DEFAULT_TITLE = 'View on GitHub'
const DEFAULT_ARIA_LABEL = 'View Lidcode on GitHub (opens in a new tab)'
const DEFAULT_TARGET = '_blank'
const DEFAULT_REL = 'noopener noreferrer'
const DEFAULT_SIZE = 19

export class LidcodeGithubLink extends SafeHTMLElement {
  static observedAttributes = ['href', 'target', 'rel', 'title', 'aria-label', 'size', 'variant', 'box-size']

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

  get title(): string {
    return this.getAttribute('title') ?? DEFAULT_TITLE
  }

  set title(value: string) {
    this.setAttribute('title', value)
  }

  get ariaLabel(): string {
    return this.getAttribute('aria-label') ?? DEFAULT_ARIA_LABEL
  }

  set ariaLabel(value: string) {
    this.setAttribute('aria-label', value)
  }

  get size(): number {
    const raw = this.getAttribute('size')
    if (!raw) return DEFAULT_SIZE
    const parsed = Number.parseInt(raw, 10)
    return Number.isNaN(parsed) ? DEFAULT_SIZE : parsed
  }

  set size(value: number) {
    this.setAttribute('size', String(value))
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

  get boxSize(): string | null {
    return this.getAttribute('box-size')
  }

  set boxSize(value: string | null) {
    if (value === null) {
      this.removeAttribute('box-size')
    } else {
      this.setAttribute('box-size', value)
    }
  }

  private render(): void {
    const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' })
    const href = this.href
    const target = this.target
    const rel = this.rel
    const title = this.title
    const ariaLabel = this.ariaLabel
    const size = this.size

    shadow.innerHTML = `
      <style>
        :host {
          display: inline-grid;
          place-items: center;
          width: var(--lidcode-github-size, 40px);
          height: var(--lidcode-github-size, 40px);
          border-radius: var(--lidcode-github-radius, 8px);
          vertical-align: middle;
          box-sizing: border-box;
          border: none !important;
          padding: 0 !important;
        }
        :host([hidden]) {
          display: none !important;
        }
        :host([variant="ghost"]),
        :host([box-size="auto"]),
        :host([box-size="none"]) {
          width: auto;
          height: auto;
        }
        :host([box-size="sm"]) {
          width: 32px;
          height: 32px;
        }
        :host([box-size="lg"]) {
          width: 48px;
          height: 48px;
        }
        a {
          display: grid;
          place-items: center;
          width: 100%;
          height: 100%;
          border-radius: inherit;
          color: var(--lidcode-github-color, var(--lidcode-muted, var(--muted-foreground, var(--muted, inherit))));
          background: var(--lidcode-github-bg, transparent);
          text-decoration: none;
          transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
          box-sizing: border-box;
        }
        :host(:hover) a,
        a:hover {
          color: var(--lidcode-github-hover-color, var(--lidcode-primary, var(--lidcode-accent, var(--primary, var(--accent, #6366f1)))));
          background: var(--lidcode-github-hover-bg, transparent);
        }
        a:focus-visible {
          outline: 2px solid var(--lidcode-focus-color, var(--lidcode-primary, var(--lidcode-accent, var(--ring, var(--accent, #6366f1)))));
          outline-offset: 2px;
        }
        :host([variant="outline"]) a {
          border: 1px solid var(--lidcode-border, var(--border, var(--line, rgba(255, 255, 255, 0.15))));
        }
        :host([variant="outline"]:hover) a {
          border-color: var(--lidcode-github-hover-color, var(--lidcode-primary, var(--lidcode-accent, var(--primary, var(--accent, #6366f1)))));
        }
        svg {
          display: block;
          width: var(--lidcode-github-icon-size, ${size}px);
          height: var(--lidcode-github-icon-size, ${size}px);
        }
      </style>
      <a
        part="link"
        class="github-link"
        href="${escapeAttr(href)}"
        target="${escapeAttr(target)}"
        rel="${escapeAttr(rel)}"
        title="${escapeAttr(title)}"
        aria-label="${escapeAttr(ariaLabel)}"
      >
        <svg
          part="icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
          <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
      </a>
    `
  }
}
