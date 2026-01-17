"use client";

import { useEffect } from "react";
import { ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton";

interface SubMenuItem {
  id: string;
  label: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  subItems: SubMenuItem[];
}

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  activeMenu: string;
  activeSubMenu: string;
  expandedMenu: string | null;
  onMenuClick: (menuId: string) => void;
  onSubMenuClick: (menuId: string, subMenuId: string) => void;
}

export function MobileSidebar({
  isOpen,
  onClose,
  menuItems,
  activeMenu,
  activeSubMenu,
  expandedMenu,
  onMenuClick,
  onSubMenuClick,
}: MobileSidebarProps) {
  // Close menu when pressing Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleMenuItemClick = (menuId: string) => {
    onMenuClick(menuId);
    const menu = menuItems.find((m) => m.id === menuId);
    // Close sidebar if menu has no subitems
    if (!menu || menu.subItems.length === 0) {
      onClose();
    }
  };

  const handleSubMenuItemClick = (menuId: string, subMenuId: string) => {
    onSubMenuClick(menuId, subMenuId);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 z-40 md:hidden bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-sidebar-border pt-16">
          <h1 className="text-xl font-bold text-sidebar-foreground">MindID</h1>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasSubItems = item.subItems.length > 0;
              const isExpanded = expandedMenu === item.id;
              const isActive = activeMenu === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleMenuItemClick(item.id)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {hasSubItems ? (
                      isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )
                    ) : null}
                  </button>

                  {hasSubItems && isExpanded && (
                    <ul className="mt-1 ml-4 space-y-1">
                      {item.subItems.map((subItem) => (
                        <li key={subItem.id}>
                          <button
                            onClick={() => handleSubMenuItemClick(item.id, subItem.id)}
                            className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors min-h-[44px] ${
                              activeSubMenu === subItem.id
                                ? "bg-sidebar-accent/70 text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/30"
                            }`}
                          >
                            {subItem.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto p-4 border-t border-sidebar-border">
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
