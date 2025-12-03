import { useState } from "react";
import "./app.css";

interface ShortenedUrl {
  originalUrl: string;
  shortUrl: string;
}

export function App() {
  const [url, setUrl] = useState("");
  const [shortenedUrl, setShortenedUrl] = useState<ShortenedUrl | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url) {
      setError("Please enter a valid URL");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Replace with your actual API endpoint
      const response = await fetch("https://lidco.de/urls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ originalUrl: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to shorten URL");
      }

      const data = await response.json();
      setShortenedUrl({
        originalUrl: url,
        shortUrl: data.shortUrl,
      });
      setUrl("");
    } catch (err) {
      setError("Failed to shorten URL. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const resetForm = () => {
    setShortenedUrl(null);
    setError("");
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="title">ShortLid</h1>
          <p className="subtitle">Shorten your URLs quickly and easily</p>
        </header>

        <main className="main">
          {!shortenedUrl ? (
            <form onSubmit={handleSubmit} className="form">
              <div className="input-group">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter your URL here..."
                  className="url-input"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="shorten-button"
                >
                  {isLoading ? "Shortening..." : "Shorten"}
                </button>
              </div>
              {error && <p className="error">{error}</p>}
            </form>
          ) : (
            <div className="result">
              <h2 className="result-title">Your shortened URL:</h2>
              <div className="url-result">
                <input
                  type="text"
                  value={shortenedUrl.shortUrl}
                  readOnly
                  className="short-url-input"
                />
                <button
                  onClick={() => copyToClipboard(shortenedUrl.shortUrl)}
                  className="copy-button"
                >
                  Copy
                </button>
              </div>
              <p className="original-url">
                Original: <span>{shortenedUrl.originalUrl}</span>
              </p>
              <button onClick={resetForm} className="new-url-button">
                Shorten Another URL
              </button>
            </div>
          )}
        </main>

        <footer className="footer">
          <p>Made with ❤️ for quick URL shortening</p>
        </footer>
      </div>
    </div>
  );
}
