import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useOrders, advanceOrder, splitHandover } from "@/lib/orders";
import {
  MapPin, Phone, MessageCircle, Package, Truck, CheckCircle2, ChevronLeft,
  History, BookOpen, StickyNote, User, ListChecks, Navigation, Clock, Power, Inbox, ScanLine,
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
  notes?: string; privacy?: boolean;
};

const STEPS: Record<Kind, string[]> = {
  pickup: ["جديد", "في الطريق", "وصلت", "تم الاستلام"],
  drop: ["جاهز", "في الطريق", "وصلت", "تم التسليم"],
};

function DriverApp() {
  const [tab, setTab] = useState<"tasks" | "past" | "guide" | "me">("tasks");
  const [openId, setOpenId] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const all = useOrders();
  const open = all.find((t) => t.id === openId);
  // Finished tasks (step 3) leave the live list and move entirely to "المهام السابقة".
  const active = all.filter((t) => t.step < 3);
  const past = all.filter((t) => t.step === 3);

  const advance = (id: string) => {
    const o = all.find((x) => x.id === id);
    if (o) void advanceOrder(o);
  };

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
          <Stat n={all.filter((t) => t.kind === "pickup" && t.step < 3).length} l="استلام" />
          <Stat n={all.filter((t) => t.kind === "drop" && t.step < 3).length} l="تسليم" />
          <Stat n={all.filter((t) => t.step === 3).length} l="منجزة" />
        </div>
      </header>

      <main className="px-4 pt-4">
        {open ? (
          <TaskDetail t={open} back={() => setOpenId(null)} advance={() => advance(open.id)} />
        ) : tab === "tasks" ? (
          <TaskList tasks={active} online={online} onOpen={setOpenId} />
        ) : tab === "past" ? (
          <PastTasks tasks={past} onOpen={setOpenId} />
        ) : tab === "guide" ? (
          <Instructions tasks={active} />
        ) : (
          <Profile />
        )}
      </main>

      <nav className="fixed bottom-0 left-1/2 flex w-full max-w-md -translate-x-1/2 justify-around border-t bg-card py-2">
        {([["tasks", "المهام", ListChecks], ["past", "السابقة", History], ["guide", "التعليمات", BookOpen], ["me", "حسابي", User]] as const).map(([k, l, I]) => (
          <button key={k} onClick={() => { setTab(k); setOpenId(null); }}
            className={`flex flex-col items-center gap-0.5 px-2 text-xs ${tab === k ? "text-primary" : "text-muted-foreground"}`}>
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
      {list.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-secondary">
            <Inbox className="size-8 text-muted-foreground" />
          </span>
          <p className="font-display text-lg">لا توجد طلبات حاليًا</p>
          <p className="text-sm text-muted-foreground">أي طلب جديد من العملاء يظهر هنا فورًا.</p>
        </div>
      ) : (
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
      )}
    </>
  );
}

function TaskDetail({ t, back, advance }: { t: Task; back: () => void; advance: () => void }) {
  const steps = STEPS[t.kind];
  const done = t.step === 3;
  const next = ["ابدأ التوجه للعميل", "وصلت للموقع", t.kind === "pickup" ? "تأكيد استلام القطع" : "تأكيد تسليم الطلب"][t.step];
  return (
    <div className="space-y-4">
      <button onClick={back} className="text-sm text-muted-foreground">→ رجوع</button>
      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <p className="text-xs text-muted-foreground">طلب {t.id} · {t.kind === "pickup" ? "استلام" : "تسليم"}</p>
        <p className="font-display text-xl">{t.customer}</p>
        <p className="mt-1 flex items-center gap-1 text-sm"><MapPin className="size-4 text-accent" />{t.area}</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          <a href={`tel:${t.phone}`} className="flex flex-col items-center rounded-xl bg-secondary py-2 text-xs"><Phone className="size-4" />اتصال</a>
          <a href={`sms:${t.phone}`} className="flex flex-col items-center rounded-xl bg-secondary py-2 text-xs"><MessageCircle className="size-4" />رسالة</a>
          <a href={`https://maps.google.com/?q=${encodeURIComponent(t.area)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center rounded-xl bg-secondary py-2 text-xs"><Navigation className="size-4" />الخريطة</a>
          <BarcodeButton />
        </div>
        {/* scanned result shown inside BarcodeButton */}
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">الوقت</span><span>{t.time}</span></div>
        <div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">عدد القطع</span><span>{t.pieces}</span></div>
        <div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">طريقة الاستلام</span><b className={t.kind === "pickup" ? "text-accent" : ""}>{splitHandover(t.handover).pick}</b></div>
        <div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">طريقة التسليم</span><b className={t.kind === "drop" ? "text-accent" : ""}>{splitHandover(t.handover).drop}</b></div>
        <div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">كيس الخصوصية</span><span>{t.privacy ? "مفعّل" : "غير مفعّل"}</span></div>
        <div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">المبلغ</span>
          <span>{t.total} ر.س · {t.paid ? <b className="text-success">مدفوع</b> : <b className="text-destructive">تحصيل نقدي</b>}</span></div>
      </div>

      {t.notes ? (
        <div className="rounded-2xl border border-accent bg-card p-4 shadow-soft">
          <p className="flex items-center gap-1 text-sm font-bold"><StickyNote className="size-4 text-accent" />ملاحظات الزبون</p>
          <p className="mt-1 text-sm">{t.notes}</p>
        </div>
      ) : null}

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

function TaskCard({ t, onOpen }: { t: Task; onOpen: (id: string) => void }) {
  return (
    <button onClick={() => onOpen(t.id)} className="w-full rounded-2xl bg-card p-4 text-right shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">طلب {t.id} · {t.kind === "pickup" ? "استلام" : "تسليم"}</span>
        <span className="flex items-center gap-1 text-xs text-success"><CheckCircle2 className="size-3.5" />{STEPS[t.kind][3]}</span>
      </div>
      <p className="mt-1 font-display text-lg">{t.customer}</p>
      <p className="text-sm text-muted-foreground">{t.area} · {t.pieces} قطع · {t.total} ر.س</p>
    </button>
  );
}

function PastTasks({ tasks, onOpen }: { tasks: Task[]; onOpen: (id: string) => void }) {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl">المهام السابقة</h2>
      {tasks.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">لا توجد مهام منجزة بعد.</p>
      ) : tasks.map((t) => <TaskCard key={t.id} t={t} onOpen={onOpen} />)}
    </div>
  );
}

const STORE_RULES = [
  "تأكد من عدد القطع أمام العميل أو صوّرها قبل إغلاق الكيس.",
  "استخدم غلاف الخصوصية دائمًا ولا تفتح الكيس أمام أحد.",
  "في تعليقة الباب: علّق الكيس وصوّره ثم أرسل الصورة للعميل.",
  "لا تطرق الباب إذا اختار العميل الاستلام بدون إزعاج.",
  "حصّل المبلغ النقدي كاملًا قبل التسليم إذا كان الطلب غير مدفوع.",
  "التزم بموعد الاستلام، وإذا تأخرت أبلغ العميل برسالة.",
];

function Instructions({ tasks }: { tasks: Task[] }) {
  const withNotes = tasks.filter((t) => t.notes);
  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-primary p-5 text-primary-foreground">
        <h2 className="flex items-center gap-2 font-display text-xl"><BookOpen className="size-5 text-accent" />تعليمات المتجر</h2>
        <ol className="mt-3 list-decimal space-y-2 pr-5 text-sm">
          {STORE_RULES.map((r) => <li key={r}>{r}</li>)}
        </ol>
      </section>
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-xl"><StickyNote className="size-5 text-accent" />ملاحظات الزبائن</h2>
        {withNotes.length === 0 ? (
          <p className="rounded-2xl bg-card p-4 text-center text-sm text-muted-foreground shadow-soft">لا توجد ملاحظات على المهام الحالية.</p>
        ) : withNotes.map((t) => (
          <div key={t.id} className="rounded-2xl border border-accent bg-card p-4 shadow-soft">
            <p className="text-xs text-muted-foreground">طلب {t.id} · {t.customer}</p>
            <p className="mt-1 text-sm">{t.notes}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function Profile() {
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
    </div>
  );
}

type Detector = { detect: (src: ImageBitmap) => Promise<{ rawValue: string }[]> };

function BarcodeButton() {
  const ref = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState<string | null>(null);
  const onFile = async (f?: File) => {
    if (!f) return;
    const BD = (window as unknown as { BarcodeDetector?: new () => Detector }).BarcodeDetector;
    if (!BD) return setCode("تم حفظ صورة الباركود");
    try {
      const r = await new BD().detect(await createImageBitmap(f));
      setCode(r[0]?.rawValue ?? "لم يُقرأ الباركود، حاول مرة ثانية");
    } catch { setCode("لم يُقرأ الباركود، حاول مرة ثانية"); }
  };
  return (
    <>
      <button onClick={() => ref.current?.click()} className="flex flex-col items-center rounded-xl bg-secondary py-2 text-xs">
        <ScanLine className="size-4" />الباركود
      </button>
      <input ref={ref} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
      {code ? <p className="col-span-4 rounded-xl bg-accent/20 p-2 text-center text-sm">الباركود: <b>{code}</b></p> : null}
    </>
  );
}
