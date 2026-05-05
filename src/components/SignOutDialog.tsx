import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth, getDisplayName } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar } from "@/components/Avatar";
import { Loader2, LogOut, Download, MessageSquare, HardDrive } from "lucide-react";
import { toast } from "sonner";

type Props = { open: boolean; onOpenChange: (o: boolean) => void };

export function SignOutDialog({ open, onOpenChange }: Props) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const name = profile?.display_name || getDisplayName(user);

  const confirm = async () => {
    setBusy(true);
    try {
      await signOut();
      toast.success("Signed out", { description: "See you again soon." });
      onOpenChange(false);
      navigate({ to: "/" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="glass border-glass-border max-w-sm rounded-3xl shadow-elegant">
        <AlertDialogHeader className="space-y-4">
          <div className="flex items-start gap-3">
            <Avatar name={name} src={profile?.avatar_url} size="lg" />
            <div className="min-w-0 flex-1">
              <AlertDialogTitle className="text-left text-lg">Sign out of Velora?</AlertDialogTitle>
              <AlertDialogDescription className="text-left text-xs text-muted-foreground mt-0.5">
                {user?.email}
              </AlertDialogDescription>
            </div>
          </div>

          <div className="space-y-3 bg-card/50 rounded-lg p-3 border border-glass-border">
            <AlertDialogDescription className="text-xs text-foreground font-medium">
              You'll need to sign back in to access your meetings.
            </AlertDialogDescription>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex gap-2">
                <HardDrive className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span>Local recordings stay on this device</span>
              </div>
              <div className="flex gap-2">
                <MessageSquare className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span>Transcripts & notes preserved locally</span>
              </div>
              <div className="flex gap-2">
                <Download className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span>Downloaded files remain accessible</span>
              </div>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-3 pt-2">
          <AlertDialogCancel 
            disabled={busy} 
            className="flex-1 bg-green-500 text-white hover:bg-green-600 rounded-xl h-11 font-bold transition-all shadow-none border-0"
          >
            Stay in
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirm}
            disabled={busy}
            className="flex-1 bg-red-600 text-white hover:bg-red-700 rounded-xl h-11 font-bold shadow-none gap-2 border-0"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Sign out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}