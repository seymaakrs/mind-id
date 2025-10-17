"use client"

import { useState } from "react"
import { Instagram, FileText, Video, ChevronDown, ChevronRight } from "lucide-react"
import KaynakEkleComponent from "@/components/instagram/kaynak-ekle"
import IcerikUretComponent from "@/components/instagram/icerik-uret"
import GonderiPaylasComponent from "@/components/instagram/gonderi-paylas"
import BlogPaylasComponent from "@/components/blog/blog-paylas"
import AvatarSecComponent from "@/components/heygen/avatar-sec"
import SesSecComponent from "@/components/heygen/ses-sec"
import VideoOlusturComponent from "@/components/heygen/video-olustur"

type MainMenuType = "instagram" | "blog" | "heygen"
type SubMenuType =
  | "kaynak-ekle"
  | "icerik-uret"
  | "gonderi-paylas"
  | "blog-paylas"
  | "avatar-sec"
  | "ses-sec"
  | "video-olustur"

export default function AdminPanel() {
  const [activeMenu, setActiveMenu] = useState<MainMenuType>("instagram")
  const [activeSubMenu, setActiveSubMenu] = useState<SubMenuType>("kaynak-ekle")
  const [expandedMenu, setExpandedMenu] = useState<MainMenuType | null>("instagram")

  const menuItems = [
    {
      id: "instagram" as MainMenuType,
      label: "Instagram",
      icon: Instagram,
      subItems: [
        { id: "kaynak-ekle" as SubMenuType, label: "Kaynak Ekle" },
        { id: "icerik-uret" as SubMenuType, label: "İçerik Üret" },
        { id: "gonderi-paylas" as SubMenuType, label: "Gönderi Paylaş" },
      ],
    },
    {
      id: "blog" as MainMenuType,
      label: "Blog",
      icon: FileText,
      subItems: [{ id: "blog-paylas" as SubMenuType, label: "Blog Paylaş" }],
    },
    {
      id: "heygen" as MainMenuType,
      label: "HeyGen",
      icon: Video,
      subItems: [
        { id: "avatar-sec" as SubMenuType, label: "Avatar Seç" },
        { id: "ses-sec" as SubMenuType, label: "Ses Seç" },
        { id: "video-olustur" as SubMenuType, label: "Video Oluştur" },
      ],
    },
  ]

  const handleMenuClick = (menuId: MainMenuType) => {
    if (expandedMenu === menuId) {
      setExpandedMenu(null)
    } else {
      setExpandedMenu(menuId)
      setActiveMenu(menuId)
      // Set first sub-item as active when opening a menu
      const menu = menuItems.find((m) => m.id === menuId)
      if (menu && menu.subItems.length > 0) {
        setActiveSubMenu(menu.subItems[0].id)
      }
    }
  }

  const handleSubMenuClick = (menuId: MainMenuType, subMenuId: SubMenuType) => {
    setActiveMenu(menuId)
    setActiveSubMenu(subMenuId)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sol Menü - 20% genişlik */}
      <aside className="w-1/5 h-full bg-sidebar border-r border-sidebar-border">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-sidebar-foreground">MindID</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
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
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  {/* Alt Menü */}
                  {isExpanded && (
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
      </aside>

      {/* Sağ İçerik Alanı - 80% genişlik */}
      <main className="w-4/5 h-full overflow-auto">
        <div className="p-8">
          {/* Instagram Sub-menus */}
          {activeSubMenu === "kaynak-ekle" && <KaynakEkleComponent />}
          {activeSubMenu === "icerik-uret" && <IcerikUretComponent />}
          {activeSubMenu === "gonderi-paylas" && <GonderiPaylasComponent />}

          {/* Blog Sub-menus */}
          {activeSubMenu === "blog-paylas" && <BlogPaylasComponent />}

          {/* HeyGen Sub-menus */}
          {activeSubMenu === "avatar-sec" && <AvatarSecComponent />}
          {activeSubMenu === "ses-sec" && <SesSecComponent />}
          {activeSubMenu === "video-olustur" && <VideoOlusturComponent />}
        </div>
      </main>
    </div>
  )
}
