import { describe, expect, it, beforeEach } from "vitest";
import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Sidebar } from "@/components/Sidebar";
import { MemoryRouter } from "react-router-dom";

function renderWithProviders(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <I18nProvider>{ui}</I18nProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("LanguageSwitcher", () => {
  it("renders both language options", () => {
    renderWithProviders(<LanguageSwitcher />);
    expect(screen.getByRole("button", { name: "EN" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "हिं" })).toBeInTheDocument();
  });

  it("switches the sidebar text to Hindi when हिं is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Sidebar />);

    // Defaults to English in the test environment. The desktop sidebar
    // nav renders "Home" even though it's visually hidden below the lg
    // breakpoint in jsdom -- Tailwind's responsive classes don't affect
    // the accessibility tree, only CSS.
    expect(screen.getByText("Home")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "हिं" }));

    expect(screen.getByText("मुखपृष्ठ")).toBeInTheDocument();
  });
});
