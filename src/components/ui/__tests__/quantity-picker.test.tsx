import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuantityPicker } from "@/components/ui/quantity-picker";

function setup(quantity = 20) {
  const user = userEvent.setup();
  const onQuantityChange = vi.fn();
  render(
    <QuantityPicker
      quantity={quantity}
      onQuantityChange={onQuantityChange}
      decrementLabel="Decrease quantity"
      incrementLabel="Increase quantity"
      quantityLabel="Quantity"
    />,
  );
  const input = screen.getByRole("textbox", { name: "Quantity" });
  return { user, onQuantityChange, input };
}

describe("QuantityPicker", () => {
  it("commits a typed quantity on blur", async () => {
    const { user, onQuantityChange, input } = setup();

    await user.click(input);
    await user.keyboard("48");
    await user.tab();

    expect(onQuantityChange).toHaveBeenCalledTimes(1);
    expect(onQuantityChange).toHaveBeenCalledWith(48);
  });

  it("commits a typed quantity on Enter", async () => {
    const { user, onQuantityChange, input } = setup(1);

    await user.click(input);
    await user.keyboard("12{Enter}");

    expect(onQuantityChange).toHaveBeenCalledWith(12);
  });

  it("ignores non-numeric characters while typing", async () => {
    const { user, onQuantityChange, input } = setup(1);

    await user.click(input);
    await user.keyboard("1a.5{Enter}");

    expect(onQuantityChange).toHaveBeenCalledWith(15);
  });

  it("reverts to the current quantity when the field is cleared", async () => {
    const { user, onQuantityChange, input } = setup();

    await user.click(input);
    await user.keyboard("{Backspace}");
    await user.tab();

    expect(onQuantityChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("20");
  });

  it("clamps a typed quantity to the minimum", async () => {
    const { user, onQuantityChange, input } = setup();

    await user.click(input);
    await user.keyboard("0{Enter}");

    expect(onQuantityChange).toHaveBeenCalledWith(1);
  });

  it("does not call onQuantityChange when the typed value matches the quantity", async () => {
    const { user, onQuantityChange, input } = setup();

    await user.click(input);
    await user.keyboard("20{Enter}");

    expect(onQuantityChange).not.toHaveBeenCalled();
  });

  it("discards the draft on Escape", async () => {
    const { user, onQuantityChange, input } = setup();

    await user.click(input);
    await user.keyboard("99{Escape}");
    await user.tab();

    expect(onQuantityChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("20");
  });

  it("increments and decrements around the current quantity", async () => {
    const { user, onQuantityChange } = setup(5);

    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(onQuantityChange).toHaveBeenLastCalledWith(6);

    await user.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(onQuantityChange).toHaveBeenLastCalledWith(4);
  });

  it("disables the decrement button at the minimum quantity", () => {
    setup(1);

    expect(
      screen.getByRole("button", { name: "Decrease quantity" }),
    ).toBeDisabled();
  });
});
