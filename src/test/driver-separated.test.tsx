import { readFileSync } from "node:fs";
import { render, screen, fireEvent, beforeEach } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Route } from "@/routes/driver";

const DriverApp = Route.options.component as React.ComponentType;
const customerSource = readFileSync("src/routes/index.tsx", "utf8");
const driverSource = readFileSync("src/routes/driver.tsx", "utf8");
const KEY = "naseg-driver-v1";

const openTask = (name: string) => fireEvent.click(screen.getByRole("button", { name: new RegExp(name) }));

describe("Driver app is its own app", () => {
  beforeEach(() => localStorage.clear());

  it("gives the customer app no way into the driver app", () => {
    expect(customerSource).not.toContain("/driver");
    expect(customerSource).not.toContain("تطبيق المندوب");
  });

  it("gives the driver app no way back into the customer app", () => {
    render(<DriverApp />);
    expect(driverSource).not.toContain('to="/"');
    expect(screen.queryByRole("link", { name: /العودة/ })).not.toBeInTheDocument();
    expect(screen.queryByText("تطبيق العميل")).not.toBeInTheDocument();
  });

  it("saves the driver's progress under its own key only", () => {
    render(<DriverApp />);
    openTask("عبدالله السالم");
    fireEvent.click(screen.getByRole("button", { name: "ابدأ التوجه للعميل" }));

    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") as { tasks: { id: string; step: number }[] };
    expect(saved.tasks.find((t) => t.id === "N-1042")?.step).toBe(1);
    expect(Object.keys(localStorage)).toEqual([KEY]);
  });

  it("reopens the driver's saved day instead of the starting list", () => {
    localStorage.setItem(KEY, JSON.stringify({
      online: true,
      tasks: [{ id: "N-1042", kind: "pickup", customer: "عبدالله السالم", phone: "0500000001", area: "حي النرجس", time: "4:00 م", pieces: 6, handover: "تعليقة الباب", total: 24, paid: true, step: 3 }],
    }));
    render(<DriverApp />);

    expect(screen.getByText("تم الاستلام")).toBeInTheDocument();
    expect(screen.queryByText("فهد العتيبي")).not.toBeInTheDocument();
  });
});
