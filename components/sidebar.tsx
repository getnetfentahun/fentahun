type NavigationIcon =
  | "dashboard"
  | "employees"
  | "departments"
  | "attendance"
  | "biometric"
  | "reports"
  | "settings"
  | "calendar";

type NavigationItem = {
  label: string;
  icon: NavigationIcon;
  href: string;
};

const navigation: NavigationItem[] = [
  { label: "Dashboard", icon: "dashboard", href: "/" },
  { label: "Employees", icon: "employees", href: "/employees" },
  { label: "Departments", icon: "departments", href: "/departments" },
  { label: "Attendance", icon: "attendance", href: "/attendance" },
  { label: "Biometric", icon: "biometric", href: "/biometric" },
  { label: "Reports", icon: "reports", href: "/reports" },
  { label: "Settings", icon: "settings", href: "/settings" },
];

function NavigationIconGraphic({
  name,
  className,
}: {
  name: NavigationIcon;
  className: string;
}) {
  const paths: Record<NavigationIcon, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="4" rx="1.5" />
        <rect x="13.5" y="10.5" width="7" height="10" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      </>
    ),
    employees: (
      <>
        <path d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-4A4.5 4.5 0 0 0 3 18.5V20" />
        <circle cx="9.5" cy="7.5" r="4" />
        <path d="M17 4a4 4 0 0 1 0 7.75M21 20v-1.5a4.5 4.5 0 0 0-3.5-4.38" />
      </>
    ),
    departments: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 20V8h6v12M7 8h.01M17 8h.01M7 12h.01M17 12h.01M7 16h.01M17 16h.01" />
      </>
    ),
    attendance: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
    biometric: (
      <>
        <path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" />
        <path d="M8 10a4 4 0 0 1 8 0v2a4 4 0 0 1-8 0v-2Zm-3 0a7 7 0 0 1 14 0m-14 4a7 7 0 0 0 14 0" />
      </>
    ),
    reports: (
      <>
        <path d="M4 19V5M4 19h17" />
        <path d="m7 15 4-4 3 2 6-7" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.3a1.8 1.8 0 1 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3H3.7a1.8 1.8 0 1 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 1 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 1 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function Brand() {
  return (
    <a href="/" className="flex items-center gap-3" aria-label="Super Double T home">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-sm">
        <span className="text-sm font-extrabold tracking-tight">SDT</span>
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold leading-5 text-ink">Super Double T</span>
        <span className="block text-[11px] leading-4 text-slate-500">General Trading PLC</span>
      </span>
    </a>
  );
}

export function Sidebar({ activePage = "Dashboard" }: { activePage?: string }) {
  return (
    <aside className="border-b border-slate-200 bg-white px-4 py-4 lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-[260px] lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-7">
      <div className="px-1 lg:px-2">
        <Brand />
      </div>
      <nav aria-label="Main navigation" className="mt-5 overflow-x-auto lg:mt-10 lg:overflow-visible">
        <ul className="flex min-w-max gap-1 lg:min-w-0 lg:flex-col lg:gap-1.5">
          {navigation.map((item) => {
            const active = item.label === activePage;
            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald-50 text-brand"
                      : "text-slate-600 hover:bg-slate-50 hover:text-ink"
                  }`}
                >
                  <NavigationIconGraphic name={item.icon} className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto hidden rounded-xl bg-emerald-50 p-4 lg:block">
        <div className="flex items-center gap-2 text-brand">
          <NavigationIconGraphic name="calendar" className="h-4 w-4" />
          <span className="text-xs font-semibold">Attendance summary</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-600">
          Your team is at <span className="font-semibold text-ink">87%</span> attendance today.
        </p>
        <a href="/attendance" className="mt-3 inline-flex text-xs font-semibold text-brand hover:underline">
          View attendance <span aria-hidden="true" className="ml-1">→</span>
        </a>
      </div>
    </aside>
  );
}
