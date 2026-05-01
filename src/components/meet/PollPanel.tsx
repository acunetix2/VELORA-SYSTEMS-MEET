import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Plus, Trash2 } from "lucide-react";

export type PollOption = { id: string; text: string; votes: string[] };
export type Poll = { id: string; question: string; options: PollOption[]; active: boolean };

type Props = {
  polls: Poll[];
  isHost: boolean;
  selfId: string;
  onCreatePoll: (question: string, options: string[]) => void;
  onVote: (pollId: string, optionId: string) => void;
  onEndPoll: (pollId: string) => void;
};

export function PollPanel({ polls, isHost, selfId, onCreatePoll, onVote, onEndPoll }: Props) {
  const [creating, setCreating] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);

  const submit = () => {
    if (!question.trim() || options.filter(o => o.trim()).length < 2) return;
    onCreatePoll(question.trim(), options.filter(o => o.trim()));
    setQuestion("");
    setOptions(["", ""]);
    setCreating(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-glass-border flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Polls</h3>
          <p className="text-xs text-muted-foreground">Live voting and results</p>
        </div>
        {isHost && !creating && (
          <Button size="sm" onClick={() => setCreating(true)} className="h-8 bg-gradient-primary border-0 text-primary-foreground shadow-glow">
            <Plus className="h-3.5 w-3.5 mr-1" /> New
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {creating ? (
          <div className="glass rounded-2xl p-4 space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Question</Label>
              <Input value={question} onChange={e => setQuestion(e.target.value)} placeholder="What should we discuss next?" className="bg-input/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground block">Options</Label>
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={opt} onChange={e => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }} placeholder={`Option ${i + 1}`} className="bg-input/50" />
                  {options.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="shrink-0 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 5 && (
                <Button variant="ghost" size="sm" onClick={() => setOptions([...options, ""])} className="w-full mt-2 border border-dashed border-glass-border">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add option
                </Button>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setCreating(false)}>Cancel</Button>
              <Button className="flex-1" onClick={submit} disabled={!question.trim() || options.filter(o => o.trim()).length < 2}>Launch Poll</Button>
            </div>
          </div>
        ) : polls.length === 0 ? (
          <div className="text-center pt-10">
            <BarChart3 className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No active polls.</p>
            {isHost && <p className="text-xs text-muted-foreground mt-1">Create one to get feedback from your attendees.</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {polls.map((poll) => {
              const totalVotes = poll.options.reduce((acc, o) => acc + o.votes.length, 0);
              const myVote = poll.options.find(o => o.votes.includes(selfId))?.id;

              return (
                <div key={poll.id} className="glass rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="font-medium text-sm leading-tight">{poll.question}</p>
                    {!poll.active && <span className="text-[10px] uppercase tracking-wider glass rounded-md px-1.5 py-0.5 text-muted-foreground shrink-0">Ended</span>}
                  </div>
                  <div className="space-y-2">
                    {poll.options.map((opt) => {
                      const pct = totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100);
                      const isMyVote = myVote === opt.id;
                      return (
                        <div key={opt.id} className="relative overflow-hidden rounded-lg border border-glass-border bg-card/30">
                          {/* Progress bar */}
                          <div className="absolute top-0 bottom-0 left-0 bg-primary/20 transition-all duration-500" style={{ width: `${pct}%` }} />
                          <button
                            disabled={!poll.active || !!myVote}
                            onClick={() => onVote(poll.id, opt.id)}
                            className={`relative w-full text-left px-3 py-2 text-sm flex items-center justify-between ${!poll.active || myVote ? "cursor-default" : "hover:bg-card/40"} ${isMyVote ? "font-semibold text-primary" : ""}`}
                          >
                            <span className="truncate pr-4 flex-1">{opt.text} {isMyVote && "✓"}</span>
                            {(myVote || !poll.active) && <span className="text-xs text-muted-foreground shrink-0">{pct}% ({opt.votes.length})</span>}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {isHost && poll.active && (
                    <Button variant="ghost" size="sm" onClick={() => onEndPoll(poll.id)} className="w-full mt-3 text-destructive hover:text-destructive text-xs h-8">
                      End Poll
                    </Button>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-3 text-center">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
