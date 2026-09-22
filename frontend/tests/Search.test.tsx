import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/i18n/I18nProvider";
import Search from "@/pages/Search";
import { api } from "@/api/client";

vi.mock("@/api/client", () => ({
  api: {
    categories: vi.fn().mockResolvedValue(["greeting", "number"]),
    search: vi.fn(),
  },
}));

function renderSearchPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>
        <Search />
      </I18nProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(api.search).mockReset();
});

describe("Search (Dictionary) page", () => {
  it("shows the empty state when no results are found", async () => {
    vi.mocked(api.search).mockResolvedValue({ query: "zzz", total: 0, page: 1, page_size: 20, results: [] });

    renderSearchPage();
    await userEvent.type(screen.getByPlaceholderText(/search hindi or mundari/i), "zzz");

    await waitFor(() => expect(screen.getByText(/no matches found/i)).toBeInTheDocument());
  });

  it("renders search results with verified badges", async () => {
    vi.mocked(api.search).mockResolvedValue({
      query: "नमस्ते",
      total: 1,
      page: 1,
      page_size: 20,
      results: [
        {
          id: 1,
          source_text: "नमस्ते",
          target_text: "जोहार",
          category: "greeting",
          transliteration: "johaar",
          source_citation: "mundariversity.com",
          verified: true,
          match_type: "exact",
        },
      ],
    });

    renderSearchPage();
    await waitFor(() => expect(screen.getByText("जोहार")).toBeInTheDocument());
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });
});
