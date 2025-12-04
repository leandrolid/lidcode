import { Fragment, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStorage } from "@/hooks/use-storage";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import map from "/map.svg";
import { Trash } from "lucide-react";
import { createShortUrl } from "@/services/urls/create-short-url";
import { ConfirmDeleteDialog } from "@/components/dialogs/confirm-delete";

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
        const response = await createShortUrl(url);
        setShortenedUrls((prev) => [
          ...prev,
          { originalUrl: url, shortUrl: response.shortUrl },
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
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center px-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('${map}')`,
      }}
    >
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
                    className="flex flex-col md:grid md:grid-cols-[1fr_15rem_6.75rem] items-center gap-2"
                  >
                    <p className="truncate text-base text-center w-full">
                      {item.originalUrl}
                    </p>
                    <Button
                      variant="link"
                      asChild
                      className="text-blue-400 cursor-pointer text-base w-fit text-center mx-auto"
                    >
                      <a
                        href={item.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.shortUrl}
                      </a>
                    </Button>
                    <div className="flex gap-2 justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(item.shortUrl)}
                      >
                        Copy
                      </Button>
                      <ConfirmDeleteDialog
                        description="This action cannot be undone. This will permanently delete the short link from our servers."
                        onConfirm={() => {
                          setShortenedUrls((prev) =>
                            prev.filter((_, i) => i !== index)
                          );
                        }}
                      >
                        <Button variant="ghost" size="sm">
                          <Trash />
                        </Button>
                      </ConfirmDeleteDialog>
                    </div>
                  </div>
                  <Separator className="my-2" orientation="horizontal" />
                </Fragment>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
