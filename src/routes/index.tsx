import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مهامي — قائمة مهام بسيطة" },
      { name: "description", content: "تطبيق جوال لتنظيم مهامك اليومية بسهولة." },
      { property: "og:title", content: "مهامي — قائمة مهام بسيطة" },
      { property: "og:description", content: "تطبيق جوال لتنظيم مهامك اليومية بسهولة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Task = { id: string; text: string; done: boolean };
type Filter = "all" | "open" | "done";

function Index() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("tasks");
    setTasks(
      s
        ? JSON.parse(s)
        : [
            { id: "1", text: "شرب ٨ أكواب ماء", done: false },
            { id: "2", text: "قراءة ١٠ صفحات", done: true },
          ],
    );
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks, loaded]);

  const add = () => {
    if (!text.trim()) return;
    setTasks([{ id: crypto.randomUUID(), text: text.trim(), done: false }, ...tasks]);
    setText("");
  };
  const shown = tasks.filter((t) => (filter === "all" ? true : filter === "done" ? t.done : !t.done));
  const doneCount = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <main dir="rtl" className="mx-auto min-h-screen max-w-md bg-background px-5 pb-10 pt-10">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">أهلاً 👋</p>
        <h1 className="font-display text-4xl font-bold text-foreground">مهامي</h1>
      </header>

      <section className="mb-6 rounded-3xl bg-primary p-5 text-primary-foreground shadow-soft">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm opacity-80">إنجاز اليوم</p>
            <p className="text-3xl font-bold">{pct}%</p>
          </div>
          <p className="text-sm opacity-80">
            {doneCount} من {tasks.length}
          </p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-foreground/20">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      </section>

      <div className="mb-5 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="أضف مهمة جديدة..."
          className="flex-1 rounded-2xl border border-input bg-card px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={add}
          aria-label="إضافة"
          className="h-12 w-12 rounded-2xl bg-accent text-2xl font-bold text-accent-foreground active:scale-95"
        >
          +
        </button>
      </div>

      <div className="mb-4 flex gap-2 rounded-2xl bg-muted p-1">
        {(
          [
            ["all", "الكل"],
            ["open", "متبقية"],
            ["done", "منجزة"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
              filter === k ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {shown.map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft">
            <button
              onClick={() => setTasks(tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
              aria-label="تبديل"
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs ${
                t.done ? "border-accent bg-accent text-accent-foreground" : "border-border"
              }`}
            >
              {t.done && "✓"}
            </button>
            <span className={`flex-1 ${t.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {t.text}
            </span>
            <button
              onClick={() => setTasks(tasks.filter((x) => x.id !== t.id))}
              aria-label="حذف"
              className="text-muted-foreground hover:text-destructive"
            >
              ✕
            </button>
          </li>
        ))}
        {shown.length === 0 && <p className="py-10 text-center text-muted-foreground">لا توجد مهام هنا ✨</p>}
      </ul>
    </main>
  );
}
