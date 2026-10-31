import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { createOrder, useOrder, PICKUP_STEPS, DROP_STEPS, stepLabel, uploadPhotos } from "@/lib/orders";
import {
  Bell, Shirt, Flame, Droplet, Grid3x3, Home, ShoppingBag, Star, User, ChevronRight, ChevronLeft,
  Plus, Minus, X, Search, Banknote, CreditCard, Check, Lock, Phone, MessageSquare, MapPin, Users,
  Truck, Receipt, QrCode, Camera,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ناصع — مغسلة فاخرة على بابك" },
      { name: "description", content: "اطلب استلام ملابسك من باب بيتك، وتابع الغسيل والكي والتوصيل لحظة بلحظة." },
      { property: "og:title", content: "ناصع — مغسلة فاخرة على بابك" },
      { property: "og:description", content: "علّق ملابسك على الباب ونحن نتولى الباقي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});

type Screen = "home" | "order" | "payment" | "done" | "track" | "map" | "offers" | "account" | "delivery" | "orders";
type Item = { name: string; price: number; cat: string };

const MAIN: Item[] = [
  { name: "ثوب", price: 4, cat: "رجالي" },
  { name: "شماغ", price: 4, cat: "رجالي" },
  { name: "عباية", price: 6, cat: "نسائي" },
  { name: "قميص", price: 4, cat: "رجالي" },
];
const OTHER: Item[] = [
  { name: "ملابس رياضية", price: 4, cat: "رجالي" },
  { name: "بنطلون", price: 5, cat: "رجالي" },
  { name: "جاكيت", price: 8, cat: "رجالي" },
  { name: "فستان", price: 9, cat: "نسائي" },
  { name: "بطانية", price: 15, cat: "مفروشات" },
];
const ALL = [...MAIN, ...OTHER];

const PICKUP_OPTS: [string, string][] = [
  ["تعليقة الباب", "تعلّق الكيس على باب بيتك"],
  ["يد بيد", "يستلم المندوب منك مباشرة"],
  ["السلة الرئيسية", "في السلة عند المدخل"],
  ["موقع مختلف عن المحفوظ", "مثل العمل"],
];
const DROP_OPTS: [string, string][] = [
  ["تعليقة الباب", "نعلّق الكيس على باب بيتك"],
  ["يد بيد", "تستلم الطلب مباشرة"],
  ["موقع مختلف عن المحفوظ", "مثل العمل"],
  ["الاستلام من المغسلة", "تمرّ وتستلم طلبك بنفسك من المغسلة"],
];

const optionAt = (opts: [string, string][], i: number): [string, string] => opts[i] ?? opts[0] ?? ["", ""];

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [qty, setQty] = useState<Record<string, number>>({ ثوب: 2, شماغ: 1 });
  const [extras, setExtras] = useState<string[]>([]);
  const [invoice, setInvoice] = useState(false);
  const [time, setTime] = useState("اليوم مساءً");
  const [payMethod, setPayMethod] = useState("كاش عند الاستلام");
  const [notes, setNotes] = useState("");
  const [orderId, setOrderIdState] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [handover, setHandover] = useState("استلام: تعليقة الباب · تسليم: تعليقة الباب");
  useEffect(() => { setOrderIdState(localStorage.getItem("naseg-last-order")); }, []);
  const setOrderId = (id: string | null) => {
    setOrderIdState(id);
    if (id) localStorage.setItem("naseg-last-order", id);
  };
  const placeOrder = (m: string) => {
    setPayMethod(m);
    const pieces = ALL.reduce((s, i) => s + (qty[i.name] || 0), 0);
    const total = ALL.reduce((s, i) => s + (qty[i.name] || 0) * i.price, 0);
    uploadPhotos(photos)
      .then((paths) => createOrder({ time, pieces, total, paid: m !== "كاش عند الاستلام", handover, notes: notes.trim(), photos: paths }))
      .then((id) => { setOrderId(id); setPhotos([]); setNotes(""); })
      .catch(() => setOrderId(null));
  };
  const go = (s: Screen) => {
    setScreen(s);
    window.scrollTo(0, 0);
  };
  const tab = (["home", "orders", "offers", "account"] as Screen[]).includes(screen) || screen === "delivery";

  return (
    <div dir="rtl" className="mx-auto min-h-screen max-w-md bg-background font-sans text-foreground">
      <div className={tab ? "pb-24" : ""}>
        {screen === "home" && <HomeScreen go={go} orderId={orderId} />}
        {screen === "order" && <OrderScreen go={go} qty={qty} setQty={setQty} extras={extras} setExtras={setExtras} time={time} setTime={setTime} notes={notes} setNotes={setNotes} photos={photos} setPhotos={setPhotos} setHandover={setHandover} />}
        {screen === "payment" && <PaymentScreen go={go} onPaid={placeOrder} />}
        {screen === "done" && <DoneScreen go={go} qty={qty} time={time} payMethod={payMethod} orderId={orderId} />}
        {screen === "track" && <TrackScreen go={go} orderId={orderId} />}
        {screen === "map" && <MapScreen go={go} />}
        {screen === "offers" && <OffersScreen />}
        {screen === "orders" && <OrdersScreen go={go} orderId={orderId} />}
        {screen === "account" && <AccountScreen go={go} openInvoice={() => setInvoice(true)} />}
        {screen === "delivery" && <DeliveryScreen go={go} />}
      </div>
      {tab && <BottomNav screen={screen} go={go} />}
      {invoice && <InvoiceModal close={() => setInvoice(false)} />}
    </div>
  );
}

/* ---------- shared ---------- */
function Header({ title, back, extra }: { title: string; back: () => void; extra?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-5 pb-4 pt-8">
      <button onClick={back} aria-label="رجوع" className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card">
        <ChevronRight className="h-5 w-5" />
      </button>
      <h1 className="flex-1 font-display text-3xl font-bold">{title}</h1>
      {extra}
    </div>
  );
}
function GoldBtn({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`rounded-full bg-accent px-6 py-3.5 font-bold text-accent-foreground active:scale-[0.98] ${className}`}>
      {children}
    </button>
  );
}
function Footer({ children }: { children: ReactNode }) {
  return <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-border bg-card p-4">{children}</div>;
}
function Stepper({ n, set }: { n: number; set: (n: number) => void }) {
  if (n === 0)
    return (
      <button onClick={() => set(1)} className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground" aria-label="زيادة">
        <Plus className="h-4 w-4" />
      </button>
    );
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => set(n - 1)} className="grid h-9 w-9 place-items-center rounded-full border border-accent" aria-label="إنقاص">
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-4 text-center font-bold">{n}</span>
      <button onClick={() => set(n + 1)} className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground" aria-label="زيادة">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
