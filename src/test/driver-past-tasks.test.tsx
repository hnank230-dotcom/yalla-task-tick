import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const base = { kind: "pickup", phone: "0500000000", area: "حي النرجس", time: "اليوم", pieces: 3, handover: "تعليقة الباب", total: 12, paid: true };
vi.mock("@/lib/orders", () => ({
  useOrders: () => [
    { ...base, id: "N-1", customer: "عميل جاري", step: 1, notes: "اتصل قبل الوصول" },
    { ...base, id: "N-2", customer: "عميل منتهي", step: 3 },
  ],
  advanceOrder: vi.fn(),
}));

import { Route } from "@/routes/driver";
const DriverApp = Route.options.component as React.ComponentType;

describe("Finished tasks move to المهام السابقة", () => {
  it("removes a finished task from the live list", () => {
    render(<DriverApp />);
    expect(screen.getByText("عميل جاري")).toBeInTheDocument();
    expect(screen.queryByText("عميل منتهي")).not.toBeInTheDocument();
  });

  it("shows the finished task under السابقة", () => {
    render(<DriverApp />);
    fireEvent.click(within(screen.getByRole("navigation")).getByText("السابقة"));
    expect(screen.getByText("عميل منتهي")).toBeInTheDocument();
    expect(screen.queryByText("عميل جاري")).not.toBeInTheDocument();
  });

  it("shows customer notes under التعليمات", () => {
    render(<DriverApp />);
    fireEvent.click(within(screen.getByRole("navigation")).getByText("التعليمات"));
    expect(screen.getByText("اتصل قبل الوصول")).toBeInTheDocument();
  });
});
