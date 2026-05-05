import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Avatar, colorForName } from "@/components/Avatar";
import {
  Copy, ArrowRight, Lock, Globe2, Users, Clock, Calendar,
  MoreVertical, Trash2, Share2, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import type { LocalMeeting } from "@/lib/meeting";

type Props = LocalMeeting & {
  className?: string;
  participants?: Array<{ name: string; avatarUrl?: string | null }>;
  onDelete?: () => void;
  onRejoin?: () => void;
  isLoading?: boolean;
};

export function MeetingCard({
  id: meetingId,
  privacy,
  createdAt,
  capacity,
  participants,
  className,
  onDelete,
  onRejoin,
  isLoading,
}: Props) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const copyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/meet/${meetingId}`)
      .then(() => toast.success("Meeting link copied"));
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete?.();
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRejoin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRejoin?.();
  };

  // Format the created time
  const createdDate = new Date(createdAt);
  const isToday = createdDate.toDateString() === new Date().toDateString();
  const timeStr = isToday
    ? createdDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : createdDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  // Determine if meeting is active (expired meetings shouldn't be active)
  const isExpired = false; // Could implement this with expiresAt check

  return (
    <>
      <Link
        to="/meet/$meetingId"
        params={{ meetingId }}
        className={`group relative block ${className}`}
      >
        <div className="glass card-lining-left lining-green rounded-xl overflow-hidden border border-glass-border hover:border-primary/50 transition-all hover:bg-card/40 h-full flex flex-col group/card shadow-elegant">
          {/* Header with vibrant gradient background */}
          <div className="relative h-28 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 overflow-hidden border-b border-glass-border/30">
            {/* Animated accent */}
            <div className="absolute inset-0 opacity-20 group-hover/card:opacity-40 transition-opacity">
              <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,var(--brand-green)_0%,transparent_70%)] animate-float blur-3xl opacity-20" />
            </div>

            {/* Meeting code display */}
            <div className="relative p-6 h-full flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
                      Live Room
                    </p>
                  </div>
                  <p className="font-mono text-lg font-black text-foreground tracking-tight break-all">
                    {meetingId}
                  </p>
                </div>

                {/* Privacy badge */}
                <div className="ml-2 flex-shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider glass px-2.5 py-1 rounded-full border-glass-border shadow-sm">
                  {privacy === "private" ? (
                    <>
                      <Lock className="h-3 w-3 text-warning" />
                      <span className="text-warning">Private</span>
                    </>
                  ) : (
                    <>
                      <Globe2 className="h-3 w-3 text-primary" />
                      <span className="text-primary">Open</span>
                    </>
                  )}
                </div>
              </div>

              {/* Status indicator */}
              {isLoading && (
                <div className="flex items-center gap-1.5 text-xs text-blue-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Connecting…
                </div>
              )}
            </div>
          </div>

          {/* Content section */}
          <div className="flex-1 p-4 space-y-4">
            {/* Participants section */}
            {participants && participants.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Participants
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {participants.slice(0, 4).map((p, i) => (
                    <div
                      key={i}
                      title={p.name}
                      className="relative"
                    >
                      <Avatar
                        name={p.name}
                        src={p.avatarUrl}
                        size="sm"
                      />
                    </div>
                  ))}
                  {participants.length > 4 && (
                    <div className="h-8 w-8 rounded-full glass flex items-center justify-center text-xs font-semibold text-muted-foreground border border-glass-border">
                      +{participants.length - 4}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Meeting details */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                <span className="break-words">{createdDate.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                <span>{timeStr}</span>
              </div>
              {capacity && (
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                  <span>Capacity: {capacity} people</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="p-4 border-t border-glass-border space-y-2 bg-card/30">
            <Button
              onClick={handleRejoin}
              disabled={isLoading}
              className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 border-0 shadow-glow h-9 text-xs gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Joining…
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  Rejoin
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Button
                onClick={copyLink}
                variant="secondary"
                size="sm"
                className="flex-1 h-8 text-[11px] gap-1"
              >
                <Copy className="h-3 w-3" />
                <span className="hidden sm:inline">Copy link</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={copyLink}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Copy link
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete from history
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Link>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove meeting from history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <span className="font-mono font-semibold text-foreground">{meetingId}</span> from your recent meetings. You can still rejoin if you have the link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
