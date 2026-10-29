import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Route } from "@/routes/index";

const App = Route.options.component as React.ComponentType;

describe("New order — pickup & delivery options", () => {
  it("shows pickup and delivery selectors after the pickup time", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "اطلب استلام الآن" }));

    expect(screen.getByText("وقت الاستلام")).toBeInTheDocument();
    expect(screen.getByText("خيارات الاستلام والتسليم")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /الاستلام من/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /التسليم إلى/ })).toBeInTheDocument();
  });

  it("defaults to hanging on the door for both pickup and delivery", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "اطلب استلام الآن" }));

    expect(screen.getByRole("button", { name: /الاستلام من/ })).toHaveTextContent("تعليقة الباب");
    expect(screen.getByRole("button", { name: /التسليم إلى/ })).toHaveTextContent("تعليقة الباب");
  });

  it("lets the customer switch the delivery handover to hand-to-hand", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "اطلب استلام الآن" }));

    fireEvent.click(screen.getByRole("button", { name: /التسليم إلى/ }));
    fireEvent.click(screen.getByRole("button", { name: /يد بيد/ }));
    fireEvent.click(screen.getByRole("button", { name: "تم" }));

    expect(screen.getByRole("button", { name: /التسليم إلى/ })).toHaveTextContent("يد بيد");
    // pickup must stay untouched
    expect(screen.getByRole("button", { name: /الاستلام من/ })).toHaveTextContent("تعليقة الباب");
  });

  it("offers the alternate-location choice for pickup only", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "اطلب استلام الآن" }));

    fireEvent.click(screen.getByRole("button", { name: /الاستلام من/ }));
    expect(screen.getByRole("button", { name: /السلة الرئيسية/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "إغلاق" }));

    fireEvent.click(screen.getByRole("button", { name: /التسليم إلى/ }));
    expect(screen.queryByRole("button", { name: /السلة الرئيسية/ })).not.toBeInTheDocument();
  });
});