function Logo() {
  return (
    <div className="flex flex-col items-center text-accent">
      <svg viewBox="0 0 120 50" className="h-12 w-28" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M60 18 V12 a6 6 0 1 1 6 -6" />
        <path d="M60 18 L8 44 H112 Z" strokeLinejoin="round" />
      </svg>
      <span className="-mt-6 font-display text-xl font-bold text-primary">ناصع</span>
    </div>
  );
}
function Toggle({ on, set }: { on: boolean; set: (b: boolean) => void }) {
  return (
    <button onClick={() => set(!on)} aria-label="تبديل" className={`flex h-8 w-14 items-center rounded-full p-1 transition ${on ? "bg-accent" : "bg-primary-foreground/20"}`}>
      <span className={`h-6 w-6 rounded-full bg-primary transition ${on ? "" : "-translate-x-6"}`} />
    </button>
  );
}

/* ---------- home ---------- */
function HomeScreen({ go, orderId }: { go: (s: Screen) => void; orderId?: string | null }) {
  const live = useOrder(orderId ?? null);
  const services = [
    { t: "غسيل وكي", i: Shirt },
    { t: "كي فقط", i: Flame },
    { t: "غسيل جاف", i: Droplet },
    { t: "سجاد وستائر", i: Grid3x3 },
  ];
  return (
    <div className="px-5 pt-8">
      <div className="flex items-start justify-between">
        <Logo />
        <button className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card" aria-label="الإشعارات">
          <Bell className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">مرحباً بك</p>
      <h1 className="font-display text-3xl font-bold">ملابسك بين أيدٍ أمينة</h1>

      <div className="relative mt-5 overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground">
        <svg viewBox="0 0 120 70" className="absolute -left-2 top-4 h-24 w-32 text-primary-foreground/25" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M60 30 V20 a9 9 0 1 1 9 -9" />
          <path d="M60 30 L6 64 H114 Z" strokeLinejoin="round" />
        </svg>
        <p className="text-sm text-accent">الاستلام من بابك</p>
        <p className="relative mt-2 text-xl font-bold leading-relaxed">علّق ملابسك على الباب ونحن نتولى الباقي</p>
        <GoldBtn onClick={() => go("order")} className="mt-5">اطلب استلام الآن</GoldBtn>
      </div>

      <h2 className="mt-7 font-bold">خدماتنا</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {services.map(({ t, i: I }) => (
          <button key={t} onClick={() => go("order")} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary"><I className="h-5 w-5" /></span>
            {t}
          </button>
        ))}
      </div>

      {live && !(live.kind === "drop" && live.step === 3) ? (
        <button onClick={() => go("track")} className="mt-4 w-full rounded-2xl border border-border bg-card p-5 text-right">
          <div className="flex justify-between font-bold">
            <span>طلبك الحالي · {live.id}</span>
            <span className="text-accent">{live.kind === "pickup" && live.step === 3 ? "في المغسلة" : stepLabel(live)}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-accent" style={{ width: `${((live.kind === "drop" ? 4 : 0) + live.step + 1) * 12.5}%` }} />
          </div>
        </button>
      ) : null}
    </div>
  );
}

