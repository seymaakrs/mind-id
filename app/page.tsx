"use client"

import { useState, useEffect } from "react"
import { Instagram, FileText, Bot, Building2, Settings, ChevronDown, ChevronRight } from "lucide-react"
import KaynakEkleComponent from "@/components/instagram/kaynak-ekle"
import IcerikUretComponent from "@/components/instagram/icerik-uret"
import GonderiPaylasComponent from "@/components/instagram/gonderi-paylas"
import YorumKazancComponent from "@/components/instagram/yorum-kazanc"
import BlogPaylasComponent from "@/components/blog/blog-paylas"
import AgentGorevComponent from "@/components/agent/agent-gorev"
import {
  AddBusinessComponent,
  BusinessListComponent,
  BusinessDashboard,
} from "@/components/businesses"
import { SettingsPanel } from "@/components/settings"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import LogoutButton from "@/components/auth/LogoutButton"
import { MobileMenuButton, MobileSidebar } from "@/components/layout"

type MainMenuType = "instagram" | "blog" | "agent" | "isletmeler" | "settings"
type SubMenuType =
  | "kaynak-ekle"
  | "icerik-uret"
  | "gonderi-paylas"
  | "yorum-kazanc"
  | "blog-paylas"
  | "isletme-ekle"
  | "isletme-listele"
  | "isletme-dashboard"

export default function AdminPanel() {
  const [activeMenu, setActiveMenu] = useState<MainMenuType>("instagram")
  const [activeSubMenu, setActiveSubMenu] = useState<SubMenuType>("kaynak-ekle")
  const [expandedMenu, setExpandedMenu] = useState<MainMenuType | null>("instagram")
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Body scroll lock when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add("menu-open")
    } else {
      document.body.classList.remove("menu-open")
    }
    return () => {
      document.body.classList.remove("menu-open")
    }
  }, [isMobileMenuOpen])

  const menuItems = [
    {
      id: "instagram" as MainMenuType,
      label: "Instagram",
      icon: Instagram,
      subItems: [
        { id: "kaynak-ekle" as SubMenuType, label: "Kaynak Ekle" },
        { id: "icerik-uret" as SubMenuType, label: "Icerik Uret" },
        { id: "gonderi-paylas" as SubMenuType, label: "Gonderi Paylas" },
        { id: "yorum-kazanc" as SubMenuType, label: "Yorum Kazanclari" },
      ],
    },
    {
      id: "blog" as MainMenuType,
      label: "Blog",
      icon: FileText,
      subItems: [{ id: "blog-paylas" as SubMenuType, label: "Blog Paylaş" }],
    },
    {
      id: "agent" as MainMenuType,
      label: "Agent",
      icon: Bot,
      subItems: [],
    },
    {
      id: "isletmeler" as MainMenuType,
      label: "İşletmeler",
      icon: Building2,
      subItems: [
        { id: "isletme-listele" as SubMenuType, label: "İşletme Listesi" },
        { id: "isletme-ekle" as SubMenuType, label: "İşletme Ekle" },
        { id: "isletme-dashboard" as SubMenuType, label: "İşletme Dashboard" },
      ],
    },
    {
      id: "settings" as MainMenuType,
      label: "Ayarlar",
      icon: Settings,
      subItems: [],
    },
  ]

  const handleMenuClick = (menuId: MainMenuType) => {
    const menu = menuItems.find((m) => m.id === menuId)

    if (!menu || menu.subItems.length === 0) {
      setActiveMenu(menuId)
      setExpandedMenu(null)
      return
    }

    if (expandedMenu === menuId) {
      setExpandedMenu(null)
    } else {
      setExpandedMenu(menuId)
      setActiveMenu(menuId)
      // Set first sub-item as active when opening a menu
      if (menu && menu.subItems.length > 0) {
        setActiveSubMenu(menu.subItems[0].id)
      }
    }
  }

  const handleSubMenuClick = (menuId: MainMenuType, subMenuId: SubMenuType) => {
    setActiveMenu(menuId)
    setActiveSubMenu(subMenuId)
  }

  // Handler for navigating to dashboard from business list
  const handleBusinessSelectFromList = (business: { id: string }) => {
    setSelectedBusinessId(business.id)
    setActiveSubMenu("isletme-dashboard")
  }

  return (
    <ProtectedRoute>
      <div className="fixed inset-0 flex bg-background overflow-hidden">
        {/* Mobile Menu Button */}
        <MobileMenuButton
          isOpen={isMobileMenuOpen}
          onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Mobile Sidebar */}
        <MobileSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          menuItems={menuItems}
          activeMenu={activeMenu}
          activeSubMenu={activeSubMenu}
          expandedMenu={expandedMenu}
          onMenuClick={handleMenuClick}
          onSubMenuClick={handleSubMenuClick}
        />

        {/* Desktop Sidebar - Hidden on mobile */}
        <aside className="hidden md:flex md:w-64 lg:w-72 h-full bg-sidebar border-r border-sidebar-border flex-col overflow-hidden">
          <div className="p-6 border-b border-sidebar-border">
            <h1 className="text-xl font-bold text-sidebar-foreground">MindID</h1>
          </div>
        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const hasSubItems = item.subItems.length > 0
              const isExpanded = expandedMenu === item.id
              const isActive = activeMenu === item.id

              return (
                <li key={item.id}>
                  {/* Ana Menü */}
                  <button
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${
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

                  {/* Alt Menü */}
                  {hasSubItems && isExpanded && (
                    <ul className="mt-1 ml-4 space-y-1">
                      {item.subItems.map((subItem) => (
                        <li key={subItem.id}>
                          <button
                            onClick={() => handleSubMenuClick(item.id, subItem.id)}
                            className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
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
              )
            })}
          </ul>
        </nav>
          {/* Logout Button - Alt kisim */}
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <LogoutButton />
          </div>
        </aside>

      {/* Main Content Area - Responsive */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden">
        <div className="p-4 pt-16 md:pt-4 md:p-8 max-w-full">
          {activeMenu === "agent" ? (
            <AgentGorevComponent />
          ) : activeMenu === "settings" ? (
            <SettingsPanel />
          ) : (
            <>
              {/* Instagram Sub-menus */}
              {activeSubMenu === "kaynak-ekle" && <KaynakEkleComponent />}
              {activeSubMenu === "icerik-uret" && <IcerikUretComponent />}
              {activeSubMenu === "gonderi-paylas" && <GonderiPaylasComponent />}
              {activeSubMenu === "yorum-kazanc" && <YorumKazancComponent />}

              {/* Blog Sub-menus */}
              {activeSubMenu === "blog-paylas" && <BlogPaylasComponent />}

              {/* İşletmeler Sub-menus */}
              {activeSubMenu === "isletme-listele" && (
                <BusinessListComponent onBusinessSelect={handleBusinessSelectFromList} />
              )}
              {activeSubMenu === "isletme-ekle" && <AddBusinessComponent />}
              {activeSubMenu === "isletme-dashboard" && (
                <BusinessDashboard
                  initialBusinessId={selectedBusinessId}
                  onBusinessChange={(b) => b && setSelectedBusinessId(b.id)}
                />
              )}
            </>
          )}
        </div>
      </main>
      </div>
    </ProtectedRoute>
  )
}
