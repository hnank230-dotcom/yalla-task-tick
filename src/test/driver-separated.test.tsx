import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";

import { Route } from "@/routes/driver";

const DriverApp = Route.options.component as React.ComponentType;
const customerSource = readFileSync("src/routes/index.tsx", "utf8");
const driverSource = readFileSync("src/routes/driver.tsx", "utf8");

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
});

describe("Driver task list shows real orders only", () => {
  it("has no seed tasks in the source", () => {
    expect(driverSource).not.toContain("SEED");
    expect(driverSource).not.toContain("عبدالله السالم");
    expect(driverSource).not.toContain("فهد العتيبي");
  });

  it("keeps nothing in local storage", () => {
    expect(driverSource).not.toContain("localStorage");
    render(<DriverApp />);
    expect(Object.keys(localStorage)).toEqual([]);
  });

  it("shows a clear empty state when there are no orders", () => {
    render(<DriverApp />);
    expect(screen.getByText("لا توجد طلبات حاليًا")).toBeInTheDocument();
    expect(screen.getByText(/أي طلب جديد من العملاء يظهر هنا فورًا/)).toBeInTheDocument();
  });
});
