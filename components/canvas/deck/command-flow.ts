/**
 * MindID portalındaki gerçek komut akışı (anlam şeması için referans).
 * Harita v2 bunu adım adım göstermeli; şu an kısmen repo ağacı + kablolar.
 */
export const COMMAND_FLOW_STEPS = [
  {
    step: 1,
    who: "Sen (Seyma)",
    action: "Agent sayfasında görev yazarsın, isteğe referans eklersin.",
  },
  {
    step: 2,
    who: "MindID Panel",
    action: "İsteği /api/agent-task üzerinden mind-agent'e iletir; Firestore'da görev kaydı açılır.",
  },
  {
    step: 3,
    who: "Orkestratör (mind-agent)",
    action: "Görevi okur; görsel / video / pazarlama / analiz ajanından birine veya birkaçına yönlendirir.",
  },
  {
    step: 4,
    who: "Uzman ajanlar",
    action: "İşi yapar (üretim, analiz vb.); araçlar ve modeller burada devreye girer.",
  },
  {
    step: 5,
    who: "Firestore + Aktif Görevler",
    action: "Sonuç ve durum yazılır; panelde 'Aktif Görevler' ve sohbette görürsün.",
  },
] as const

export const MAP_LEGEND = [
  { color: "solid", label: "Kalın çizgi + nabız = kim kimin altında (sahiplik / sıra)" },
  { color: "dashed", label: "İnce kesik çizgi = birlikte çalışır / veri veya komut gider" },
] as const

export const COMMAND_MODE_LEGEND = [
  "Soldan sağa = komutun gidişi (zaman sırası)",
  "Orkestratörden aşağı = uzman ajanlara dağıtım",
  "Ajanlardan Firestore'a = sonuç yazılır",
  "Adım rozeti = portaldeki sıra numarası",
] as const
