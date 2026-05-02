"use client"

import { useState, useEffect } from "react"
import { Bot, Building2, Settings, ChevronDown, ChevronRight, BarChart3, Home, Activity, Users, Network } from "lucide-react"
import { useReferenceQueue } from "@/contexts/ReferenceQueueContext"
import AgentGorevComponent from "@/components/agent/agent-gorev"
import { AddBusinessComponent, BusinessListComponent, BusinessDashboard } from "@/components/businesses"
import InviteLinksComponent from "@/components/businesses/invite-links"
import { SettingsPanel } from "@/components/settings"
import { ApiStatisticsPanel } from "@/components/statistics"
import { CommandCenterCanvas } from "@/components/canvas/command-center-canvas"
import { TeamHierarchyCanvas } from "@/components/canvas/team-hierarchy-canvas"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import LogoutButton from "@/components/auth/LogoutButton"
import { MobileMenuButton, MobileSidebar } from "@/components/layout"
import { ErrorNotificationBell } from "@/components/shared/ErrorNotificationBell"
import { ActiveTasksIndicator } from "@/components/shared/ActiveTasksIndicator"
import { ActiveTasksPanel } from "@/components/active-tasks/active-tasks-panel"

type MainMenuType = "anasayfa" | "agent" | "aktif-gorevler" | "isletmeler" | "istatistikler" | "settings"
type SubMenuType = "isletme-ekle" | "isletme-listele" | "isletme-dashboard" | "davet-linkleri"
type CanvasView = "team" | "system"

