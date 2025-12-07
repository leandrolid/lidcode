import { Fragment, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStorage } from "@/hooks/use-storage";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import map from "/map.svg";
import { LoaderCircleIcon, SendIcon, Trash, Check, X } from "lucide-react";
import {
  createShortUrl,
  type CreateShortUrlResponse,
} from "@/services/urls/create-short-url";
import { ConfirmDeleteDialog } from "@/components/dialogs/confirm-delete";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonState = "idle" | "loading" | "success" | "error";

export function Home() {
  const [url, setUrl] = useState("");
  const [buttonState, setButtonState] = useState<ButtonState>("idle");
  const [shortenedUrls, setShortenedUrls] = useStorage<
    CreateShortUrlResponse[]
  >("urls", []);
  const [newlyAddedIndex, setNewlyAddedIndex] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (buttonState === "loading") return;
    if (!url) {
      toast.error("Please enter a valid URL");
      return;
    }
    setButtonState("loading");
    const [response, error] = await createShortUrl(url);
    if (error) {
      console.error(error);
      toast.error("Failed to shorten URL. Please try again.");
      setButtonState("error");
      setTimeout(() => setButtonState("idle"), 2000);
      return;
    }
    setShortenedUrls((prev) => {
      const newList = [response, ...prev];
      setNewlyAddedIndex(0);
      setTimeout(() => setNewlyAddedIndex(null), 2000);
      return newList;
    });
    setUrl("");
    setButtonState("success");
    setTimeout(() => setButtonState("idle"), 2000);
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
                disabled={buttonState === "loading"}
                className={cn({
                  "px-4 py-2 shrink-0": true,
                  "bg-green-600 hover:bg-green-700 text-white":
                    buttonState === "success",
                  "bg-red-600 hover:bg-red-700 text-white":
                    buttonState === "error",
                })}
              >
                <AnimatedIcon buttonState={buttonState} />
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
            <>
              <p className="text-center text-gray-500">
                URLs created without an account will expire after 30 days
              </p>
              <div className="space-y-4">
                {shortenedUrls.map((item, index) => {
                  const isNewlyAdded = newlyAddedIndex === index;
                  return (
                    <Fragment key={index}>
                      <motion.div
                        key={`${item.shortUrl}-${index}`}
                        initial={
                          isNewlyAdded
                            ? { opacity: 0, y: -20, scale: 0.95 }
                            : false
                        }
                        animate={
                          isNewlyAdded ? { opacity: 1, y: 0, scale: 1 } : {}
                        }
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={cn({
                          "ring-green-500 ring-opacity-50 rounded-lg p-2 bg-green-50 dark:bg-green-900/20":
                            isNewlyAdded,
                        })}
                      >
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
                      </motion.div>
                      <Separator className="my-2" orientation="horizontal" />
                    </Fragment>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

const AnimatedIcon = ({ buttonState }: { buttonState: ButtonState }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={buttonState}
        initial={{ opacity: 0, scale: 0.8, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.8, rotate: 180 }}
        transition={{ duration: 0.3 }}
      >
        {buttonState === "idle" && <SendIcon className="h-4 w-4" />}
        {buttonState === "loading" && (
          <LoaderCircleIcon className="h-4 w-4 animate-spin text-gray-100" />
        )}
        {buttonState === "success" && <Check className="h-4 w-4 text-white" />}
        {buttonState === "error" && <X className="h-4 w-4 text-white" />}
      </motion.div>
    </AnimatePresence>
  );
};