function BottomNav({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  const items: [Screen, string, typeof Home][] = [
    ["home", "الرئيسية", Home],
    ["orders", "طلباتي", ShoppingBag],
    ["offers", "العروض", Star],
    ["account", "حسابي", User],
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md justify-around border-t border-border bg-card py-3">
      {items.map(([s, l, I]) => {
        const active = screen === s || (s === "account" && screen === "delivery");
        return (
          <button key={s} onClick={() => go(s)} className={`flex flex-col items-center gap-1 text-xs ${active ? "font-bold text-primary" : "text-muted-foreground"}`}>
            <I className={`h-6 w-6 ${active ? "fill-primary" : ""}`} />
            {l}
          </button>
        );
      })}
    </nav>
  );
}

/* ---------- new order ---------- */
function OrderScreen({ go, qty, setQty, extras, setExtras, time, setTime, notes = "", setNotes = () => {}, photos = [], setPhotos = () => {}, setHandover = () => {} }: {
  go: (s: Screen) => void; qty: Record<string, number>; setQty: (q: Record<string, number>) => void;
  extras: string[]; setExtras: (e: string[]) => void;
  time: string; setTime: (t: string) => void;
  notes?: string; setNotes?: (n: string) => void;
  photos?: File[]; setPhotos?: (f: File[]) => void; setHandover?: (h: string) => void;
}) {
  const [door, setDoor] = useState(true);
  const [privacy, setPrivacy] = useState(true);
  const [pick, setPick] = useState(0);
  const [drop, setDrop] = useState(0);
  const [optSheet, setOptSheet] = useState<null | "pick" | "drop">(null);
  useEffect(() => {
    setHandover(`استلام: ${optionAt(PICKUP_OPTS, pick)[0]} · تسليم: ${optionAt(DROP_OPTS, drop)[0]}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pick, drop]);
  const [sheet, setSheet] = useState(false);
  const list = [...MAIN, ...OTHER.filter((o) => extras.includes(o.name))];
  const total = ALL.reduce((s, i) => s + (qty[i.name] || 0) * i.price, 0);
  const set = (n: string, v: number) => setQty({ ...qty, [n]: Math.max(0, v) });

  return (
    <div className="pb-28">
      <Header title="طلب جديد" back={() => go("home")} />
      <div className="px-5">
        <h2 className="mb-3 font-bold">اختر القطع</h2>
        <div className="space-y-3">
          {list.map((i) => (
            <div key={i.name} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
              <div>
                <p className="font-bold">{i.name}</p>
                <p className="text-xs text-muted-foreground">{i.price} ر.س</p>
              </div>
              <Stepper n={qty[i.name] || 0} set={(v) => set(i.name, v)} />
            </div>
          ))}
          <button onClick={() => setSheet(true)} className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-accent p-4 text-right">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground"><Plus className="h-5 w-5" /></span>
            <span className="flex-1">
              <span className="block font-bold">أصناف أخرى</span>
              <span className="text-xs text-muted-foreground">اختر من قائمة الملابس الكاملة</span>
            </span>
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <h2 className="mb-3 mt-7 font-bold">وقت الاستلام</h2>
        <div className="flex gap-2">
          {["اليوم مساءً", "غداً صباحاً", "غداً مساءً"].map((t) => (
            <button key={t} onClick={() => setTime(t)} className={`rounded-full border px-4 py-2.5 text-sm ${time === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
              {t}
            </button>
          ))}
        </div>

        <h2 className="mb-3 mt-7 font-bold">خيارات الاستلام والتسليم</h2>
        <div className="space-y-3">
          <OptionRow icon={Truck} label="الاستلام من" opt={optionAt(PICKUP_OPTS, pick)} onOpen={() => setOptSheet("pick")} />
          <OptionRow icon={MapPin} label="التسليم إلى" opt={optionAt(DROP_OPTS, drop)} onOpen={() => setOptSheet("drop")} />
        </div>

        <h2 className="mb-3 mt-7 font-bold">ملاحظات للمندوب</h2>
        <textarea
          aria-label="ملاحظات للمندوب"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="مثال: الثوب الأبيض بدون نشا، اتصل قبل الوصول"
          rows={3}
          className="w-full rounded-2xl border border-border bg-card p-4 text-sm outline-none focus:border-primary"
        />
        <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-accent p-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground"><Camera className="h-5 w-5" /></span>
          <span className="flex-1">
            <span className="block font-bold">أضف صورة</span>
            <span className="text-xs text-muted-foreground">مثل بقعة أو قطعة تحتاج عناية خاصة</span>
          </span>
          <input type="file" accept="image/*" multiple hidden aria-label="أضف صورة"
            onChange={(e) => setPhotos([...photos, ...Array.from(e.target.files ?? [])].slice(0, 6))} />
        </label>
        {photos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {photos.map((f, i) => (
              <div key={i} className="relative">
                <img src={URL.createObjectURL(f)} alt={`صورة ${i + 1}`} className="h-16 w-16 rounded-xl object-cover" />
                <button onClick={() => setPhotos(photos.filter((_, j) => j !== i))} aria-label="حذف الصورة"
                  className="absolute -left-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-primary p-5 text-primary-foreground">
            <div className="flex-1">
              <p className="font-bold">علّق على الباب</p>
              <p className="text-xs opacity-75">العامل يستلم الكيس بدون ما يطرق الباب</p>
            </div>
            <Toggle on={door} set={setDoor} />
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-accent bg-primary p-5 text-primary-foreground">
            <div className="flex-1">
              <p className="flex items-center gap-1 font-bold"><Lock className="h-4 w-4 text-accent" /> غلاف الخصوصية</p>
              <p className="text-xs opacity-75">نصف الغلاف أسود ولا يبين من ملابسك شيء</p>
            </div>
            <Toggle on={privacy} set={setPrivacy} />
          </div>
        </div>
      </div>

      <Footer>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">الإجمالي</p>
            <p className="text-2xl font-bold">{total} ر.س</p>
          </div>
          <GoldBtn onClick={() => go("payment")} className="px-10">تأكيد الطلب</GoldBtn>
        </div>
      </Footer>

      {sheet && <ExtrasSheet qty={qty} set={set} close={() => setSheet(false)} confirm={(names) => { setExtras([...new Set([...extras, ...names])]); setSheet(false); }} />}
      {optSheet && (
        <OptionSheet
          title={optSheet === "pick" ? "الاستلام: نستلم ملابسك من" : "التسليم: نوصل ملابسك إلى"}
          opts={optSheet === "pick" ? PICKUP_OPTS : DROP_OPTS}
          value={optSheet === "pick" ? pick : drop}
          onPick={(i) => (optSheet === "pick" ? setPick(i) : setDrop(i))}
          close={() => setOptSheet(null)}
        />
      )}
    </div>
  );
}

function OptionRow({ icon: Icon, label, opt, onOpen }: {
  icon: typeof Truck; label: string; opt: [string, string]; onOpen: () => void;
}) {
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-right">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-primary"><Icon className="h-5 w-5 text-accent" /></span>
      <span className="flex-1">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block font-bold">{opt[0]}</span>
        <span className="block text-xs text-muted-foreground">{opt[1]}</span>
      </span>
      <span className="flex items-center gap-1 text-xs font-bold text-accent">تغيير<ChevronLeft className="h-4 w-4" /></span>
    </button>
  );
}

function OptionSheet({ title, opts, value, onPick, close }: {
  title: string; opts: [string, string][]; value: number; onPick: (i: number) => void; close: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 mx-auto flex max-w-md flex-col justify-end bg-primary/50" onClick={close}>
      <div className="rounded-t-3xl bg-background p-5 pb-6" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">{title}</h2>
          <button onClick={close} className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card" aria-label="إغلاق"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 space-y-3">
          {opts.map(([t, d], i) => (
            <button key={t} onClick={() => onPick(i)} className={`flex w-full items-center gap-3 rounded-2xl border-2 bg-card p-4 text-right ${value === i ? "border-accent" : "border-border"}`}>
              <span className="flex-1"><span className="block font-bold">{t}</span><span className="text-xs text-muted-foreground">{d}</span></span>
              <span className={`grid h-7 w-7 place-items-center rounded-full ${value === i ? "bg-accent" : "border-2 border-border"}`}>{value === i && <Check className="h-4 w-4" />}</span>
            </button>
          ))}
        </div>
        <GoldBtn onClick={close} className="mt-5 w-full">تم</GoldBtn>
      </div>
    </div>
  );
}

function ExtrasSheet({ qty, set, close, confirm }: {
  qty: Record<string, number>; set: (n: string, v: number) => void; close: () => void; confirm: (n: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("الكل");
  const shown = OTHER.filter((i) => (cat === "الكل" || i.cat === cat) && i.name.includes(q));
  const picked = OTHER.filter((i) => (qty[i.name] || 0) > 0).map((i) => i.name);
  return (
    <div className="fixed inset-0 z-40 mx-auto flex max-w-md flex-col justify-end bg-primary/50" onClick={close}>
      <div className="max-h-[85vh] overflow-y-auto rounded-t-3xl bg-background p-5 pb-6" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl font-bold">أصناف أخرى</h2>
          <button onClick={close} className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card" aria-label="إغلاق"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن صنف" className="flex-1 bg-transparent outline-none" />
        </div>
        <div className="mt-4 flex gap-2">
          {["الكل", "رجالي", "نسائي", "مفروشات"].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-4 py-2 text-sm ${cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{c}</button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {shown.map((i) => (
            <div key={i.name} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
              <div><p className="font-bold">{i.name}</p><p className="text-xs text-muted-foreground">{i.price} ر.س</p></div>
              <Stepper n={qty[i.name] || 0} set={(v) => set(i.name, v)} />
            </div>
          ))}
        </div>
        <GoldBtn onClick={() => confirm(picked)} className="mt-5 w-full">
          {picked.length ? `إضافة ${picked.length} صنف إلى الطلب` : "تم"}
        </GoldBtn>
      </div>
    </div>
  );
}

/* ---------- payment ---------- */
const PAY_LABEL: Record<string, string> = {
  cash: "كاش عند الاستلام", mada: "بطاقة مدى", apple: "Apple Pay", samsung: "Samsung Wallet", tabby: "تابي", tamara: "تمارا",
};
function PaymentScreen({ go, onPaid }: { go: (s: Screen) => void; onPaid: (m: string) => void }) {
  const [method, setMethod] = useState("cash");
  const [plan, setPlan] = useState<Record<string, string>>({ tabby: "مقدماً", tamara: "مع الراتب" });
  const opt = (id: string, Icon: typeof Banknote, t: string, d: string, side?: ReactNode) => (
    <button onClick={() => setMethod(id)} className={`flex w-full items-center gap-3 rounded-2xl border-2 bg-card p-4 text-right ${method === id ? "border-accent" : "border-border"}`}>
      <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary"><Icon className="h-5 w-5" /></span>
      <span className="flex-1"><span className="block font-bold">{t}</span><span className="text-xs text-muted-foreground">{d}</span></span>
      {side ?? (method === id && <span className="grid h-7 w-7 place-items-center rounded-full bg-accent"><Check className="h-4 w-4" /></span>)}
    </button>
  );
  return (
    <div className="pb-28">
      <Header title="طرق الدفع" back={() => go("order")} />
      <div className="space-y-3 px-5">
        {opt("cash", Banknote, "كاش عند الاستلام", "ادفع للمندوب عند التسليم")}
        {opt("mada", CreditCard, "بطاقة مدى", "أضف بطاقتك للدفع السريع", <span className="rounded-full bg-accent px-4 py-2 text-sm font-bold">+ إضافة بطاقة</span>)}
        <p className="pt-3 text-sm font-bold text-muted-foreground">المحافظ الرقمية</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setMethod("apple")} className={`rounded-2xl bg-primary py-4 font-bold text-primary-foreground ${method === "apple" ? "ring-4 ring-accent" : ""}`}>Apple Pay</button>
          <button onClick={() => setMethod("samsung")} className={`rounded-2xl bg-primary py-4 font-bold text-primary-foreground ${method === "samsung" ? "ring-4 ring-accent" : ""}`}>Samsung Wallet</button>
        </div>
        <p className="pt-3 text-sm font-bold text-muted-foreground">قسّم دفعتك</p>
        {([["tabby", "تابي | Tabby", "قسّم على ٤ دفعات"], ["tamara", "تمارا | Tamara", "قسّم على دفعات"]] as const).map(([id, n, d]) => (
          <div key={id} onClick={() => setMethod(id)} className={`rounded-2xl border-2 bg-card p-4 ${method === id ? "border-accent" : "border-border"}`}>
            <div className="flex justify-between"><span className="font-bold">{n}</span><span className="text-xs text-muted-foreground">{d}</span></div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {["مقدماً", "مع الراتب"].map((p) => (
                <button key={p} onClick={() => setPlan({ ...plan, [id]: p })} className={`rounded-full border py-3 text-sm ${plan[id] === p ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>ادفع {p}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Footer><GoldBtn onClick={() => { onPaid(PAY_LABEL[method] ?? "كاش عند الاستلام"); go("done"); }} className="w-full">تأكيد طريقة الدفع</GoldBtn></Footer>
    </div>
  );
}

/* ---------- order received ---------- */
function DoneScreen({ go, qty, time, payMethod, orderId }: {
  go: (s: Screen) => void; qty: Record<string, number>; time: string; payMethod: string; orderId?: string | null;
}) {
  const pieces = ALL.reduce((s, i) => s + (qty[i.name] || 0), 0);
  const total = ALL.reduce((s, i) => s + (qty[i.name] || 0) * i.price, 0);
  const rows = [["القطع", `${pieces} قطعة`], ["الإجمالي", `${total} ر.س`], ["طريقة الدفع", payMethod], ["موعد الاستلام", time]];
  return (
    <div className="px-5 pb-10 pt-16 text-center">
      <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-success text-success-foreground shadow-soft ring-8 ring-success/15">
        <Check className="h-14 w-14" strokeWidth={3} />
      </div>
      <h1 className="mt-6 font-display text-4xl font-bold">تم استلام طلبك</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        استلم مندوبنا ملابسك من بابك وبدأنا الغسيل والكي
        <br /> رقم طلبك <b className="text-foreground">{orderId ?? "1042"}</b>
      </p>
      <div className="mt-8 space-y-3 rounded-3xl bg-primary p-5 text-right text-primary-foreground">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between text-sm">
            <span className="opacity-75">{k}</span><span className="font-bold">{v}</span>
          </div>
        ))}
      </div>
      <GoldBtn onClick={() => go("track")} className="mt-7 w-full">تتبع الطلب</GoldBtn>
      <button onClick={() => go("home")} className="mt-3 w-full rounded-full border-2 border-accent bg-card py-3.5 font-bold active:scale-[0.98]">
        العودة للرئيسية
      </button>
      <p className="mt-5 text-xs text-muted-foreground">يصلك إشعار فور وصول المندوب إلى بابك.</p>
    </div>
  );
}

/* ---------- tracking ---------- */
function TrackScreen({ go, orderId }: { go: (s: Screen) => void; orderId?: string | null }) {
  const live = useOrder(orderId ?? null);
  const steps = [["تم الاستلام من الباب", 1], ["الغسيل", 1], ["الكي والتغليف", 1], ["في الطريق إليك", 0.5], ["التسليم على بابك", 0]] as const;
  return (
    <div className="pb-8">
      <Header title="تتبع الطلب" back={() => go("home")} extra={<span className="text-sm text-muted-foreground">رقم {live?.id ?? "1042"}</span>} />
      <div className="px-5">
        {live && (
          <div className="mb-4 rounded-2xl border-2 border-accent bg-card p-4">
            <p className="text-xs text-muted-foreground">حالة المندوب الآن (مباشر)</p>
            <p className="mt-1 font-display text-2xl font-bold">{live.kind === "pickup" && live.step === 3 ? "طلبك في المغسلة" : stepLabel(live)}</p>
            <div className="mt-3 flex gap-1.5">
              {(live.kind === "drop" ? DROP_STEPS : PICKUP_STEPS).map((st, i) => <span key={st} className={`h-1.5 flex-1 rounded-full ${i <= live.step ? "bg-accent" : "bg-border"}`} />)}
            </div>
          </div>
        )}
        <div className="rounded-3xl bg-primary p-6 text-primary-foreground">
          <div className="flex justify-between text-sm">
            <span className="text-accent">الحالة الآن</span>
            <span className="text-left"><b>عميل ناصع</b></span>
          </div>
          <p className="mt-2 font-display text-4xl font-bold">في الطريق إليك</p>
          <p className="mt-1 text-sm opacity-80">الوصول المتوقع بعد ٢٠ دقيقة</p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm"><Users className="h-4 w-4 text-accent" /> ٣ عملاء قبلك على مسار المندوب</span>
          <div className="mt-5 h-1.5 rounded-full bg-primary-foreground/20"><div className="h-full w-4/5 rounded-full bg-accent" /></div>
        </div>
        <ol className="mt-6 space-y-0">
          {steps.map(([t, s], i) => (
            <li key={t} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <span className={`grid h-8 w-8 place-items-center rounded-full ${s === 1 ? "bg-accent" : s ? "border-2 border-accent" : "border-2 border-border"}`}>{s === 1 && <Check className="h-4 w-4" />}</span>
                {i < steps.length - 1 && <span className={`h-8 w-0.5 ${s === 1 ? "bg-accent" : "bg-border"}`} />}
              </div>
              <span className={`pt-1 ${s ? "font-bold" : "text-muted-foreground"}`}>{t}</span>
            </li>
          ))}
        </ol>
        <DriverCard />
        <button onClick={() => go("map")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border-2 border-accent bg-primary py-4 font-bold text-primary-foreground">
          <MapPin className="h-5 w-5 text-accent" /> تتبع المندوب على الخريطة
        </button>
      </div>
    </div>
  );
}
function DriverCard({ chat }: { chat?: boolean }) {
  return (
    <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary"><User className="h-5 w-5" /></span>
      <div className="flex-1"><p className="text-xs text-muted-foreground">مندوب التوصيل</p><p className="font-bold">خالد العتيبي</p></div>
      {chat && <button className="grid h-12 w-12 place-items-center rounded-full border-2 border-accent" aria-label="رسالة"><MessageSquare className="h-5 w-5" /></button>}
      <a href="tel:0500000000" className="grid h-12 w-12 place-items-center rounded-full bg-accent" aria-label="اتصال"><Phone className="h-5 w-5" /></a>
    </div>
  );
}

function MapScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <div>
      <div className="relative h-[52vh] overflow-hidden bg-map">
        <div className="absolute inset-0 grid grid-cols-3 gap-6 p-6">
          {Array.from({ length: 9 }).map((_, i) => <div key={i} className="rounded-xl bg-map-block" />)}
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <polyline points="25,80 25,70 50,70 50,45 80,45 80,20" fill="none" className="stroke-accent" strokeWidth="1.5" />
        </svg>
        <span className="absolute left-[80%] top-[14%] -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">بيتك</span>
        <span className="absolute left-[80%] top-[20%] grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent"><Home className="h-4 w-4" /></span>
        <span className="absolute left-[25%] top-[80%] grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-accent bg-primary text-accent"><Truck className="h-5 w-5" /></span>
        <div className="absolute inset-x-5 top-8 flex items-center gap-3">
          <button onClick={() => go("track")} className="grid h-11 w-11 place-items-center rounded-full bg-card" aria-label="رجوع"><ChevronRight className="h-5 w-5" /></button>
          <span className="rounded-full bg-card px-5 py-2.5 font-bold">تتبع المندوب</span>
        </div>
      </div>
      <div className="-mt-6 rounded-t-3xl bg-background p-5 relative">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
        <div className="flex items-end justify-between">
          <div><p className="text-sm text-muted-foreground">الوصول المتوقع</p><p className="font-display text-4xl font-bold">١٨ دقيقة</p></div>
          <span className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">٣ عملاء قبلك</span>
        </div>
        <DriverCard chat />
        <div className="mt-5 flex items-center justify-between px-2 text-xs">
          {["عميل ١", "عميل ٢", "عميل ٣", "أنت"].map((c, i) => (
            <div key={c} className="flex flex-col items-center gap-1">
              <span className={`grid h-9 w-9 place-items-center rounded-full ${i === 0 ? "bg-accent" : i === 3 ? "bg-primary text-primary-foreground" : "border-2 border-accent"}`}>
                {i === 0 ? <Check className="h-4 w-4" /> : i === 3 ? <Home className="h-4 w-4" /> : i + 1}
              </span>
              <span className={i === 1 || i === 3 ? "font-bold" : "text-muted-foreground"}>{c}</span>
            </div>
          ))}
        </div>
        <p className="mt-5 rounded-2xl bg-primary p-4 text-sm text-primary-foreground">ستجد الكيس معلقاً على بابك، وسيصلك إشعار فور وصوله.</p>
      </div>
    </div>
  );
}

/* ---------- invoice ---------- */
function InvoiceModal({ close }: { close: () => void }) {
  const lines = [["ثوب × ٢", "٨"], ["شماغ × ١", "٤"], ["ملابس رياضية × ٣", "١٢"]];
  return (
    <div dir="rtl" className="fixed inset-0 z-50 mx-auto flex max-w-md items-center bg-primary/60 p-5" onClick={close}>
      <div className="w-full rounded-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div><h2 className="font-display text-3xl font-bold">الفاتورة</h2><p className="text-xs text-muted-foreground">رقم 1042 · 29 أكتوبر 2026</p></div>
          <button onClick={close} className="grid h-11 w-11 place-items-center rounded-full border border-border" aria-label="إغلاق"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-3 flex justify-between text-sm"><span>أحمد · اشتراك 5521</span><span className="rounded-full bg-secondary px-3 py-1 font-bold">مدفوعة</span></div>
        <div className="my-4 border-t-2 border-dashed border-accent/50" />
        {lines.map(([a, b]) => <div key={a} className="flex justify-between py-1.5"><span>{a}</span><span>{b} ر.س</span></div>)}
        <div className="my-4 border-t-2 border-dashed border-accent/50" />
        <div className="flex justify-between"><span>الإجمالي شامل الضريبة</span><span className="text-2xl font-bold">٢٤ ر.س</span></div>
        <div className="mt-2 flex justify-between text-sm text-muted-foreground"><span>طريقة الدفع</span><span>كاش</span></div>
        <div className="mx-auto mt-4 flex h-12 w-3/4 gap-[3px]">
          {Array.from({ length: 34 }).map((_, i) => <span key={i} className="flex-1 bg-primary" style={{ opacity: (i * 7) % 3 ? 1 : 0 }} />)}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button className="rounded-full border-2 border-accent py-3 font-bold">إبلاغ عن ملاحظة</button>
          <GoldBtn onClick={() => window.print()}>تحميل PDF</GoldBtn>
        </div>
      </div>
    </div>
  );
}

/* ---------- tabs ---------- */
function OrdersScreen({ go, orderId }: { go: (s: Screen) => void; orderId?: string | null; openInvoice?: () => void }) {
  const live = useOrder(orderId ?? null);
  return (
    <div className="px-5 pt-8">
      <h1 className="font-display text-3xl font-bold">طلباتي</h1>
      {live ? (
        <button onClick={() => go("track")} className="mt-5 flex w-full items-center gap-3 rounded-2xl border-2 border-accent bg-card p-4 text-right">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary"><Truck className="h-5 w-5 text-accent" /></span>
          <span className="flex-1">
            <span className="block font-bold">تتبع الطلب</span>
            <span className="block text-xs text-muted-foreground">طلب {live.id} · {stepLabel(live)} · {live.total} ر.س</span>
          </span>
          <ChevronLeft className="h-5 w-5" />
        </button>
      ) : (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-secondary"><Receipt className="h-8 w-8 text-muted-foreground" /></span>
          <p className="font-display text-lg">لا توجد طلبات بعد</p>
          <GoldBtn onClick={() => go("order")}>اطلب استلام الآن</GoldBtn>
        </div>
      )}
    </div>
  );
}

function OffersScreen() {
  const offers = [
    ["غسيل الثوب", "سعر موحد للقطعة الواحدة", "٤ ريال"],
    ["غسيل الشماغ", "سعر موحد للقطعة الواحدة", "٤ ريال"],
    ["الملابس الرياضية", "سعر موحد للقطعة الواحدة", "٤ ريال"],
    ["خصم الاشتراك الشهري", "على جميع الطلبات للمشتركين", "١٠٪ خصم"],
    ["توصيل مجاني", "للطلبات التي تتجاوز ٥٠ ر.س", "مجاني"],
  ];
  return (
    <div className="px-5 pt-8">
      <h1 className="font-display text-3xl font-bold">العروض والخصومات</h1>
      <div className="mt-5 space-y-3">
        {offers.map(([t, d, p], i) => (
          <div key={t} className={`flex items-center justify-between rounded-2xl p-5 ${i === 3 ? "bg-primary text-primary-foreground" : "border border-border bg-card"}`}>
            <div><p className="font-bold">{t}</p><p className="text-xs opacity-70">{d}</p></div>
            <span className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground">{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountScreen({ go }: { go: (s: Screen) => void; openInvoice?: () => void }) {
  return (
    <div className="px-5 pt-8">
      <h1 className="font-display text-3xl font-bold">حسابي</h1>
      <div className="mt-5 flex items-center gap-4 rounded-3xl bg-primary p-5 text-primary-foreground">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground"><User className="h-6 w-6" /></span>
        <div className="flex-1"><p className="text-lg font-bold">عميل ناصع</p><p className="text-xs opacity-75">لا يوجد اشتراك</p></div>
      </div>
      <h2 className="mb-2 mt-6 font-bold">معلومات التواصل</h2>
      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        {["رقم الجوال", "البريد الإلكتروني", "العنوان"].map((v) => (
          <input key={v} placeholder={v} dir="auto" className="w-full bg-transparent p-4 outline-none" />
        ))}
      </div>
      <button onClick={() => go("delivery")} className="mt-4 flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4">
        <span className="font-bold">خيارات التسليم</span><ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
}

function DeliveryScreen({ go }: { go: (s: Screen) => void }) {
  const [pick, setPick] = useState(0);
  const [drop, setDrop] = useState(0);
  const [saved, setSaved] = useState(false);
  const group = (opts: string[][], v: number, set: (n: number) => void) => (
    <div className="space-y-3">
      {opts.map(([t, d], i) => (
        <button key={t} onClick={() => set(i)} className={`flex w-full items-center gap-3 rounded-2xl border-2 bg-card p-4 text-right ${v === i ? "border-accent" : "border-border"}`}>
          <span className="flex-1"><span className="block font-bold">{t}</span><span className="text-xs text-muted-foreground">{d}</span></span>
          <span className={`grid h-7 w-7 place-items-center rounded-full ${v === i ? "bg-accent" : "border-2 border-border"}`}>{v === i && <Check className="h-4 w-4" />}</span>
        </button>
      ))}
    </div>
  );
  return (
    <div>
      <Header title="خيارات التسليم" back={() => go("account")} />
      <div className="px-5">
        <h2 className="mb-3 font-bold">الاستلام: نستلم ملابسك من</h2>
        {group(PICKUP_OPTS, pick, setPick)}
        <h2 className="mb-3 mt-6 font-bold">التوصيل: نوصل ملابسك إلى</h2>
        {group(DROP_OPTS, drop, setDrop)}
        <GoldBtn onClick={() => setSaved(true)} className="mt-6 w-full">{saved ? "تم الحفظ ✓" : "حفظ الخيارات"}</GoldBtn>
      </div>
    </div>
  );
}
