import { ConfirmDeleteDialog } from "@/components/dialogs/confirm-delete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStorage } from "@/hooks/use-storage";
import { cn } from "@/lib/utils";
import {
  createShortUrl,
  type CreateShortUrlResponse,
} from "@/services/urls/create-short-url";
import "@lidcode/elements";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Copy,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Moon,
  Sun,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ButtonState = "idle" | "loading" | "success" | "error";

const buttonLabels: Record<ButtonState, string> = {
  idle: "Shorten link",
  loading: "Shortening...",
  success: "Link created",
  error: "Try again",
};

export function Home() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [url, setUrl] = useState("");
  const [buttonState, setButtonState] = useState<ButtonState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [shortenedUrls, setShortenedUrls] = useStorage<
    CreateShortUrlResponse[]
  >("urls", []);
  const [newlyAddedUrl, setNewlyAddedUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (buttonState !== "success" && buttonState !== "error") return;

    const timeout = window.setTimeout(() => {
      setButtonState("idle");
      setNewlyAddedUrl(null);
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [buttonState]);

  useEffect(() => {
    if (!copiedUrl) return;

    const timeout = window.setTimeout(() => setCopiedUrl(null), 2000);
    return () => window.clearTimeout(timeout);
  }, [copiedUrl]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (buttonState === "loading") return;

    setSubmitError(null);
    setButtonState("loading");
    const [response, error] = await createShortUrl(url.trim());

    if (error) {
      const message = "Couldn't shorten that link. Please try again.";
      setSubmitError(message);
      setButtonState("error");
      toast.error(message);
      return;
    }

    setShortenedUrls((previous) => [response, ...previous]);
    setNewlyAddedUrl(response.shortUrl);
    setUrl("");
    setButtonState("success");
    toast.success("Your short link is ready to share.");
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(text);
      toast.success("Link copied. Pass it on!");
    } catch {
      toast.error(
        "Couldn't copy the link. You can select and copy it manually.",
      );
    }
  };

  return (
    <div className="shortlid-app" id="top">
      <a className="skip-link" href="#shorten">
        Skip to URL shortener
      </a>

      <header className="site-header page-width">
        <a className="brand" href="#top" aria-label="Shortlid home">
          <span className="brand-mark" aria-hidden="true">
            <Link2 size={23} strokeWidth={2.5} />
          </span>
          shortlid<span className="brand-period">.</span>
        </a>

        <nav className="header-nav" aria-label="Main navigation">
          <a className="collection-nav" href="#your-links">
            Your links <ArrowDown size={14} aria-hidden="true" />
          </a>
          <span className="header-divider" aria-hidden="true" />
          <Button
            variant="ghost"
            size="icon"
            className="theme-toggle"
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </Button>
          <lidcode-github-link class="github-link" />
          <lidcode-badge class="header-tag" />
        </nav>
      </header>

      <main className="page-width">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow mono">
              <span className="eyebrow-dot" aria-hidden="true" />A little link
              goes a long way
            </p>
            <h1 id="hero-title">
              Less link.
              <br />
              <span>More impact.</span>
            </h1>
            <p className="hero-description">
              Big ideas don&apos;t need long URLs. Turn your link into something
              short, tidy, and ready to go places.
            </p>
            <div className="hero-details">
              <span>
                <Zap size={15} aria-hidden="true" />
                Free to use
              </span>
              <span className="detail-dot" aria-hidden="true" />
              <span>No account needed</span>
            </div>
          </div>

          <div className="link-art" aria-hidden="true">
            <div className="art-grid" />
            <span className="art-caption mono">
              Same destination. Less baggage.
            </span>
            <svg className="link-sculpture" viewBox="0 0 440 340" fill="none">
              <g transform="rotate(-36 220 170)">
                <rect
                  x="63"
                  y="90"
                  width="210"
                  height="112"
                  rx="56"
                  stroke="var(--link-ink)"
                  strokeWidth="32"
                />
                <rect
                  x="167"
                  y="140"
                  width="210"
                  height="112"
                  rx="56"
                  stroke="var(--primary)"
                  strokeWidth="32"
                />
                {/* Redraw this arc so the background link passes over the upper crossing. */}
                <path
                  d="M217 90a56 56 0 0 1 0 112"
                  stroke="var(--link-ink)"
                  strokeWidth="32"
                />
              </g>
              <path
                d="M356 58v26m-13-13h26M74 260v18m-9-9h18"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="385" cy="240" r="5" fill="var(--primary)" />
              <circle cx="60" cy="106" r="3" fill="var(--link-ink)" />
            </svg>
            <div className="art-original mono">
              <span>https://a-very-long-link.com/and-then-some</span>
            </div>
            <div className="art-short mono">
              <Link2 size={17} />
              <span>short.lidco.de/hello</span>
              <ArrowUpRight size={17} />
            </div>
            <span className="art-footnote mono">
              The short way there <ArrowDownRight size={16} />
            </span>
          </div>
        </section>

        <section
          className="shortener-panel"
          id="shorten"
          aria-labelledby="shortener-title"
        >
          <div className="panel-heading">
            <div className="section-title">
              <span className="section-index mono" aria-hidden="true">
                01
              </span>
              <h2 id="shortener-title">Let&apos;s make it short.</h2>
            </div>
            <span className="panel-note mono">Paste. Shorten. Share.</span>
          </div>

          <form onSubmit={handleSubmit} aria-busy={buttonState === "loading"}>
            <label className="field-label mono" htmlFor="original-url">
              Your long URL
            </label>
            <div className="shortener-fields">
              <div className="url-field">
                <Link2
                  size={21}
                  className="url-field-icon"
                  aria-hidden="true"
                />
                <Input
                  id="original-url"
                  name="originalUrl"
                  type="url"
                  placeholder="https://your-long-link.com/something-great"
                  required
                  autoComplete="url"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="url-input"
                  value={url}
                  disabled={buttonState === "loading"}
                  aria-describedby={
                    submitError
                      ? "shortener-error shortener-note"
                      : "shortener-note"
                  }
                  aria-invalid={Boolean(submitError)}
                  onChange={(event) => {
                    setUrl(event.target.value);
                    setSubmitError(null);
                  }}
                />
              </div>
              <Button
                type="submit"
                disabled={buttonState === "loading"}
                className="shorten-button"
                data-state={buttonState}
              >
                <span>{buttonLabels[buttonState]}</span>
                {buttonState === "idle" && <ArrowUpRight aria-hidden="true" />}
                {buttonState === "loading" && (
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                )}
                {buttonState === "success" && <Check aria-hidden="true" />}
                {buttonState === "error" && <X aria-hidden="true" />}
              </Button>
            </div>
            {submitError && (
              <p className="form-error" id="shortener-error" role="alert">
                {submitError}
              </p>
            )}
            <div className="shortener-notes" id="shortener-note">
              <span>
                <Clock3 size={14} aria-hidden="true" /> Links last for 30 days
              </span>
              <span>
                <LockKeyhole size={14} aria-hidden="true" /> History saved in
                this browser
              </span>
            </div>
          </form>
        </section>

        <section
          className="collection"
          id="your-links"
          aria-labelledby="collection-title"
        >
          <div className="collection-heading">
            <div>
              <div className="section-title">
                <span className="section-index mono" aria-hidden="true">
                  02
                </span>
                <h2 id="collection-title">Your links, all lined up.</h2>
                <span
                  className="collection-count mono"
                  aria-label={`${shortenedUrls.length} saved links`}
                >
                  {shortenedUrls.length.toString().padStart(2, "0")}
                </span>
              </div>
              <p className="collection-description">
                A small collection. Ready for your next big thing.
              </p>
            </div>
            <span className="collection-local mono">Only on this device</span>
          </div>

          {shortenedUrls.length === 0 ? (
            <div className="empty-collection">
              <div className="empty-icon" aria-hidden="true">
                <Link2 size={28} strokeWidth={1.7} />
              </div>
              <div className="empty-copy">
                <h3>A little empty. A lot of potential.</h3>
                <p>Your first short link will feel right at home here.</p>
              </div>
              <a
                className="empty-action"
                href="#original-url"
                aria-label="Create your first short link"
              >
                <ArrowUpRight size={22} aria-hidden="true" />
              </a>
            </div>
          ) : (
            <ul className="link-list" aria-label="Saved short links">
              {shortenedUrls.map((item, index) => {
                const isCopied = copiedUrl === item.shortUrl;
                return (
                  <li
                    key={`${item.shortUrl}-${index}`}
                    className={cn("link-row", {
                      "is-new": newlyAddedUrl === item.shortUrl,
                    })}
                  >
                    <span className="link-number mono" aria-hidden="true">
                      {(index + 1).toString().padStart(2, "0")}
                    </span>
                    <div className="link-details">
                      <a
                        className="short-link"
                        href={item.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>{item.shortUrl.replace(/^https?:\/\//, "")}</span>
                        <ArrowUpRight size={16} aria-hidden="true" />
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                      <p className="original-link" title={item.originalUrl}>
                        {item.originalUrl}
                      </p>
                    </div>
                    <div className="link-actions">
                      <Button
                        variant="outline"
                        className="copy-button"
                        data-copied={isCopied}
                        onClick={() => copyToClipboard(item.shortUrl)}
                        aria-label={`${isCopied ? "Copied" : "Copy"} ${item.shortUrl}`}
                      >
                        {isCopied ? (
                          <Check aria-hidden="true" />
                        ) : (
                          <Copy aria-hidden="true" />
                        )}
                        <span>{isCopied ? "Copied" : "Copy link"}</span>
                      </Button>
                      <ConfirmDeleteDialog
                        description="This removes the link from this browser's history. The short URL will still work until it expires."
                        onConfirm={() => {
                          setShortenedUrls((previous) =>
                            previous.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          );
                          toast.success("Link removed from your collection.");
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="remove-button"
                          aria-label={`Remove ${item.shortUrl} from history`}
                          title="Remove from history"
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </ConfirmDeleteDialog>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="collection-footer mono">
            <span>
              <span className="tiny-dot" aria-hidden="true" /> Small by design.
              Shareable by nature.
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </div>
        </section>
      </main>

      <footer className="site-footer page-width">
        <p>
          A shorter way to get there<span>.</span>
        </p>
        <lidcode-made-by />
      </footer>
    </div>
  );
}
