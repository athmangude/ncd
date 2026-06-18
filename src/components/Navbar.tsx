export function Navbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full fixed top-0 left-0 z-40">
      <nav className="flex gap-5 items-center justify-between w-full px-5 sm:px-10 py-3 bg-white shadow-sm">
        {children}
      </nav>
    </div>
  )
}
