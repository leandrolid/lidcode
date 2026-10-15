import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

type Props = {
  children: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
};

export function ConfirmDeleteDialog({
  children,
  title = "Remove this link?",
  description,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="confirm-dialog">
        <AlertDialogHeader>
          <span className="dialog-icon" aria-hidden="true">
            <Trash2 size={21} strokeWidth={1.7} />
          </span>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="dialog-cancel" onClick={onCancel}>
            Keep link
          </AlertDialogCancel>
          <AlertDialogAction className="dialog-remove" onClick={onConfirm}>
            Remove link
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
