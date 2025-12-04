import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
      const response = await fetch("http://localhost:3333/v1/urls", {
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
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4">
      <div className="space-y-6 w-full max-w-3xl p-6">
        <h2 className="text-2xl font-bold text-center">Shorten Your URL</h2>
        <h3 className="text-center text-gray-400">
          Enter a URL below to generate a shortened link.
        </h3>

        <Card className="w-full p-0">
          <CardContent className="p-8">
            {!shortenedUrl ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter your URL here..."
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2"
                >
                  {isLoading ? "Shortening..." : "Shorten"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-medium">Your shortened URL:</h2>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={shortenedUrl.shortUrl}
                    readOnly
                    className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    onClick={() => copyToClipboard(shortenedUrl.shortUrl)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-sm">
                  Original:{" "}
                  <span className="font-medium">
                    {shortenedUrl.originalUrl}
                  </span>
                </p>
                <Button
                  onClick={resetForm}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Shorten Another URL
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
