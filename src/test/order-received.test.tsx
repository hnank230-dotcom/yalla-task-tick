import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Route } from "@/routes/index";

const App = Route.options.component as React.ComponentType;

const toPayment = () => {
  fireEvent.click(screen.getByRole("button", { name: "اطلب استلام الآن" }));
  fireEvent.click(screen.getByRole("button", { name: "تأكيد الطلب" }));
};

describe("Order received page", () => {
  it("opens after the payment method is confirmed and says the order was received", () => {
    render(<App />);
    toPayment();
    fireEvent.click(screen.getByRole("button", { name: "تأكيد طريقة الدفع" }));

    expect(screen.getByText("تم استلام طلبك")).toBeInTheDocument();
    expect(screen.getByText(/رقم طلبك/)).toBeInTheDocument();
    // the old tracking screen must not be what we landed on
    expect(screen.queryByText("الحالة الآن")).not.toBeInTheDocument();
  });

  it("keeps the green success mark on the confirmation", () => {
    render(<App />);
    toPayment();
    fireEvent.click(screen.getByRole("button", { name: "تأكيد طريقة الدفع" }));

    const mark = document.querySelector(".bg-success");
    expect(mark).not.toBeNull();
    expect(mark?.className).toContain("text-success-foreground");
  });

  it("shows the payment method the customer actually picked", () => {
    render(<App />);
    toPayment();
    fireEvent.click(screen.getByRole("button", { name: "Apple Pay" }));
    fireEvent.click(screen.getByRole("button", { name: "تأكيد طريقة الدفع" }));

    expect(screen.getByText("طريقة الدفع")).toBeInTheDocument();
    expect(screen.getByText("Apple Pay")).toBeInTheDocument();
    expect(screen.queryByText("كاش عند الاستلام")).not.toBeInTheDocument();
  });

  it("carries the chosen pickup time and the real total into the confirmation", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "اطلب استلام الآن" }));
    const [morning] = screen.getAllByRole("button", { name: /غداً/ });
    if (!morning) throw new Error("pickup time chips missing");
    const label = morning.textContent ?? "";
    fireEvent.click(morning);
    fireEvent.click(screen.getByRole("button", { name: "تأكيد الطلب" }));
    fireEvent.click(screen.getByRole("button", { name: "تأكيد طريقة الدفع" }));

    // default qty: ثوب ×2 (8) + شماغ ×1 (4) = 12 ر.س
    expect(screen.getByText("12 ر.س")).toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("hands over to tracking from the confirmation", () => {
    render(<App />);
    toPayment();
    fireEvent.click(screen.getByRole("button", { name: "تأكيد طريقة الدفع" }));
    fireEvent.click(screen.getByRole("button", { name: "تتبع الطلب" }));

    expect(screen.getByText("الحالة الآن")).toBeInTheDocument();
  });
});

describe("My Orders — track option", () => {
  it("offers a track-order button above the previous invoices", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "طلباتي" }));

    const track = screen.getByRole("button", { name: /تتبع الطلب/ });
    const invoices = screen.getByText("فواتيري السابقة");
    // track must come before the invoices heading in the page
    expect(track.compareDocumentPosition(invoices) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(track);
    expect(screen.getByText("الحالة الآن")).toBeInTheDocument();
  });
});
