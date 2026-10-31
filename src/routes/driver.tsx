import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useOrders, advanceOrder } from "@/lib/orders";
import {
  MapPin, Phone, MessageCircle, Package, Truck, CheckCircle2, ChevronLeft,
  Wallet, User, ListChecks, Navigation, Clock, Power, RotateCcw,
} from "lucide-react";

export const Route = createFileRoute("/driver")({
  head: () => ({
    meta: [
      { title: "ناصع للمندوب — مهام الاستلام والتسليم" },
      { name: "description", content: "تطبيق مندوب ناصع لإدارة طلبات الاستلام والتسليم اليومية." },
      { property: "og:title", content: "ناصع للمندوب" },
      { property: "og:description", content: "مهام الاستلام والتسليم لمندوبي مغسلة ناصع." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DriverApp,
});

type Kind = "pickup" | "drop";
type Task = {
  id: string; kind: Kind; customer: string; phone: string; area: string;
  time: string; pieces: number; handover: string; total: number; paid: boolean; step: number;
};

const STEPS: Record<Kind, string[]> = {
  pickup: ["جديد", "في الطريق", "وصلت", "تم الاستلام"],
  drop: ["جاهز", "في الطريق", "وصلت", "تم التسليم"],
};

const SEED: Task[] = [
  { id: "N-1042", kind: "pickup", customer: "عبدالله السالم", phone: "0500000001", area: "حي النرجس، شارع 12", time: "4:00 - 5:00 م", pieces: 6, handover: "تعليقة الباب", total: 24, paid: true, step: 0 },
  { id: "N-1043", kind: "pickup", customer: "فهد العتيبي", phone: "0500000002", area: "حي الياسمين، فيلا 8", time: "5:00 - 6:00 م", pieces: 4, handover: "يد بيد", total: 16, paid: false, step: 0 },
  { id: "N-1031", kind: "drop", customer: "سارة القحطاني", phone: "0500000003", area: "حي الملقا، عمارة 3", time: "6:00 - 7:00 م", pieces: 9, handover: "تعليقة الباب", total: 36, paid: true, step: 0 },
  { id: "N-1028", kind: "drop", customer: "محمد الدوسري", phone: "0500000004", area: "حي العارض، شارع 5", time: "7:00 - 8:00 م", pieces: 3, handover: "يد بيد", total: 12, paid: false, step: 0 },
];

// The driver app keeps its own data, under its own key, so nothing it stores
// touches the customer app.
const STORE_KEY = "naseg-driver-v1";

type Saved = { tasks: Task[]; online: boolean };

function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { tasks: SEED, online: true };
    const parsed = JSON.parse(raw) as Partial<Saved>;
    if (!Array.isArray(parsed.tasks) || parsed.tasks.length === 0) return { tasks: SEED, online: true };
    return { tasks: parsed.tasks as Task[], online: parsed.online ?? true };
  } catch {
    return { tasks: SEED, online: true };
  }
}

function DriverApp() {
  const [tab, setTab] = useState<"tasks" | "earn" | "me">("tasks");
  const [tasks, setTasks] = useState<Task[]>(SEED);
  const [openId, setOpenId] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [ready, setReady] = useState(false);
  const live = useOrders();
  const liveIds = new Set(live.map((o) => o.id));
  const all = [...live, ...tasks.filter((t) => !liveIds.has(t.id))];
  const open = all.find((t) => t.id === openId);

  // Read the driver's own saved day only after mount, so the server render and
  // the first client render agree.
  useEffect(() => {
    const saved = loadSaved();
    setTasks(saved.tasks);
    setOnline(saved.online);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORE_KEY, JSON.stringify({ tasks, online }));
  }, [tasks, online, ready]);

  const advance = (id: string) => {
    const o = live.find((x) => x.id === id);
    if (o) return void advanceOrder(o);
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, step: Math.min(t.step + 1, 3), paid: t.step === 2 ? true : t.paid } : t)));
  };

  const resetDay = () => { setTasks(SEED); setOpenId(null); };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-24 font-sans">
      <header className="rounded-b-3xl bg-primary px-5 pb-6 pt-8 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">مرحبًا، خالد</p>
            <h1 className="font-display text-2xl">ناصع <span className="text-accent">للمندوب</span></h1>
            <p className="mt-1 text-xs opacity-60">لوحة الاستلام والتسليم</p>
          </div>
          <button
            onClick={() => setOnline(!online)}
            aria-label="حالة الاتصال"
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs ${online ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}
          >
            <Power className="size-3.5" /> {online ? "متصل" : "غير متصل"}
          </button>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <Stat n={tasks.filter((t) => t.kind === "pickup" && t.step < 3).length} l="استلام" />
          <Stat n={tasks.filter((t) => t.kind === "drop" && t.step < 3).length} l="تسليم" />
          <Stat n={tasks.filter((t) => t.step === 3).length} l="منجزة" />
        </div>
      </header>

      <main className="px-4 pt-4">
        {open ? (
          <TaskDetail t={open} back={() => setOpenId(null)} advance={() => advance(open.id)} />
        ) : tab === "tasks" ? (
          <TaskList tasks={tasks} online={online} onOpen={setOpenId} />
        ) : tab === "earn" ? (
          <Earnings tasks={tasks} />
        ) : (
          <Profile onReset={resetDay} />
        )}
      </main>

      <nav className="fixed bottom-0 left-1/2 flex w-full max-w-md -translate-x-1/2 justify-around border-t bg-card py-2">
        {([["tasks", "المهام", ListChecks], ["earn", "الأرباح", Wallet], ["me", "حسابي", User]] as const).map(([k, l, I]) => (
          <button key={k} onClick={() => { setTab(k); setOpenId(null); }}
            className={`flex flex-col items-center gap-0.5 px-4 text-xs ${tab === k ? "text-primary" : "text-muted-foreground"}`}>
            <I className="size-5" />{l}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="rounded-2xl bg-primary-foreground/10 py-2">
      <div className="font-display text-xl text-accent">{n}</div>
      <div className="text-xs opacity-80">{l}</div>
    </div>
  );
}

function TaskList({ tasks, online, onOpen }: { tasks: Task[]; online: boolean; onOpen: (id: string) => void }) {
  const [f, setF] = useState<Kind | "all">("all");
  if (!online)
    return <p className="mt-10 text-center text-muted-foreground">أنت غير متصل — شغّل الاتصال لاستقبال المهام.</p>;
  const list = tasks.filter((t) => f === "all" || t.kind === f);
  return (
    <>
      <div className="mb-3 flex gap-2">
        {([["all", "الكل"], ["pickup", "استلام"], ["drop", "تسليم"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setF(k)}
            className={`rounded-full px-4 py-1.5 text-sm ${f === k ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{l}</button>
        ))}
      </div>
      <div className="space-y-3">
        {list.map((t) => (
          <button key={t.id} onClick={() => onOpen(t.id)} className="w-full rounded-2xl bg-card p-4 text-right shadow-soft">
            <div className="flex items-center justify-between">
              <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${t.kind === "pickup" ? "bg-accent/20 text-accent-foreground" : "bg-primary/10 text-primary"}`}>
                {t.kind === "pickup" ? <Package className="size-3.5" /> : <Truck className="size-3.5" />}
                {t.kind === "pickup" ? "استلام" : "تسليم"}
              </span>
              <span className={`text-xs ${t.step === 3 ? "text-success" : "text-muted-foreground"}`}>{STEPS[t.kind][t.step]}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="font-display text-lg">{t.customer}</p>
                <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{t.area}</p>
                <p className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="size-3.5" />{t.time} · {t.pieces} قطع</p>
              </div>
              <ChevronLeft className="size-5 text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

function TaskDetail({ t, back, advance }: { t: Task; back: () => void; advance: () => void }) {
  const steps = STEPS[t.kind];
  const done = t.step === 3;
  const next = ["ابدأ التوجه للعميل", "وصلت للموقع", t.kind === "pickup" ? "تأكيد استلام القطع" : "تأكيد تسليم الطلب"][t.step];
  return (
    <div className="space-y-4">
      <button onClick={back} className="text-sm text-muted-foreground">→ رجوع للمهام</button>
      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <p className="text-xs text-muted-foreground">طلب {t.id} · {t.kind === "pickup" ? "استلام" : "تسليم"}</p>
        <p className="font-display text-xl">{t.customer}</p>
        <p className="mt-1 flex items-center gap-1 text-sm"><MapPin className="size-4 text-accent" />{t.area}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <a href={`tel:${t.phone}`} className="flex flex-col items-center rounded-xl bg-secondary py-2 text-xs"><Phone className="size-4" />اتصال</a>
          <a href={`sms:${t.phone}`} className="flex flex-col items-center rounded-xl bg-secondary py-2 text-xs"><MessageCircle className="size-4" />رسالة</a>
          <a href={`https://maps.google.com/?q=${encodeURIComponent(t.area)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center rounded-xl bg-secondary py-2 text-xs"><Navigation className="size-4" />الخريطة</a>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">الوقت</span><span>{t.time}</span></div>
        <div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">عدد القطع</span><span>{t.pieces}</span></div>
        <div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">طريقة {t.kind === "pickup" ? "الاستلام" : "التسليم"}</span><span>{t.handover}</span></div>
        <div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">المبلغ</span>
          <span>{t.total} ر.س · {t.paid ? <b className="text-success">مدفوع</b> : <b className="text-destructive">تحصيل نقدي</b>}</span></div>
      </div>

      <ol className="flex justify-between rounded-2xl bg-card p-4 shadow-soft">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col items-center gap-1 text-center text-xs">
            <span className={`flex size-7 items-center justify-center rounded-full ${i <= t.step ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      {done ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-6 shadow-soft">
          <CheckCircle2 className="size-14 text-success" />
          <p className="font-display text-lg">{t.kind === "pickup" ? "تم استلام الطلب" : "تم تسليم الطلب"}</p>
        </div>
      ) : (
        <button onClick={advance} className="w-full rounded-2xl bg-primary py-4 font-display text-lg text-primary-foreground">{next}</button>
      )}
    </div>
  );
}

function Earnings({ tasks }: { tasks: Task[] }) {
  const done = tasks.filter((t) => t.step === 3);
  const cash = done.reduce((a, t) => a + t.total, 0);
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
        <p className="text-sm opacity-80">أرباح اليوم</p>
        <p className="font-display text-3xl text-accent">{done.length * 8} ر.س</p>
        <p className="text-xs opacity-80">{done.length} مهام منجزة × 8 ر.س</p>
      </div>
      {[["هذا الأسبوع", "312 ر.س"], ["هذا الشهر", "1,280 ر.س"], ["نقد بحوزتك", `${cash} ر.س`]].map(([l, v]) => (
        <div key={l} className="flex justify-between rounded-2xl bg-card p-4 shadow-soft"><span className="text-muted-foreground">{l}</span><b>{v}</b></div>
      ))}
    </div>
  );
}

function Profile({ onReset }: { onReset: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-card p-5 text-center shadow-soft">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent font-display text-2xl text-accent-foreground">خ</div>
        <p className="mt-2 font-display text-xl">خالد المندوب</p>
        <p className="text-sm text-muted-foreground">سيارة: هايلكس · لوحة ر ن ص 1234</p>
      </div>
      {["المنطقة: شمال الرياض", "التقييم: 4.9 ★", "الدعم الفني"].map((l) => (
        <div key={l} className="rounded-2xl bg-card p-4 shadow-soft">{l}</div>
      ))}
      <button onClick={onReset} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-soft">
        <RotateCcw className="size-4" /> بدء يوم جديد (إرجاع المهام الأصلية)
      </button>
    </div>
  );
}
