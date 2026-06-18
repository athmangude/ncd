export default function Pagination({
  currentPage,
  totalEntries,
  entriesPerPage,
  onPageChange,
}: {
  currentPage: number
  entriesPerPage: number
  totalEntries: number
  onPageChange: (page: number) => void
}) {
  const pagesToShow = 5

  // Calculate totalPages based on totalEntries and entriesPerPage
  const totalPages = Math.ceil(totalEntries / entriesPerPage)

  function getPaginationRange() {
    const halfPagesToShow = Math.floor(pagesToShow / 2)
    let startPage = currentPage - halfPagesToShow
    if (startPage <= 0) {
      startPage = 1
    }
    let endPage = startPage + pagesToShow - 1
    if (endPage > totalPages) {
      endPage = totalPages
      startPage = Math.max(1, endPage - pagesToShow + 1)
    }
    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    )
  }

  const paginationRange = getPaginationRange()

  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  return (
    <nav
      aria-label="Pagination"
      className="mt-3 flex justify-between border-y py-2 font-medium"
    >
      <p className="text-sm font-medium text-neutral-500">
        Showing page {currentPage} of {totalPages}
      </p>
      <ul className="flex gap-3 items-center">
        <li>
          <button
            aria-label="Previous"
            onClick={() => !isFirstPage && onPageChange(currentPage - 1)}
          >
            «
          </button>
        </li>

        {paginationRange.map((page) => (
          <li key={page}>
            <button
              aria-label={`Page ${page}`}
              className={` w-6 h-6 grid place-content-center ${
                page === currentPage && "bg-primary text-white rounded-sm"
              }`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          </li>
        ))}
        <li>
          <button
            aria-label="Next"
            onClick={() => !isLastPage && onPageChange(currentPage + 1)}
          >
            »
          </button>
        </li>
      </ul>
    </nav>
  )
}
