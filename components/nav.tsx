import Link from "next/link";
import { SignOutButton } from "@/components/signout-button";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/providers", label: "Providers" },
  { href: "/appointments", label: "Appointments" },
  { href: "/care-plans", label: "Care Plans" },
  { href: "/admin", label: "Admin" }
];

export function NavBar() {
  return (
    <header className="nav-wrap">
      <nav className="nav">
        <Link href="/dashboard" className="brand">
          <span className="brand-logo" aria-hidden="true">
            <svg viewBox="0 0 32 32" role="img">
              <circle cx="16" cy="16" r="16" fill="#006d77" />
              <path d="M16 7.8a4.6 4.6 0 0 1 4.4 3.2h2.3a1.1 1.1 0 0 1 0 2.2h-2.2v2.2a1.1 1.1 0 0 1-2.2 0v-2.2h-4.6v2.2a1.1 1.1 0 0 1-2.2 0v-2.2H9.3a1.1 1.1 0 1 1 0-2.2h2.3A4.6 4.6 0 0 1 16 7.8Zm0 2.2a2.4 2.4 0 0 0-2.3 1.6h4.6A2.4 2.4 0 0 0 16 10Zm-4.7 7.4h9.4a1.1 1.1 0 0 1 1.1 1.1v1.1a5.8 5.8 0 0 1-11.6 0v-1.1a1.1 1.1 0 0 1 1.1-1.1Z" fill="#e1f3f5" />
            </svg>
          </span>
          <span>Healthie</span>
        </Link>
        <div className="links">
          {links.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <NotificationBell />
          <ThemeToggle />
          <SignOutButton />
        </div>
      </nav>
    </header>
  );
}
