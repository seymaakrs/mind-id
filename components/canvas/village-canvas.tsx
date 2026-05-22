"use client"

/**
 * Village Canvas — Şirinler Köyü Hiyerarşisi
 *
 * MindID ekosisteminin (mind-id, mind-agent, mindid-nocodb, customer_agent)
 * Şirinler köyü temalı görsel haritası. Tamamen presentational —
 * hiçbir veritabanı / API çağrısı yok. Tıklanan şirinin detayı sağdan
 * açılan drawer'da gösterilir.
 *
 * CommandCenterCanvas'ın yerini alır; eski component dosyada duruyor
 * (rollback için).
 */

import { useState, useEffect } from "react"

type Status = "calisir" | "devam" | "hata" | "pasif"

interface Badge {
  label: string
  tone?: "gemini" | "veo" | "kling" | "heygen" | "gpt" | "firebase" | "nocodb" | "late" | "serper" | "fal" | "n8n" | "meta"
}

interface SmurfDef {
  key: string
  name: string
  role: string
  tool: string
  bodyColor: string
  status: Status
  badges: Badge[]
}

interface HouseDef {
  key: string
  icon: string
  name: string
  role: string
}

interface HubDef {
  id: string
  title: string
  sub: string
  borderColor: string
  capColor: string
  smurfs?: SmurfDef[]
  houses?: HouseDef[]
}

interface Detail {
  title: string
  sub: string
  desc: string
  tools: string[]
  collab: string[]
  status: string
}