function HomepageCanvas() {
  const [view, setView] = useState<CanvasView>("team")
  return (
    <div className="relative">
      <div className="flex items-center gap-1 mb-3 p-1 bg-muted rounded-xl w-fit">
        <button
          onClick={() => setView("team")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === "team" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Users className="w-4 h-4" />Ekip Haritası
        </button>
        <button
          onClick={() => setView("system")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === "system" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Network className="w-4 h-4" />Sistem Haritası
        </button>
      </div>
      {view === "team" ? <TeamHierarchyCanvas /> : <CommandCenterCanvas />}
    </div>
  )
}

export default function AdminPanel() {
  const [activeMenu, setActiveMenu]         = useState<MainMenuType>("anasayfa")
  const [activeSubMenu, setActiveSubMenu]   = useState<SubMenuType | null>(null)
  const [expandedMenu, setExpandedMenu]     = useState<MainMenuType | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { referenceCount } = useReferenceQueue()

  useEffect(() => {
    document.body.classList.toggle("menu-open", isMobileMenuOpen)
    return () => { document.body.classList.remove("menu-open") }
  }, [isMobileMenuOpen])

  const menuItems = [
    { id: "anasayfa"      as MainMenuType, label: "Anasayfa",    icon: Home,      subItems: [] },
    { id: "agent"         as MainMenuType, label: "Agent",        icon: Bot,       subItems: [] },
    { id: "aktif-gorevler"as MainMenuType, label: "Aktif Gorevler", icon: Activity, subItems: [] },
    {
      id: "isletmeler" as MainMenuType, label: "İşletmeler", icon: Building2,
      subItems: [
        { id: "isletme-listele"  as SubMenuType, label: "İşletme Listesi" },
        { id: "isletme-ekle"     as SubMenuType, label: "İşletme Ekle" },
        { id: "isletme-dashboard"as SubMenuType, label: "İşletme Dashboard" },
        { id: "davet-linkleri"   as SubMenuType, label: "Davet Linkleri" },
      ],
    },
    { id: "istatistikler" as MainMenuType, label: "İstatistikler", icon: BarChart3, subItems: [] },
    { id: "settings"      as MainMenuType, label: "Ayarlar",      icon: Settings,  subItems: [] },
  ]

  const handleMenuClick = (menuId: MainMenuType) => {
    const menu = menuItems.find(m => m.id === menuId)
    if (menuId !== "agent" && sidebarCollapsed) setSidebarCollapsed(false)
    if (!menu || menu.subItems.length === 0) { setActiveMenu(menuId); setExpandedMenu(null); return }
    if (expandedMenu === menuId) { setExpandedMenu(null) }
    else { setExpandedMenu(menuId); setActiveMenu(menuId); if (menu.subItems.length > 0) setActiveSubMenu(menu.subItems[0].id) }
  }

  const handleSubMenuClick = (menuId: MainMenuType, subMenuId: SubMenuType) => { setActiveMenu(menuId); setActiveSubMenu(subMenuId) }
  const handleBusinessSelectFromList = (business: { id: string }) => { setSelectedBusinessId(business.id); setActiveSubMenu("isletme-dashboard") }

  return (
    <ProtectedRoute>
      <div className="fixed inset-0 flex bg-background overflow-hidden">
        <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} menuItems={menuItems} activeMenu={activeMenu} activeSubMenu={activeSubMenu} expandedMenu={expandedMenu} onMenuClick={handleMenuClick} onSubMenuClick={handleSubMenuClick} />

        <aside className={`hidden md:flex h-full bg-sidebar border-r border-sidebar-border flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? "md:w-16" : "md:w-64 lg:w-72"}`}>
          <div className={`border-b border-sidebar-border shrink-0 ${sidebarCollapsed ? "p-4 flex items-center justify-center" : "p-6"}`}>
            <h1 className={`font-bold text-sidebar-foreground transition-all duration-300 ${sidebarCollapsed ? "text-sm" : "text-xl"}`}>{sidebarCollapsed ? "M" : "MindID"}</h1>
          </div>
          <nav className={`flex-1 overflow-y-auto ${sidebarCollapsed ? "p-2" : "p-4"}`}>
            <ul className="space-y-1">
              {menuItems.map(item => {
                const Icon = item.icon
                const hasSubItems = item.subItems.length > 0
                const isExpanded = expandedMenu === item.id
                const isActive = activeMenu === item.id
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleMenuClick(item.id)}
                      className={`w-full flex items-center rounded-lg transition-colors ${sidebarCollapsed ? "justify-center px-2 py-3" : "justify-between gap-3 px-4 py-3"} ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <div className={`flex items-center ${sidebarCollapsed ? "relative" : "gap-3"}`}>
                        <Icon className="w-5 h-5 shrink-0" />
                        {item.id === "agent" && referenceCount > 0 && (
                          <span className={`${sidebarCollapsed ? "absolute -top-1 -right-1" : "ml-0"} w-4 h-4 bg-primary text-primary-foreground text-[9px] rounded-full flex items-center justify-center font-medium shrink-0`}>{referenceCount > 9 ? "9+" : referenceCount}</span>
                        )}
                        {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                      </div>
                      {!sidebarCollapsed && hasSubItems ? (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : null}
                    </button>
                    {!sidebarCollapsed && hasSubItems && isExpanded && (
                      <ul className="mt-1 ml-4 space-y-1">
                        {item.subItems.map(sub => (
                          <li key={sub.id}>
                            <button onClick={() => handleSubMenuClick(item.id, sub.id)} className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${activeSubMenu === sub.id ? "bg-sidebar-accent/70 text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/30"}`}>{sub.label}</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
          <div className={`mt-auto border-t border-sidebar-border ${sidebarCollapsed ? "p-2" : "p-4"}`}><LogoutButton /></div>
        </aside>

        <main className={`flex-1 min-h-0 overflow-x-hidden flex flex-col ${activeMenu === "agent" ? "overflow-hidden" : "overflow-y-auto h-full"}`}>
          <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-2 md:px-8 md:py-3 bg-background/80 backdrop-blur-sm border-b border-border shrink-0">
            <div className="md:hidden"><MobileMenuButton isOpen={isMobileMenuOpen} onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} /></div>
            <div className="hidden md:block" />
            <div className="flex items-center gap-1">
              <ActiveTasksIndicator onNavigate={() => { setActiveMenu("aktif-gorevler"); setExpandedMenu(null) }} />
              <ErrorNotificationBell />
            </div>
          </div>
          <div className={`max-w-full ${activeMenu === "agent" ? "p-0 flex-1 flex flex-col overflow-hidden min-h-0" : "p-4 md:p-8"}`}>
            {activeMenu === "anasayfa" ? <HomepageCanvas />
              : activeMenu === "aktif-gorevler" ? <ActiveTasksPanel />
              : activeMenu === "agent" ? <AgentGorevComponent sidebarCollapsed={sidebarCollapsed} onSidebarCollapse={setSidebarCollapsed} initialBusinessId={selectedBusinessId || undefined} />
              : activeMenu === "settings" ? <SettingsPanel />
              : activeMenu === "istatistikler" ? <ApiStatisticsPanel />
              : (
                <>
                  {activeSubMenu === "isletme-listele"   && <BusinessListComponent onBusinessSelect={handleBusinessSelectFromList} />}
                  {activeSubMenu === "isletme-ekle"      && <AddBusinessComponent />}
                  {activeSubMenu === "isletme-dashboard" && <BusinessDashboard initialBusinessId={selectedBusinessId} onBusinessChange={b => b && setSelectedBusinessId(b.id)} onNavigateToAgent={() => setActiveMenu("agent")} />}
                  {activeSubMenu === "davet-linkleri"    && <InviteLinksComponent />}
                </>
              )
            }
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
