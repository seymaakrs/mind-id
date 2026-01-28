"use client"

import { Instagram, FileText, Bot, Building2, BarChart3, Settings } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"

type MainMenuType = "instagram" | "blog" | "agent" | "isletmeler" | "istatistikler" | "settings"
type SubMenuType = "icerik-uret" | "blog-paylas" | "isletme-listele"

interface QuickAccessItem {
  id: MainMenuType
  subMenu?: SubMenuType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

interface WelcomeDashboardProps {
  onNavigate: (menu: MainMenuType, subMenu?: SubMenuType) => void
}

const quickAccessItems: QuickAccessItem[] = [
  {
    id: "instagram",
    subMenu: "icerik-uret",
    label: "Instagram",
    description: "İçerik üret ve paylaş",
    icon: Instagram,
  },
  {
    id: "blog",
    subMenu: "blog-paylas",
    label: "Blog",
    description: "Blog yazısı oluştur",
    icon: FileText,
  },
  {
    id: "agent",
    label: "Agent",
    description: "AI görevleri yönet",
    icon: Bot,
  },
  {
    id: "isletmeler",
    subMenu: "isletme-listele",
    label: "İşletmeler",
    description: "İşletme profillerini yönet",
    icon: Building2,
  },
  {
    id: "istatistikler",
    label: "İstatistikler",
    description: "API kullanımını görüntüle",
    icon: BarChart3,
  },
  {
    id: "settings",
    label: "Ayarlar",
    description: "Sistem ayarlarını düzenle",
    icon: Settings,
  },
]

export function WelcomeDashboard({ onNavigate }: WelcomeDashboardProps) {
  const { user } = useAuth()

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Kullanıcı"

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Hoş geldin, {displayName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Bugün ne yapmak istersin?
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {quickAccessItems.map((item) => {
          const Icon = item.icon
          return (
            <Card
              key={item.id}
              className="p-4 cursor-pointer transition-all hover:bg-accent/50 hover:border-accent"
              onClick={() => onNavigate(item.id, item.subMenu)}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-lg bg-muted">
                  <Icon className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{item.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
