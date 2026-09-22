import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/i18n/I18nProvider";
import Translate from "@/pages/Translate";
import { api } from "@/api/client";

vi.mock("@/api/client", () => ({
  api: { translate: vi.fn() },
  ApiError: class ApiError extends Error {},
}));

function renderTranslatePage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>
        <Translate />
      </I18nProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  vi.mocked(api.translate).mockReset();
});

describe("Translate page", () => {
  it("disables the Translate button until text is entered", async () => {
    renderTranslatePage();
    const button = screen.getByRole("button", { name: /translate/i });
    expect(button).toBeDisabled();

    const textarea = screen.getByPlaceholderText(/type hindi text/i);
    await userEvent.type(textarea, "नमस्ते");

    expect(button).toBeEnabled();
  });

  it("shows a verified, high-confidence result after a successful exact match", async () => {
    vi.mocked(api.translate).mockResolvedValueOnce({
      input_text: "नमस्ते",
      normalized_input: "नमस्ते",
      result_text: "जोहार",
      method: "exact",
      confidence: 1,
      confidence_label: "high",
      verified: true,
      ai_assisted: false,
      message: "Exact match found in the verified dataset.",
      category: "greeting",
      transliteration: "johaar",
      source_citation: "mundariversity.com",
      alternatives: [],
      history_id: 1,
    });

    renderTranslatePage();
    await userEvent.type(screen.getByPlaceholderText(/type hindi text/i), "नमस्ते");
    await userEvent.click(screen.getByRole("button", { name: /translate/i }));

    await waitFor(() => expect(screen.getByText("जोहार")).toBeInTheDocument());
    expect(api.translate).toHaveBeenCalledWith("नमस्ते", "hi", "mundari");
  });

  it("fills the input when an example chip is clicked", async () => {
    renderTranslatePage();
    await userEvent.click(screen.getByRole("button", { name: "एक" }));
    expect(screen.getByPlaceholderText(/type hindi text/i)).toHaveValue("एक");
  });
});
