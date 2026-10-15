import { escapeAttr, escapeHtml } from '../utils.js'

export type RenderGithubLinkOptions = {
  href?: string
  title?: string
  ariaLabel?: string
  target?: string
  rel?: string
  size?: number | string
  className?: string
  asElement?: boolean
}

export type RenderBadgeOptions = {
  text?: string
  className?: string
  asElement?: boolean
}

export type RenderMadeByOptions = {
  href?: string
  author?: string
  prefix?: string
  target?: string
  rel?: string
  srText?: string
  className?: string
  asElement?: boolean
}

export type RenderScriptTagOptions = {
  src?: string
  type?: string
  defer?: boolean
  async?: boolean
}

export const ELEMENTS_STATIC_CSS = `
.lidcode-github-link,
.github-link {
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  color: var(--muted-foreground, inherit);
  text-decoration: none;
  transition: color 0.15s ease;
  vertical-align: middle;
}
.lidcode-github-link:hover,
.github-link:hover {
  color: var(--primary, #6366f1);
}
.lidcode-badge,
.header-tag.mono {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 12px;
  border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  border-radius: 5px;
  color: var(--muted-foreground, #a1a1aa);
  font-family: var(--mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.065em;
  text-transform: uppercase;
  line-height: 1;
  white-space: nowrap;
  vertical-align: middle;
}
.lidcode-made-by,
.made-by-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--muted-foreground, #a1a1aa);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 11px;
  text-decoration: none;
  transition: color 0.15s ease;
  vertical-align: middle;
}
.lidcode-made-by:hover,
.made-by-link:hover {
  color: var(--primary, #6366f1);
}
.lidcode-made-by strong,
.made-by-link strong {
  color: var(--foreground, #ffffff);
  font-weight: 700;
}
.lidcode-made-by svg,
.made-by-link svg {
  display: inline-block;
  vertical-align: middle;
}
.lidcode-sr-only,
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
`.trim()

export function renderGithubLink(options: RenderGithubLinkOptions = {}): string {
  const href = options.href ?? 'https://github.com/leandrolid/lidcode'
  const title = options.title ?? 'View on GitHub'
  const ariaLabel = options.ariaLabel ?? 'View Lidcode on GitHub (opens in a new tab)'
  const target = options.target ?? '_blank'
  const rel = options.rel ?? 'noopener noreferrer'
  const size = options.size ?? 19

  if (options.asElement) {
    return `<lidcode-github-link href="${escapeAttr(href)}" target="${escapeAttr(target)}" rel="${escapeAttr(rel)}" title="${escapeAttr(title)}" aria-label="${escapeAttr(ariaLabel)}" size="${escapeAttr(String(size))}"></lidcode-github-link>`
  }

  const className = options.className ? `github-link ${options.className}` : 'github-link'

  return `<a class="${escapeAttr(className)}" href="${escapeAttr(href)}" target="${escapeAttr(target)}" rel="${escapeAttr(rel)}" title="${escapeAttr(title)}" aria-label="${escapeAttr(ariaLabel)}"><svg xmlns="http://www.w3.org/2000/svg" width="${escapeAttr(String(size))}" height="${escapeAttr(String(size))}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg></a>`
}

export function renderBadge(options: RenderBadgeOptions = {}): string {
  const text = options.text ?? 'A lidcode tool'

  if (options.asElement) {
    return `<lidcode-badge text="${escapeAttr(text)}"></lidcode-badge>`
  }

  const className = options.className ? `header-tag mono ${options.className}` : 'header-tag mono'

  return `<span class="${escapeAttr(className)}">${escapeHtml(text)}</span>`
}

export function renderMadeBy(options: RenderMadeByOptions = {}): string {
  const href = options.href ?? 'https://lidco.de'
  const author = options.author ?? 'lidcode'
  const prefix = options.prefix ?? 'Made by'
  const target = options.target ?? '_blank'
  const rel = options.rel ?? 'noopener noreferrer'
  const srText = options.srText ?? '(opens in a new tab)'

  if (options.asElement) {
    return `<lidcode-made-by href="${escapeAttr(href)}" author="${escapeAttr(author)}" prefix="${escapeAttr(prefix)}" target="${escapeAttr(target)}" rel="${escapeAttr(rel)}" sr-text="${escapeAttr(srText)}"></lidcode-made-by>`
  }

  const className = options.className ? `made-by-link ${options.className}` : 'made-by-link'

  return `<a class="${escapeAttr(className)}" href="${escapeAttr(href)}" target="${escapeAttr(target)}" rel="${escapeAttr(rel)}">${escapeHtml(prefix)} <strong>${escapeHtml(author)}</strong> <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg><span class="sr-only"> ${escapeHtml(srText)}</span></a>`
}

export function renderElementsScriptTag(options: RenderScriptTagOptions = {}): string {
  const src = options.src ?? '/bundle.js'
  const type = options.type ? ` type="${escapeAttr(options.type)}"` : ' type="module"'
  const defer = options.defer ? ' defer' : ''
  const asyncAttr = options.async ? ' async' : ''

  return `<script${type} src="${escapeAttr(src)}"${defer}${asyncAttr}></script>`
}
