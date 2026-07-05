import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

type SidebarContextValue = {
  collapsed: boolean;
  closeMobile: () => void;
};

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  closeMobile: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

type SidebarShellProps = {
  title: string;
  brand?: ReactNode;
  header?: ReactNode;
  nav: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function SidebarShell({ title, brand, header, nav, footer, children }: SidebarShellProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('vouch-sidebar-collapsed') === 'true'
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('vouch-sidebar-collapsed', String(next));
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <SidebarContext.Provider value={{ collapsed, closeMobile }}>
      <div className="app-shell">
        {mobileOpen && (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="Close menu"
            onClick={closeMobile}
          />
        )}

        <aside
          className={[
            'sidebar',
            collapsed ? 'sidebar-collapsed' : '',
            mobileOpen ? 'sidebar-mobile-open' : '',
          ].filter(Boolean).join(' ')}
        >
          <div className="sidebar-top">
            {collapsed ? (
              <button
                type="button"
                className="sidebar-expand-hit"
                onClick={toggleCollapsed}
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                <span className="sidebar-brand-short">V</span>
                <span className="sidebar-chevron sidebar-chevron-flip" />
              </button>
            ) : (
              <>
                <div className="sidebar-brand-row">
                  {brand}
                  <button
                    type="button"
                    className="sidebar-collapse-btn"
                    onClick={toggleCollapsed}
                    aria-label="Collapse sidebar"
                    title="Collapse"
                  >
                    <span className="sidebar-chevron" />
                  </button>
                </div>
                {header && <div className="sidebar-header">{header}</div>}
              </>
            )}
          </div>

          <nav className="sidebar-nav">{nav}</nav>

          {footer && <div className="sidebar-footer">{footer}</div>}
        </aside>

        <div className="app-main">
          <header className="mobile-topbar">
            <button
              type="button"
              className="hamburger"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>
            <h1 className="mobile-topbar-title">{title}</h1>
          </header>

          <main className="app-content">{children}</main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
