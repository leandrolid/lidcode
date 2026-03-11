import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/providers/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LoaderCircleIcon, Trash, ExternalLink } from "lucide-react";
import { listUrls, type UrlItem } from "@/services/urls/list-urls";
import { deleteUrl } from "@/services/urls/delete-url";
import { ConfirmDeleteDialog } from "@/components/dialogs/confirm-delete";
import map from "/map.svg";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";

export function DashboardPage() {
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUrls() {
      setIsLoading(true);
      const [data, error] = await listUrls();
      if (error) {
        toast.error("Failed to load URLs");
      } else if (data) {
        setUrls(data);
      }
      setIsLoading(false);
    }
    loadUrls();
  }, []);

  const handleDelete = async (id: number) => {
    const [, error] = await deleteUrl(id);
    if (error) {
      toast.error("Failed to delete URL");
      return;
    }
    toast.success("URL deleted successfully");
    setUrls((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <ProtectedRoute>
      <div
        className="w-full min-h-screen flex flex-col items-center justify-center px-4 bg-cover bg-center bg-no-repeat bg-fixed relative overflow-hidden"
        style={{ backgroundImage: `url('${map}')` }}
      >
        <div className="absolute inset-0 bg-black/5 dark:bg-black/40 pointer-events-none" />
        
        <div className="space-y-8 w-full max-w-4xl p-6 relative z-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl text-foreground">
              Your Dashboard
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto">
              Manage all your shortened links, monitor their activity, and remove what you no longer need.
            </p>
          </div>

          <Card className="w-full p-8 border-border/50 shadow-xl bg-background/95 backdrop-blur-sm">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <LoaderCircleIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground animate-pulse">Fetching your URLs...</p>
              </div>
            ) : urls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                  <ExternalLink className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-medium text-foreground">No URLs yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create one from the home page.
                  </p>
                </div>
                <Button asChild className="mt-4" variant="default">
                  <Link to="/">Create a Link</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="hidden md:grid md:grid-cols-[1fr_20rem_8rem_auto] gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-4 mb-4">
                  <span>Original URL</span>
                  <span className="text-center">Short Link</span>
                  <span>Created</span>
                  <span className="text-right w-16">Actions</span>
                </div>
                
                <AnimatePresence mode="popLayout">
                  {urls.map((item) => (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                      transition={{ duration: 0.2 }}
                      className="group"
                    >
                      <div className="flex flex-col md:grid md:grid-cols-[1fr_20rem_8rem_auto] items-center gap-4 px-4 py-3 rounded-xl transition-colors hover:bg-muted/30">
                        <p className="truncate text-sm font-medium w-full text-foreground/80 group-hover:text-foreground transition-colors" title={item.originalUrl}>
                          {item.originalUrl}
                        </p>
                        
                        <div className="w-full flex justify-center">
                          <Button
                            variant="link"
                            asChild
                            className="text-primary hover:text-primary/80 font-mono tracking-tight cursor-pointer text-sm w-fit text-center px-0 h-auto"
                          >
                            <a
                              href={item.shortUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {item.shortUrl}
                            </a>
                          </Button>
                        </div>
                        
                        <div className="w-full md:w-auto text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        
                        <div className="flex gap-2 justify-end w-full md:w-auto mt-2 md:mt-0 opacity-100 md:opacity-50 group-hover:opacity-100 transition-opacity">
                          <ConfirmDeleteDialog
                            title="Delete Short Link"
                            description={`Are you sure you want to permanently delete this short link? This action cannot be undone.`}
                            onConfirm={() => handleDelete(item.id)}
                          >
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </ConfirmDeleteDialog>
                        </div>
                      </div>
                      <Separator className="my-1 opacity-50 group-last:hidden" orientation="horizontal" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
