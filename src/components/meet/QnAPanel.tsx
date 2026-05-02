import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, Check, Send, MessageCircleQuestion, Mic, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";

export type Question = {
  id: string;
  from: string;
  text: string;
  ts: number;
  upvotes: string[]; // peer ids who upvoted
  answered: boolean;
  hostAnswer?: string; // typed answer from host
};

type Props = {
  questions: Question[];
  selfId: string;
  isHost: boolean;
  onAsk: (text: string) => void;
  onUpvote: (id: string) => void;
  onMarkAnswered: (id: string) => void;
  onAnswerTyped?: (id: string, answer: string) => void;
  onAnswerVerbal?: (id: string) => void;
};

export function QnAPanel({ questions, selfId, isHost, onAsk, onUpvote, onMarkAnswered, onAnswerTyped, onAnswerVerbal }: Props) {
  const [text, setText] = useState("");
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    if (t.length > 300) return;
    onAsk(t);
    setText("");
  };

  const open = questions.filter((q) => !q.answered).sort((a, b) => b.upvotes.length - a.upvotes.length);
  const answered = questions.filter((q) => q.answered);

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-glass-border">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageCircleQuestion className="h-4 w-4 text-primary" /> Q&amp;A
        </h3>
        <p className="text-xs text-muted-foreground">
          Ask a question — the most upvoted ones bubble to the top.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {open.length === 0 && answered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center pt-10">No questions yet.</p>
        )}
        {open.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1 mb-2">Open</p>
            <ul className="space-y-2">
              {open.map((q) => (
                <QuestionRow
                  key={q.id} q={q} selfId={selfId} isHost={isHost}
                  onUpvote={() => onUpvote(q.id)}
                  onMarkAnswered={() => onMarkAnswered(q.id)}
                  onAnswerTyped={onAnswerTyped ? (answer) => onAnswerTyped(q.id, answer) : undefined}
                  onAnswerVerbal={onAnswerVerbal ? () => onAnswerVerbal(q.id) : undefined}
                />
              ))}
            </ul>
          </div>
        )}
        {answered.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-success font-semibold px-1 mb-2">Answered</p>
            <ul className="space-y-2 opacity-70">
              {answered.map((q) => (
                <QuestionRow
                  key={q.id} q={q} selfId={selfId} isHost={isHost}
                  onUpvote={() => onUpvote(q.id)}
                  onMarkAnswered={() => onMarkAnswered(q.id)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-glass-border flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Ask a question…"
          maxLength={300}
          className="bg-input/60 border-glass-border h-10"
        />
        <Button onClick={submit} size="icon" className="bg-gradient-primary text-primary-foreground border-0 shadow-glow">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function QuestionRow({
  q, selfId, isHost, onUpvote, onMarkAnswered, onAnswerTyped, onAnswerVerbal,
}: {
  q: Question; selfId: string; isHost: boolean;
  onUpvote: () => void; onMarkAnswered: () => void;
  onAnswerTyped?: (answer: string) => void;
  onAnswerVerbal?: () => void;
}) {
  const upvoted = q.upvotes.includes(selfId);
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [answerText, setAnswerText] = useState("");

  const submitTypedAnswer = () => {
    if (!answerText.trim()) return;
    onAnswerTyped?.(answerText.trim());
    onMarkAnswered();
    setShowAnswerInput(false);
    setAnswerText("");
  };

  const handleVerbal = () => {
    onAnswerVerbal?.();
    onMarkAnswered();
  };

  return (
    <li className="glass rounded-xl p-3">
      <div className="flex items-start gap-2">
        <button
          onClick={onUpvote}
          className={`shrink-0 flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 transition-smooth ${
            upvoted ? "bg-primary/20 text-primary" : "hover:bg-card/60 text-muted-foreground"
          }`}
          title={upvoted ? "Remove upvote" : "Upvote"}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          <span className="text-[10px] font-semibold">{q.upvotes.length}</span>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground">{q.from}</p>
          <p className="text-sm break-words">{q.text}</p>
          {q.hostAnswer && (
            <div className="mt-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Host's answer</p>
              <p className="text-sm text-foreground/90">{q.hostAnswer}</p>
            </div>
          )}
          {isHost && !q.answered && showAnswerInput && (
            <div className="mt-2 space-y-2">
              <Textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your answer…"
                className="bg-input/60 border-glass-border text-sm min-h-[70px] resize-none"
                maxLength={500}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={submitTypedAnswer} disabled={!answerText.trim()} className="bg-primary text-white border-0 rounded-lg h-8 text-xs flex-1">
                  <Check className="h-3 w-3 mr-1" /> Submit Answer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowAnswerInput(false); setAnswerText(""); }} className="rounded-lg h-8 text-xs">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
        {isHost && !q.answered && !showAnswerInput && (
          <div className="shrink-0 flex flex-col gap-1.5 items-end">
            <button
              onClick={() => setShowAnswerInput(true)}
              className="text-[10px] text-primary hover:underline inline-flex items-center gap-1 bg-primary/10 rounded-md px-2 py-1"
              title="Type an answer"
            >
              <MessageSquare className="h-3 w-3" /> Type
            </button>
            <button
              onClick={handleVerbal}
              className="text-[10px] text-amber-500 hover:underline inline-flex items-center gap-1 bg-amber-500/10 rounded-md px-2 py-1"
              title="Answer verbally"
            >
              <Mic className="h-3 w-3" /> Verbal
            </button>
          </div>
        )}
        {q.answered && !showAnswerInput && (
          <span className="shrink-0 text-[10px] text-success inline-flex items-center gap-1">
            <Check className="h-3 w-3" /> Answered
          </span>
        )}
      </div>
    </li>
  );
}