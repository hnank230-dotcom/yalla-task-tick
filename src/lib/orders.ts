import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Shared order record: the customer app creates it, the driver app advances `step`.
export type Order = {
  id: string; kind: "pickup" | "drop"; customer: string; phone: string; area: string;
  time: string; pieces: number; handover: string; total: number; paid: boolean; step: number;
  notes?: string; photos?: string[]; privacy?: boolean; received?: boolean; pay_method?: string; created_at?: string;
};

// handover is stored as "استلام: X · تسليم: Y"
export function splitHandover(h: string) {
  const m = h.match(/استلام:\s*(.+?)\s*·\s*تسليم:\s*(.+)/);
  return m ? { pick: m[1], drop: m[2] } : { pick: h, drop: h };
}

export async function confirmReceived(id: string) {
  await supabase.from("orders").update({ received: true }).eq("id", id);
}

// Laundry confirms the bag arrived (pickup orders reuse `received`).
export async function laundryReceive(id: string) {
  await supabase.from("orders").update({ received: true }).eq("id", id);
}

export const PICKUP_STEPS = ["جديد", "في الطريق", "وصلت", "تم الاستلام"];
export const DROP_STEPS = ["جاهز", "في الطريق", "وصلت", "تم التسليم"];
export const stepLabel = (o: Pick<Order, "kind" | "step">) => (o.kind === "drop" ? DROP_STEPS : PICKUP_STEPS)[o.step];

const BUCKET = "order-photos";
export async function uploadPhotos(files: File[]): Promise<string[]> {
  const paths: string[] = [];
  for (const f of files) {
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${f.name.split(".").pop() || "jpg"}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, f, { contentType: f.type });
    if (!error) paths.push(path);
  }
  return paths;
}
export async function photoUrls(paths: string[]): Promise<string[]> {
  if (!paths.length) return [];
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
  return (data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[];
}
// Laundry finished cleaning: the order becomes a delivery task for the driver.
export async function sendToDelivery(id: string) {
  await supabase.from("orders").update({ kind: "drop", step: 0, received: false }).eq("id", id);
}

const toOrder = (r: Record<string, unknown>): Order => ({ ...(r as Order), total: Number(r["total"]) });

export async function createOrder(o: Pick<Order, "time" | "pieces" | "total" | "paid" | "handover"> & { notes?: string; photos?: string[]; privacy?: boolean; pay_method?: string }): Promise<string> {
  const id = `N-${Math.floor(1000 + Math.random() * 9000)}`;
  const { error } = await supabase.from("orders").insert({ id, kind: "pickup", step: 0, ...o });
  if (error) throw error;
  return id;
}

export async function advanceOrder(o: Order) {
  // Driver flow: 0 -> 1 (في الطريق, then barcode) -> 3 (تم الاستلام/التسليم).
  const step = o.step === 0 ? 1 : 3;
  await supabase.from("orders").update({ step, paid: step === 3 ? true : o.paid }).eq("id", o.id);
}

function useLive(load: () => Promise<void>, key: string) {
  useEffect(() => {
    void load();
    const ch = supabase
      .channel(`orders-${key}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  useLive(async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50);
    setOrders((data ?? []).map((r) => toOrder(r as Record<string, unknown>)));
  }, "all");
  return orders;
}

export function useOrder(id: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  useLive(async () => {
    if (!id) return setOrder(null);
    const { data } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
    setOrder(data ? toOrder(data as Record<string, unknown>) : null);
  }, id ?? "none");
  return order;
}

export function useMyOrders(ids: string[]) {
  const [orders, setOrders] = useState<Order[]>([]);
  useLive(async () => {
    if (!ids.length) return setOrders([]);
    const { data } = await supabase.from("orders").select("*").in("id", ids).order("created_at", { ascending: false });
    setOrders((data ?? []).map((r) => toOrder(r as Record<string, unknown>)));
  }, ids.join(",") || "none");
  return orders;
}
