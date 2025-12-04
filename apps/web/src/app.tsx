import { Fragment, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStorage } from "@/hooks/use-storage";
import { toast } from "sonner";

interface ShortenedUrl {
  originalUrl: string;
  shortUrl: string;
}

export function App() {
  const [url, setUrl] = useState("");
  const [shortenedUrls, setShortenedUrls] = useStorage<ShortenedUrl[]>(
    "urls",
    []
  );
  const [isLoading, setLoadingTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingTransition(async () => {
      if (!url) {
        toast.error("Please enter a valid URL");
        return;
      }

      try {
        // Replace with your actual API endpoint
        const response = await fetch("https://lidco.de/v1/urls", {
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
        setShortenedUrls((prev) => [
          ...prev,
          {
            originalUrl: url,
            shortUrl: data.shortUrl,
          },
        ]);
        setUrl("");
      } catch (error) {
        console.error(error);
        toast.error("Failed to shorten URL. Please try again.");
      }
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4">
      <div className="space-y-6 w-full max-w-3xl p-6">
        <h2 className="text-2xl font-bold text-center">Shorten Your URL</h2>
        <h3 className="text-center text-gray-400">
          Enter a URL below to generate a shortened link.
        </h3>

        <Card className="w-full p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="w-full flex gap-2">
              <Input
                type="url"
                placeholder="Enter your URL here..."
                required
                className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 shrink-0"
              >
                {isLoading ? "Shortening..." : "Shorten"}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="w-full p-8">
          {shortenedUrls.length === 0 ? (
            <p className="text-center text-gray-500">
              No URLs shortened yet. Start by entering a URL above.
            </p>
          ) : (
            <div className="space-y-4">
              {shortenedUrls.map((item, index) => (
                <Fragment key={index}>
                  <div
                    key={index}
                    className="flex flex-col md:grid md:grid-cols-[1fr_15rem_4rem] md:justify-between gap-2"
                  >
                    <p className="truncate text-base text-center">
                      {item.originalUrl}
                    </p>
                    <Button
                      variant="link"
                      asChild
                      className="text-blue-400 cursor-pointer text-base"
                    >
                      <a
                        href={item.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.shortUrl}
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(item.shortUrl)}
                    >
                      Copy
                    </Button>
                  </div>
                </Fragment>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