const HUBS: HubDef[] = [
  {
    id: "mindid",
    title: "🪟 Köy Meydanı",
    sub: "MindID Panel — Kullanıcı Yüzü",
    borderColor: "#7cc5ed",
    capColor: "#3b9ee8",
    houses: [
      { key: "page-anasayfa", icon: "🗺️", name: "Köy Meydanı", role: "Anasayfa" },
      { key: "page-agent", icon: "💬", name: "Sohbet Kulübesi", role: "Agent Sayfası" },
      { key: "page-tasks", icon: "📋", name: "Görev Tahtası", role: "Aktif Görevler" },
      { key: "page-businesses", icon: "🏪", name: "Marka Defteri", role: "İşletmeler" },
      { key: "page-stats", icon: "📊", name: "Performans Panosu", role: "İstatistikler" },
      { key: "page-settings", icon: "🔧", name: "Atölye", role: "Ayarlar" },
    ],
  },
  {
    id: "mindagent",
    title: "🧠 Yaratıcı Mutfak",
    sub: "Mind Agent — Üretken Şirinler",
    borderColor: "#c8a8f0",
    capColor: "#9b6bd8",
    smurfs: [
      {
        key: "ressam", name: "Ressam Şirin", role: "Görsel Üretim Uzmanı",
        tool: "🎨", bodyColor: "#f4b73a", status: "calisir",
        badges: [{ label: "Gemini 2.0 Flash", tone: "gemini" }, { label: "GPT-4o", tone: "gpt" }, { label: "Firebase Storage", tone: "firebase" }],
      },
      {
        key: "yonetmen", name: "Yönetmen Şirin", role: "Video Üretim Uzmanı",
        tool: "🎬", bodyColor: "#1f2a44", status: "calisir",
        badges: [{ label: "Veo 3.1", tone: "veo" }, { label: "Kling v3", tone: "kling" }, { label: "HeyGen", tone: "heygen" }, { label: "fal.ai MMAudio", tone: "fal" }, { label: "GPT-4o", tone: "gpt" }],
      },
      {
        key: "tellal", name: "Tellal Şirin", role: "Pazarlama & Yayın Uzmanı",
        tool: "📣", bodyColor: "#e23d8b", status: "calisir",
        badges: [{ label: "Zernio", tone: "late" }, { label: "Instagram" }, { label: "YouTube" }, { label: "TikTok" }, { label: "LinkedIn" }, { label: "GPT-4o", tone: "gpt" }],
      },
      {
        key: "akilli", name: "Akıllı Şirin", role: "Veri & Performans Analisti (SWOT + SEO + GEO)",
        tool: "🔬", bodyColor: "#3a7a3a", status: "calisir",
        badges: [{ label: "Serper.dev", tone: "serper" }, { label: "GPT-4o", tone: "gpt" }, { label: "Firestore", tone: "firebase" }, { label: "SEO v2" }, { label: "GEO Skoru" }],
      },
    ],
  },
  {
    id: "nocodb",
    title: "📚 Köy Kütüphanesi",
    sub: "NocoDB — Veri Defterleri",
    borderColor: "#7fd6c8",
    capColor: "#2bb39b",
    smurfs: [
      {
        key: "kutuphaneci", name: "Kütüphaneci Şirin", role: "Müşteri Adayı (Lead) Veritabanı",
        tool: "📖", bodyColor: "#4a90c2", status: "calisir",
        badges: [{ label: "NocoDB", tone: "nocodb" }, { label: "Leads Tablosu" }, { label: "Idempotent upsert" }],
      },
      {
        key: "sekreter", name: "Sekreter Şirin", role: "CRM Tabloları (mesajlar & bildirimler)",
        tool: "🗂️", bodyColor: "#a18f6c", status: "calisir",
        badges: [{ label: "NocoDB", tone: "nocodb" }, { label: "lead_messages" }, { label: "notifications" }],
      },
    ],
  },
  {
    id: "customer",
    title: "🎯 Avcılar Çadırı",
    sub: "Customer Agent — Satış Şirinleri",
    borderColor: "#f3b07a",
    capColor: "#e8852c",
    smurfs: [
      {
        key: "trafikci", name: "Trafikçi Şirin", role: "Satış İş Akışı Yöneticisi",
        tool: "🚦", bodyColor: "#c0392b", status: "devam",
        badges: [{ label: "n8n", tone: "n8n" }, { label: "Webhooks" }],
      },
      {
        key: "avci", name: "Avcı Şirin", role: "Meta Lead Ads Takipçisi",
        tool: "🏹", bodyColor: "#1877f2", status: "pasif",
        badges: [{ label: "Meta Lead Ads", tone: "meta" }, { label: "NocoDB upsert", tone: "nocodb" }, { label: "Facebook" }, { label: "Instagram Ads" }],
      },
      {
        key: "profesyonel", name: "Profesyonel Şirin", role: "LinkedIn Outreach (planlanıyor)",
        tool: "💼", bodyColor: "#0a66c2", status: "hata",
        badges: [{ label: "LinkedIn" }, { label: "Outreach" }],
      },
      {
        key: "dedektif", name: "Dedektif Şirin", role: "Veri Zenginleştirme — Clay tarzı (yapılacak)",
        tool: "🔍", bodyColor: "#5c4033", status: "hata",
        badges: [{ label: "Clay" }, { label: "Enrichment" }],
      },
      {
        key: "postaci", name: "Postacı Şirin", role: "Instagram DM Otomasyonu (yapılacak)",
        tool: "✉️", bodyColor: "#e1306c", status: "hata",
        badges: [{ label: "Instagram DM" }, { label: "Auto-reply" }],
      },
      {
        key: "kopru", name: "Köprücü Şirin", role: "Mind-Agent SDK Köprüsü (planlandı)",
        tool: "🌉", bodyColor: "#7c3aed", status: "devam",
        badges: [{ label: "SDK Bridge" }, { label: "Mind-Agent", tone: "gpt" }],
      },
    ],
  },
]

