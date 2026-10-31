import { describe, expect, it } from "vitest";
import { splitHandover } from "@/lib/orders";
describe("driver sees pickup and delivery methods separately", () => {
  it("splits the stored handover text", () => {
    expect(splitHandover("استلام: السلة الرئيسية · تسليم: يد بيد")).toEqual({ pick: "السلة الرئيسية", drop: "يد بيد" });
  });
});
