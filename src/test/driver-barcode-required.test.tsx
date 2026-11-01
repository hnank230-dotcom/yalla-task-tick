import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/orders", () => ({
  useOrders: () => [{ id: "N-9", kind: "pickup", customer: "عميل واصل", phone: "1", area: "حي", time: "اليوم", pieces: 2, handover: "استلام: يد بيد · تسليم: يد بيد", total: 8, paid: true, step: 2 }],
  advanceOrder: vi.fn(),
  splitHandover: () => ({ pick: "يد بيد", drop: "يد بيد" }),
}));

import { Route } from "@/routes/driver";
const DriverApp = Route.options.component as React.ComponentType;

describe("barcode is required before confirming", () => {
  it("keeps the confirm-pickup button locked until the barcode is photographed", () => {
    render(<DriverApp />);
    fireEvent.click(screen.getByText("عميل واصل"));
    expect(screen.getByRole("button", { name: "تأكيد استلام القطع" })).toBeDisabled();
  });
});
