import { NavLink, type NavLinkProps } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useSidebar } from './SidebarShell';

type LinkProps = NavLinkProps & {
  icon: ReactNode;
  children: React.ReactNode;
};

export function SidebarLink({ icon, children, className, onClick, ...props }: LinkProps) {
  const { collapsed, closeMobile } = useSidebar();

  return (
    <NavLink
      {...props}
      title={collapsed ? String(children) : undefined}
      onClick={(e) => {
        closeMobile();
        onClick?.(e);
      }}
      className={({ isActive }) =>
        [
          'sidebar-link',
          isActive ? 'sidebar-link-active' : '',
          collapsed ? 'sidebar-link-collapsed' : '',
          typeof className === 'string' ? className : '',
        ].filter(Boolean).join(' ')
      }
    >
      <span className="sidebar-link-icon" aria-hidden={!collapsed}>{icon}</span>
      <span className="sidebar-link-label">{children}</span>
    </NavLink>
  );
}

export function SidebarButton({
  icon,
  children,
  onClick,
  className = '',
}: {
  icon: ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const { collapsed } = useSidebar();

  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? String(children) : undefined}
      className={`sidebar-link sidebar-link-btn ${collapsed ? 'sidebar-link-collapsed' : ''} ${className}`}
    >
      <span className="sidebar-link-icon" aria-hidden={!collapsed}>{icon}</span>
      <span className="sidebar-link-label">{children}</span>
    </button>
  );
}
