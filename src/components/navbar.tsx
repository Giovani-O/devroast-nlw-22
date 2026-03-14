import Link from "next/link";

export function Navbar() {
  return (
    <nav className="w-full h-14 bg-bg-page border-b border-border-primary flex items-center justify-between px-10">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <span className="font-mono text-xl font-bold text-accent-green">
          &gt;
        </span>
        <span className="font-mono text-base font-medium text-text-primary">
          devroast
        </span>
      </Link>

      {/* Navigation */}
      <div className="flex items-center gap-6">
        <Link
          href="/leaderboard"
          className="font-mono text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          leaderboard
        </Link>
      </div>
    </nav>
  );
}