const DETAILS: Record<string, Detail> = {
  papa: { title: "Şirin Baba", sub: "Komuta Merkezi · Orkestratör Ajan", desc: "Tüm köyü o yönetir. İsteği anlar, doğru şirine yönlendirir, sonuçları toparlar.", tools: ["GPT-4o-mini", "Firebase", "Zernio", "OpenAI Agents SDK"], collab: ["Ressam", "Yönetmen", "Tellal", "Akıllı", "Köprücü"], status: "🟢 Çalışıyor" },
  ressam: { title: "Ressam Şirin", sub: "Görsel Ajan", desc: "Resim ve görsel üretir.", tools: ["Gemini 2.0 Flash", "GPT-4o", "Firebase Storage"], collab: ["Şirin Baba", "Tellal Şirin"], status: "🟢 Çalışıyor" },
  yonetmen: { title: "Yönetmen Şirin", sub: "Video Ajan", desc: "Video çeker; sahneye göre motoru seçer.", tools: ["Veo 3.1", "Kling v3", "HeyGen", "fal.ai MMAudio", "GPT-4o"], collab: ["Şirin Baba", "Tellal Şirin"], status: "🟢 Çalışıyor" },
  tellal: { title: "Tellal Şirin", sub: "Pazarlama Ajan", desc: "Plan kurar, paylaşır, sonuçları işler.", tools: ["Zernio", "GPT-4o", "Firestore"], collab: ["Ressam", "Yönetmen", "Akıllı"], status: "🟢 Çalışıyor" },
  akilli: { title: "Akıllı Şirin", sub: "Analiz Ajan", desc: "Web tarar, SEO/GEO skoru hesaplar, rapor yazar.", tools: ["Serper.dev", "GPT-4o", "Firestore", "SEO v2", "GEO"], collab: ["Şirin Baba", "Tellal", "Kütüphaneci"], status: "🟢 Çalışıyor" },
  kutuphaneci: { title: "Kütüphaneci Şirin", sub: "NocoDB · Lead DB", desc: "Lead kayıtlarını idempotent biçimde tutar.", tools: ["NocoDB v2", "leads tablosu"], collab: ["Avcı", "Trafikçi", "Sekreter"], status: "🟢 Çalışıyor" },
  sekreter: { title: "Sekreter Şirin", sub: "NocoDB · CRM", desc: "Lead mesajları ve bildirimler.", tools: ["NocoDB", "lead_messages", "seyma_notifications"], collab: ["Kütüphaneci"], status: "🟢 Çalışıyor" },
  trafikci: { title: "Trafikçi Şirin", sub: "n8n Orkestratör", desc: "Satış akışını n8n ile yönetir.", tools: ["n8n", "Webhooks", "Mind-Agent /task"], collab: ["Avcı", "Profesyonel", "Dedektif", "Postacı", "Köprücü"], status: "🟡 Devam ediyor" },
  avci: { title: "Avcı Şirin", sub: "Meta Lead Ajan", desc: "Meta reklamlarından lead yakalar.", tools: ["Meta Lead Ads", "NocoDB upsert_lead"], collab: ["Trafikçi", "Kütüphaneci"], status: "⚪ Pasif" },
  profesyonel: { title: "Profesyonel Şirin", sub: "LinkedIn Outreach", desc: "LinkedIn üzerinden potansiyel müşterilere ulaşacak.", tools: ["LinkedIn (planlandı)"], collab: ["Trafikçi", "Kütüphaneci"], status: "🔴 Yapılacak" },
  dedektif: { title: "Dedektif Şirin", sub: "Veri Zenginleştirme", desc: "Lead bilgilerini zenginleştirecek.", tools: ["Clay benzeri (planlandı)"], collab: ["Trafikçi", "Kütüphaneci"], status: "🔴 Yapılacak" },
  postaci: { title: "Postacı Şirin", sub: "IG DM Otomasyonu", desc: "Instagram DM'leri otomatik yanıtlayacak.", tools: ["Instagram Messaging (planlandı)"], collab: ["Trafikçi", "Kütüphaneci"], status: "🔴 Yapılacak" },
  kopru: { title: "Köprücü Şirin", sub: "Mind-Agent SDK Köprüsü", desc: "Satış şirinlerini mind-agent altyapısına bağlar.", tools: ["OpenAI Agents SDK", "FastAPI /task"], collab: ["Trafikçi", "Şirin Baba"], status: "🟡 Devam ediyor" },
  "page-anasayfa": { title: "Köy Meydanı", sub: "Anasayfa", desc: "Komuta merkezi ekranı.", tools: ["Next.js", "React"], collab: ["Tüm köy"], status: "🟢 Çalışıyor" },
  "page-agent": { title: "Sohbet Kulübesi", sub: "Agent Sayfası", desc: "Şirin Baba ile konuşma ekranı.", tools: ["Streaming chat"], collab: ["Şirin Baba"], status: "🟢 Çalışıyor" },
  "page-tasks": { title: "Görev Tahtası", sub: "Aktif Görevler", desc: "Çalışan ve biten işler.", tools: ["Firestore active_tasks"], collab: ["Şirin Baba"], status: "🟢 Çalışıyor" },
  "page-businesses": { title: "Marka Defteri", sub: "İşletmeler", desc: "İşletme yönetimi.", tools: ["Firestore", "NocoDB CRM"], collab: ["Sekreter", "Tellal"], status: "🟢 Çalışıyor" },
  "page-stats": { title: "Performans Panosu", sub: "İstatistikler", desc: "Sayısal özet.", tools: ["Firestore", "API stats"], collab: ["Akıllı"], status: "🟢 Çalışıyor" },
  "page-settings": { title: "Atölye", sub: "Ayarlar", desc: "Profil, model, bildirim ayarları.", tools: ["settings/app_settings"], collab: [], status: "🟢 Çalışıyor" },
}

