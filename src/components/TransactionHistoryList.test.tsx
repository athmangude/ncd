import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { TransactionHistoryList } from "./TransactionHistoryList"

interface Row {
  id: string
  createdAt: string
}

function renderList(
  items: Row[],
  extra?: Partial<Parameters<typeof TransactionHistoryList<Row>>[0]>
) {
  return render(
    <TransactionHistoryList<Row>
      items={items}
      getKey={(item) => item.id}
      getDate={(item) => item.createdAt}
      renderItem={(item) => <div data-testid="row">{item.id}</div>}
      {...extra}
    />
  )
}

describe("TransactionHistoryList", () => {
  it("groups rows under one header per distinct long-date", () => {
    renderList([
      { id: "a", createdAt: "2026-06-10T09:00:00Z" },
      { id: "b", createdAt: "2026-06-10T18:00:00Z" },
      { id: "c", createdAt: "2026-06-08T12:00:00Z" },
    ])

    // Two headers for two distinct dates, three rows total.
    expect(screen.getByText("10 Jun 2026")).toBeInTheDocument()
    expect(screen.getByText("08 Jun 2026")).toBeInTheDocument()
    expect(screen.getAllByTestId("row")).toHaveLength(3)
  })

  it("sorts groups and rows newest-first regardless of input order", () => {
    renderList([
      { id: "old", createdAt: "2026-01-01T00:00:00Z" },
      { id: "new", createdAt: "2026-12-31T00:00:00Z" },
    ])

    const headers = screen.getAllByText(/\d{2} \w{3} 2026/)
    expect(headers[0]).toHaveTextContent("31 Dec 2026")
    expect(headers[1]).toHaveTextContent("01 Jan 2026")
  })

  it("renders the shared skeleton while loading (no rows, no empty state)", () => {
    renderList([], { isLoading: true, emptyState: <div>empty</div> })
    expect(screen.queryByText("empty")).not.toBeInTheDocument()
    expect(screen.queryByTestId("row")).not.toBeInTheDocument()
  })

  it("renders a custom empty state when there are no items", () => {
    renderList([], { emptyState: <div>Nothing here</div> })
    expect(screen.getByText("Nothing here")).toBeInTheDocument()
  })

  it("renders the default empty state when none is supplied", () => {
    renderList([])
    expect(screen.getByText("No history yet.")).toBeInTheDocument()
  })
})
