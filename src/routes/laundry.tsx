import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useOrders, photoUrls, sendToDelivery, type Order } from "@/lib/orders";
import logo from "@/assets/naseg-logo.png";
import { Inbox, StickyNote, Image as ImageIcon, X, Truck, Shirt } from "lucide-react";

export const Route = createFileRoute("/laundry")({
  head: () => ({
    meta: [
      { title: "ناصع للمغسلة — الطلبات المستلمة" },
      { name: "description", content: "لوحة مغسلة ناصع: الطلبات التي استلمها المندوب مع ملاحظات العملاء وصورهم." },
      { property: "og:title", content: "ناصع للمغسلة" },
      { property: "og:description", content: "الطلبات المستلمة مع الملاحظات والصور." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LaundryApp,
});

function LaundryApp() {
  const all = useOrders();
  // Every new customer order shows here immediately; past = already sent out for delivery.
  const current = all.filter((o) => o.kind === "pickup");
  const past = all.filter((o) => o.kind === "drop");
  const inHouse = current.filter((o) => o.step === 3).length;
  const [tab, setTab] = useState<"now" | "past">("now");
  const [gallery, setGallery] = useState<string[] | null>(null);
  const list = tab === "now" ? current : past;

  return (
    <div dir="rtl" className="mx-auto min-h-screen max-w-3xl bg-background pb-10 font-sans">
      <header className="rounded-b-3xl bg-primary px-5 pb-6 pt-8 text-primary-foreground">
        <h1 className="flex items-center gap-2 font-display text-2xl"><img src={logo} alt="ناصع" className="h-12 w-12 rounded-xl bg-card object-contain p-1" /><span className="text-accent">للمغسلة</span></h1>
        <p className="mt-1 text-sm opacity-70">كل الطلبات من لحظة طلب العميل</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary-foreground/10 px-4 py-2">
          <span className="font-display text-xl text-accent">{inHouse}</span><span className="text-sm">في المغسلة</span>
          <span className="font-display text-xl text-accent">· {current.length - inHouse}</span><span className="text-sm">بانتظار المندوب</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {([["now", `الطلبات الحالية (${current.length})`], ["past", `الطلبات السابقة (${past.length})`]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-xl py-2 text-sm font-bold ${tab === k ? "bg-accent text-accent-foreground" : "bg-primary-foreground/10"}`}>{l}</button>
          ))}
        </div>
      </header>

      <main className="space-y-3 px-4 pt-4">
        {list.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-secondary"><Inbox className="size-8 text-muted-foreground" /></span>
            <p className="font-display text-lg">{tab === "now" ? "لا توجد طلبات حاليًا" : "لا توجد طلبات سابقة"}</p>
            <p className="text-sm text-muted-foreground">أي طلب جديد من العميل يظهر هنا فورًا.</p>
          </div>
        ) : list.map((o) => <OrderCard key={o.id} o={o} onPhotos={setGallery} />)}
      </main>

      {gallery && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-primary/90 p-4" onClick={() => setGallery(null)}>
          <button aria-label="إغلاق" className="mb-3 grid size-10 place-items-center rounded-full bg-card"><X className="size-5" /></button>
          <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
            {gallery.map((u) => <img key={u} src={u} alt="صورة العميل" className="w-full rounded-2xl" />)}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({ o, onPhotos }: { o: Order; onPhotos: (u: string[]) => void }) {
  const [urls, setUrls] = useState<string[]>([]);
  const paths = o.photos ?? [];
  const isDrop = o.kind === "drop";
  const atLaundry = o.kind === "pickup" && o.step === 3;
  useEffect(() => { void photoUrls(paths).then(setUrls); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths.join(",")]);
  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg">طلب {o.id}</p>
        <span className="flex items-center gap-1 text-sm text-muted-foreground"><Shirt className="size-4" />{o.pieces} قطع · {o.total} ر.س</span>
      </div>
      <p className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${atLaundry || isDrop ? "bg-success text-success-foreground" : "bg-accent text-accent-foreground"}`}>
        {isDrop ? `أُرسل للتسليم · ${o.received ? "استلمه العميل" : o.step === 3 ? "تم التسليم" : "مع المندوب"}` : atLaundry ? "استلمه المندوب ✓ — في المغسلة" : `لم يستلمه المندوب بعد · ${["جديد", "المندوب في الطريق", "المندوب وصل للعميل"][o.step]}`}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{o.customer} · {o.handover}</p>
      <p className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${o.privacy ? "bg-success text-success-foreground" : "bg-secondary text-muted-foreground"}`}>كيس الخصوصية: {o.privacy ? "مفعّل" : "غير مفعّل"}</p>
      <div className="mt-3 rounded-xl border border-accent p-3">
        <p className="flex items-center gap-1 text-sm font-bold"><StickyNote className="size-4 text-accent" />ملاحظات العميل</p>
        <p className="mt-1 text-sm">{o.notes || "لا توجد ملاحظات"}</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button disabled={!urls.length} onClick={() => onPhotos(urls)}
          className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm disabled:opacity-50">
          <ImageIcon className="size-4" />{urls.length ? `مشاهدة الصور (${urls.length})` : "لا توجد صور"}
        </button>
        {isDrop ? null : (
          <button disabled={!atLaundry} onClick={() => void sendToDelivery(o.id)} className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm text-primary-foreground disabled:opacity-40">
            <Truck className="size-4" />جاهز — أرسل للتسليم
          </button>
        )}
      </div>
    </div>
  );
}