function Avatar({ bodyColor, tool, papa = false }: { bodyColor: string; tool?: string; papa?: boolean }) {
  if (papa) {
    return (
      <div className="avatar papa">
        <div className="av-body" />
        <div className="av-head" />
        <div className="av-eye-l" />
        <div className="av-eye-r" />
        <div className="av-beard" />
        <div className="av-hat" />
      </div>
    )
  }
  return (
    <div className="avatar">
      <div className="av-body" style={{ background: bodyColor }} />
      <div className="av-head" />
      <div className="av-eye-l" />
      <div className="av-eye-r" />
      <div className="av-mouth" />
      <div className="av-hat" />
      {tool && <div className="av-tool">{tool}</div>}
    </div>
  )
}

function SmurfCard({ s, onSelect }: { s: SmurfDef; onSelect: (k: string) => void }) {
  return (
    <div className="smurf-card" onClick={() => onSelect(s.key)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onSelect(s.key) }}>
      <Avatar bodyColor={s.bodyColor} tool={s.tool} />
      <div className="smurf-meta">
        <div className="smurf-name">{s.name}</div>
        <div className="smurf-role">{s.role}</div>
        <div className="smurf-badges">
          {s.badges.map((b, i) => (
            <span key={i} className={`badge${b.tone ? " badge-" + b.tone : ""}`}>{b.label}</span>
          ))}
        </div>
      </div>
      <span className={`smurf-status dot dot-${s.status}`} />
    </div>
  )
}

function HouseCard({ h, onSelect }: { h: HouseDef; onSelect: (k: string) => void }) {
  return (
    <div className="house" onClick={() => onSelect(h.key)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onSelect(h.key) }}>
      <div className="house-icon">{h.icon}</div>
      <div className="house-name">{h.name}</div>
      <div className="house-role">{h.role}</div>
    </div>
  )
}

function Drawer({ detail, onClose }: { detail: Detail | null; onClose: () => void }) {
  return (
    <aside className={`drawer${detail ? " open" : ""}`} aria-hidden={!detail}>
      <div className="drawer-head">
        <div>
          <div className="drawer-title">{detail?.title ?? "—"}</div>
          <div className="drawer-sub">{detail?.sub ?? "—"}</div>
        </div>
        <button className="close-btn" onClick={onClose} aria-label="Kapat">✕</button>
      </div>
      {detail && (
        <div className="drawer-body">
          <h4>Açıklama</h4>
          <p>{detail.desc}</p>
          <h4>Kullandığı AI / Servisler</h4>
          <ul>{detail.tools.map((t) => <li key={t}>{t}</li>)}</ul>
          <h4>Birlikte çalıştığı şirinler</h4>
          <ul>{detail.collab.length ? detail.collab.map((c) => <li key={c}>{c}</li>) : <li>—</li>}</ul>
          <h4>Durum</h4>
          <p>{detail.status}</p>
        </div>
      )}
    </aside>
  )
}

