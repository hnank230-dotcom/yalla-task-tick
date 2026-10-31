import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Shared order record: the customer app creates it, the driver app advances `step`.
export type Order = {
  id: string; kind: "pickup" | "drop"; customer: string; phone: string; area: string;
  time: string; pieces: number; handover: string; total: number; paid: boolean; step: number;
  notes?: string;
};

export const PICKUP_STEPS = ["جديد", "في الطريق", "وصلت", "تم الاستلام"];

const toOrder = (r: Record<string, unknown>): Order => ({ ...(r as Order), total: Number(r["total"]) });

export async function createOrder(o: Pick<Order, "time" | "pieces" | "total" | "paid" | "handover"> & { notes?: string }): Promise<string> {
  const id = `N-${Math.floor(1000 + Math.random() * 9000)}`;
  const { error } = await supabase.from("orders").insert({ id, kind: "pickup", step: 0, ...o });
  if (error) throw error;
  return id;
}

export async function advanceOrder(o: Order) {
  const step = Math.min(o.step + 1, 3);
  await supabase.from("orders").update({ step, paid: o.step === 2 ? true : o.paid }).eq("id", o.id);
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