export function VillageCanvas() {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const detail = openKey ? DETAILS[openKey] ?? null : null

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenKey(null) }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  return (
    <div className="village-root">
      <div className="scenery">
        <div className="cloud c1" /><div className="cloud c2" /><div className="cloud c3" />
        <div className="tree t1" /><div className="tree t2" /><div className="tree t3" /><div className="tree t4" />
      </div>

      <header className="vc-header">
        <h1>🍄 MindID <span className="accent">Şirinler Köyü</span></h1>
        <p>Komuta merkezini Şirin Baba yönetir. Her şirin bir uzmanlık alanını ve onu güçlendiren AI modelini temsil eder.</p>
        <div className="legend">
          <span className="pill"><span className="dot dot-calisir" /> Çalışıyor</span>
          <span className="pill"><span className="dot dot-devam" /> Devam ediyor</span>
          <span className="pill"><span className="dot dot-hata" /> Eksik / Yapılacak</span>
          <span className="pill"><span className="dot dot-pasif" /> Pasif</span>
        </div>
      </header>

      <main className="vc-main">
        <div className="papa-wrap">
          <div className="smurf-card papa-card" onClick={() => setOpenKey("papa")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") setOpenKey("papa") }}>
            <Avatar bodyColor="#6cb8f7" papa />
            <div className="smurf-meta">
              <div className="smurf-name papa-name">Şirin Baba <span className="badge badge-gpt">GPT-4o-mini</span></div>
              <div className="smurf-role papa-role">Komuta Merkezi · Orkestratör Ajan</div>
              <div className="smurf-badges">
                <span className="badge">Görev Dağıtıcı</span>
                <span className="badge badge-firebase">Firebase</span>
                <span className="badge badge-late">Late API</span>
              </div>
            </div>
          </div>
        </div>

        <section className="hubs">
          {HUBS.map((hub) => (
            <div key={hub.id} className="hub" style={{ borderColor: hub.borderColor }}>
              <div className="hub-head">
                <div className="mushroom"><div className="cap" style={{ background: hub.capColor }} /><div className="stem" /></div>
                <div>
                  <div className="hub-title">{hub.title}</div>
                  <div className="hub-sub">{hub.sub}</div>
                </div>
              </div>
              {hub.houses ? (
                <div className="houses">
                  {hub.houses.map((h) => <HouseCard key={h.key} h={h} onSelect={setOpenKey} />)}
                </div>
              ) : (
                <div className="smurfs">
                  {hub.smurfs?.map((s) => <SmurfCard key={s.key} s={s} onSelect={setOpenKey} />)}
                </div>
              )}
            </div>
          ))}
        </section>

        <p className="vc-hint">Tıkla → her şirinin görevi, kullandığı AI/servisler ve birlikte çalıştığı diğer şirinler açılır.</p>
      </main>

      <Drawer detail={detail} onClose={() => setOpenKey(null)} />

      <style jsx>{`
        .village-root {
          position: relative;
          min-height: 100%;
          width: 100%;
          color: #1a2540;
          background:
            radial-gradient(ellipse at 20% 0%, #d8efff 0%, transparent 55%),
            radial-gradient(ellipse at 80% 0%, #e2f5e8 0%, transparent 60%),
            linear-gradient(180deg, #b9e3ff 0%, #e9f5ff 35%, #dff2dc 70%, #c4e3b9 100%);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
          overflow: hidden;
        }
        .scenery { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .cloud { position: absolute; width: 120px; height: 40px; background: rgba(255,255,255,0.85); border-radius: 40px; filter: blur(0.5px); opacity: 0.7; }
        .cloud::before, .cloud::after { content: ""; position: absolute; background: rgba(255,255,255,0.85); border-radius: 50%; }
        .cloud::before { width: 60px; height: 60px; top: -25px; left: 15px; }
        .cloud::after  { width: 50px; height: 50px; top: -20px; right: 20px; }
        .cloud.c1 { top: 60px; left: 8%; }
        .cloud.c2 { top: 110px; right: 12%; transform: scale(1.2); }
        .cloud.c3 { top: 220px; left: 55%; transform: scale(0.8); }
        .tree { position: absolute; bottom: -20px; width: 0; height: 0; border-left: 35px solid transparent; border-right: 35px solid transparent; border-bottom: 90px solid #2f6b38; opacity: 0.35; }
        .tree::after { content: ""; position: absolute; left: -10px; top: 70px; width: 20px; height: 30px; background: #5a3a1a; }
        .tree.t1 { left: 3%; }
        .tree.t2 { right: 4%; transform: scale(1.3); }
        .tree.t3 { left: 30%; transform: scale(0.8); opacity: 0.25; }
        .tree.t4 { right: 35%; transform: scale(1.1); opacity: 0.3; }

        .vc-header { position: relative; z-index: 2; padding: 32px 24px 16px; text-align: center; }
        .vc-header h1 { margin: 0; font-size: 28px; letter-spacing: -0.3px; }
        .vc-header h1 .accent { background: linear-gradient(90deg, #d94343, #ff7d3a); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .vc-header p { margin: 6px 0 0; color: #4a5a78; font-size: 14px; }

        .legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin: 14px 0 0; }
        .pill { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.92); border: 1px solid rgba(47,107,56,0.25); border-radius: 999px; padding: 5px 12px; font-size: 12px; box-shadow: 0 6px 20px rgba(20,40,80,0.12); }
        .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .dot-calisir { background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.18); }
        .dot-devam   { background: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.18); }
        .dot-hata    { background: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.18); }
        .dot-pasif   { background: #94a3b8; box-shadow: 0 0 0 3px rgba(148,163,184,0.18); }

        .vc-main { position: relative; z-index: 2; max-width: 1280px; margin: 0 auto; padding: 24px; }
        .papa-wrap { display: flex; justify-content: center; margin: 12px 0 8px; }

        .hubs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 24px; }
        @media (max-width: 1100px) { .hubs { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px)  { .hubs { grid-template-columns: 1fr; } }

        .hub { background: rgba(255,255,255,0.92); border: 2px solid rgba(47,107,56,0.25); border-radius: 18px; padding: 14px; box-shadow: 0 6px 20px rgba(20,40,80,0.12); backdrop-filter: blur(6px); }
        .hub-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .mushroom { width: 44px; height: 44px; flex-shrink: 0; position: relative; }
        .mushroom .cap { position: absolute; top: 0; left: 0; width: 44px; height: 26px; background: #d94343; border-radius: 44px 44px 6px 6px / 26px 26px 6px 6px; }
        .mushroom .cap::before, .mushroom .cap::after { content: ""; position: absolute; background: #fff5ec; border-radius: 50%; }
        .mushroom .cap::before { width: 8px; height: 8px; top: 6px; left: 9px; }
        .mushroom .cap::after  { width: 6px; height: 6px; top: 12px; right: 10px; }
        .mushroom .stem { position: absolute; bottom: 0; left: 12px; width: 20px; height: 22px; background: #f6efe2; border-radius: 4px 4px 6px 6px; border: 1px solid #e0d4be; }
        .hub-title { font-weight: 700; font-size: 15px; line-height: 1.2; }
        .hub-sub { font-size: 12px; color: #4a5a78; margin-top: 2px; }

        .smurfs { display: grid; grid-template-columns: 1fr; gap: 10px; }
        .smurf-card { display: grid; grid-template-columns: 56px 1fr auto; gap: 10px; align-items: center; padding: 10px; background: rgba(255,255,255,0.85); border: 1px solid rgba(47,107,56,0.25); border-radius: 14px; cursor: pointer; transition: transform 0.12s, box-shadow 0.12s, background 0.12s; outline: none; }
        .smurf-card:hover, .smurf-card:focus-visible { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(20,40,80,0.12); background: #fff; }
        .papa-card { grid-template-columns: 110px 1fr; max-width: 520px; padding: 14px 18px; background: linear-gradient(135deg, #fff 0%, #ffe8e2 100%); border: 2px solid #f4b1a3; }

        .avatar { width: 56px; height: 56px; position: relative; flex-shrink: 0; }
        .av-body { position: absolute; bottom: 0; left: 8px; width: 40px; height: 30px; background: #6cb8f7; border-radius: 22px 22px 8px 8px; }
        .av-head { position: absolute; top: 8px; left: 12px; width: 32px; height: 32px; background: #6cb8f7; border-radius: 50%; border: 1.5px solid #2f7fc7; }
        .av-eye-l, .av-eye-r { position: absolute; top: 18px; width: 4px; height: 5px; background: #1a2540; border-radius: 50%; }
        .av-eye-l { left: 19px; }
        .av-eye-r { left: 27px; }
        .av-mouth { position: absolute; top: 27px; left: 22px; width: 8px; height: 3px; border-bottom: 1.5px solid #1a2540; border-radius: 0 0 6px 6px; }
        .av-hat { position: absolute; top: -2px; left: 10px; width: 36px; height: 18px; background: #fff; border-radius: 36px 36px 4px 4px / 22px 22px 4px 4px; box-shadow: inset 0 -2px 0 rgba(0,0,0,0.05); }
        .av-hat::after { content: ""; position: absolute; top: -6px; left: 14px; width: 12px; height: 10px; background: #fff; border-radius: 50% 50% 0 0; transform: rotate(-15deg); }

        .avatar.papa { width: 100px; height: 100px; }
        .avatar.papa .av-body { left: 18px; width: 64px; height: 50px; bottom: 0; background: #6cb8f7; border-radius: 32px 32px 12px 12px; }
        .avatar.papa .av-head { top: 18px; left: 24px; width: 52px; height: 52px; }
        .avatar.papa .av-eye-l { top: 36px; left: 36px; width: 5px; height: 6px; }
        .avatar.papa .av-eye-r { top: 36px; left: 50px; width: 5px; height: 6px; }
        .avatar.papa .av-mouth { display: none; }
        .avatar.papa .av-beard { position: absolute; top: 50px; left: 28px; width: 44px; height: 28px; background: #f4f4f4; border-radius: 30px 30px 22px 22px / 18px 18px 28px 28px; border: 1px solid #d8d8d8; }
        .avatar.papa .av-hat { background: #d94343; top: 4px; left: 22px; width: 56px; height: 26px; border-radius: 56px 56px 4px 4px / 30px 30px 4px 4px; }
        .avatar.papa .av-hat::after { background: #d94343; top: -10px; left: 22px; width: 16px; height: 14px; }

        .av-tool { position: absolute; right: -2px; bottom: 4px; width: 22px; height: 22px; background: #fff; border: 1.5px solid rgba(47,107,56,0.25); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }

        .smurf-meta { min-width: 0; }
        .smurf-name { font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .papa-name { font-size: 18px; }
        .papa-role { font-size: 13px; }
        .smurf-role { font-size: 12px; color: #4a5a78; margin-top: 1px; }
        .smurf-badges { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
        .badge { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 999px; background: #f0f6ff; border: 1px solid #c8dcf6; color: #1d4a8b; white-space: nowrap; }
        .badge-gemini   { background: #f3e8ff; border-color: #d8b4fe; color: #6b21a8; }
        .badge-veo      { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }
        .badge-kling    { background: #fef3c7; border-color: #fcd34d; color: #854d0e; }
        .badge-heygen   { background: #ffedd5; border-color: #fdba74; color: #9a3412; }
        .badge-gpt      { background: #dcfce7; border-color: #86efac; color: #166534; }
        .badge-firebase { background: #fff7ed; border-color: #fdba74; color: #9a3412; }
        .badge-nocodb   { background: #cffafe; border-color: #67e8f9; color: #155e75; }
        .badge-late     { background: #fce7f3; border-color: #f9a8d4; color: #9d174d; }
        .badge-serper   { background: #ede9fe; border-color: #c4b5fd; color: #5b21b6; }
        .badge-fal      { background: #fae8ff; border-color: #f0abfc; color: #86198f; }
        .badge-n8n      { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }
        .badge-meta     { background: #dbeafe; border-color: #93c5fd; color: #1e40af; }

        .smurf-status { width: 10px; height: 10px; border-radius: 50%; align-self: start; margin-top: 8px; }

        .houses { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .house { text-align: center; padding: 10px 6px; background: #eaf4ff; border-radius: 12px; border: 1px solid rgba(47,107,56,0.25); cursor: pointer; transition: transform 0.12s; outline: none; }
        .house:hover, .house:focus-visible { transform: translateY(-2px); background: #fff; }
        .house-icon { font-size: 22px; }
        .house-name { font-size: 11px; font-weight: 700; margin-top: 4px; }
        .house-role { font-size: 10px; color: #4a5a78; margin-top: 2px; }

        .vc-hint { text-align: center; color: #4a5a78; font-size: 12px; margin-top: 18px; }

        .drawer { position: absolute; top: 0; right: 0; width: min(380px, 92vw); height: 100%; background: #fff; border-left: 1px solid rgba(47,107,56,0.25); box-shadow: -10px 0 30px rgba(0,0,0,0.12); transform: translateX(100%); transition: transform 0.25s ease; z-index: 50; overflow-y: auto; }
        .drawer.open { transform: translateX(0); }
        .drawer-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding: 16px; border-bottom: 1px solid rgba(47,107,56,0.25); position: sticky; top: 0; background: #fff; z-index: 1; }
        .drawer-title { font-weight: 700; font-size: 18px; }
        .drawer-sub { font-size: 12px; color: #4a5a78; margin-top: 2px; }
        .close-btn { border: none; background: transparent; font-size: 20px; cursor: pointer; color: #4a5a78; padding: 4px 8px; }
      `}</style>
      <style jsx global>{`
        .drawer-body { padding: 16px; }
        .drawer-body h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #4a5a78; margin: 14px 0 6px; }
        .drawer-body p { font-size: 13px; line-height: 1.55; margin: 0; }
        .drawer-body ul { margin: 0; padding-left: 16px; font-size: 13px; line-height: 1.6; }
      `}</style>
    </div>
  )
}

export default VillageCanvas
