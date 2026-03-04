# Chat Sayfası Mimari Planı

## Genel Bakış
Admin panelden erişilen, birden fazla AI servisini (Kling AI, Higgsfield vb.) tek ekrandan yöneten chat arayüzü. LLM tool-calling ile servis routing yapılacak.

## Kararlar
- **Backend**: Ayrı Python container (Cloud Run), mevcut backend'den bağımsız
- **LLM**: Büyük ihtimal Gemini Flash (ucuz + iyi tool calling) - kesinleşmedi
- **AI Servisleri**: Kling AI kesin, diğerleri ileride eklenir
- **Streaming**: Evet, token-token streaming yanıt
- **Thread**: Tek thread, çoklu thread yok (şimdilik)
- **Chat History**: Firebase Firestore'da saklanacak
- **Business bağlantısı**: İleride eklenecek, ilk aşamada yok

## Tech Stack
- **Frontend**: Vercel AI SDK (`useChat` hook) + Next.js
- **Backend**: FastAPI + google-genai SDK (direkt Gemini)
- **LLM**: Gemini 2.0 Flash (ucuz, hızlı, iyi tool calling)
- **Protokol**: Data Stream Protocol (SSE) - Vercel AI SDK ↔ FastAPI
- **Helper**: `fastapi-ai-sdk` (SSE format helper)

## Firebase Veri Yapısı
```
chat_threads/{threadId}
  ├── title: string
  ├── createdAt / updatedAt: Timestamp
  ├── userId: string
  ├── businessId?: string          // ileride
  ├── lastMessage: string          // preview
  │
  └── messages/{messageId}         // subcollection
        ├── role: "user" | "assistant" | "tool_result"
        ├── content: string
        ├── timestamp: Timestamp
        ├── attachments?: [{
        │     type: "video" | "image",
        │     url: string,
        │     service: "higgsfield" | "kling" | "runway" | ...,
        │     status: "generating" | "completed" | "failed",
        │     jobId?: string
        │   }]
        ├── toolCall?: { name, args, service }
        └── metadata?: { model, tokens }
```

## Backend API Yapısı (Python - FastAPI)
```
POST /chat/send        → Mesaj gönder, LLM yanıtı al (streaming)
POST /chat/threads     → Yeni thread oluştur
GET  /chat/threads     → Thread listesi
GET  /chat/threads/{id}/messages  → Mesajları getir (pagination)
```

## Akış
1. User mesaj yazar → POST /chat/send
2. Backend mesajı Firestore'a kaydeder
3. LLM'e thread history + tools ile gönderir
4. LLM tool çağırırsa → ilgili servis API'si çağrılır (Kling vb.)
5. Yanıt streaming olarak döner + Firestore'a kaydedilir
6. Async joblar (video üretimi) için: jobId kaydedilir → worker poll eder → Firestore günceller
7. Frontend onSnapshot ile realtime güncelleme alır

## Kütüphane Araştırması

### Frontend Seçenekleri
| | Vercel AI SDK | CopilotKit |
|---|---|---|
| Ne yapar | `useChat` hook ile streaming chat UI | Hazır chat bileşenleri + copilot |
| Python backend | Evet - Data Stream Protocol | Evet - Python SDK var |
| Karmaşıklık | Basit | Orta (opinionated) |
| Sonuç | **Seçildi** - Next.js doğal uyum | Elenmiş - fazla opinionated |

### Backend Seçenekleri
| | google-genai | OpenAI SDK | LangChain | PydanticAI |
|---|---|---|---|---|
| Streaming | Evet | Evet | Evet | Evet |
| Tool calling | Evet + auto-call | Evet | Evet | Evet + validation |
| Karmaşıklık | Basit | Basit | Orta-Karmaşık | Basit-Orta |
| Sonuç | **Seçildi** - ucuz, basit | Alternatif | Şimdilik gereksiz | Alternatif |

### Elenenler
- **Mastra**: Sadece TypeScript, Python backend ile çalışmaz
- **CrewAI**: Batch-oriented, streaming chat için uygun değil
- **LlamaIndex**: RAG/doküman odaklı, bu proje için gereksiz
- **Anthropic SDK**: Claude pahalı, router LLM için mantıksız

## Frontend (Mevcut Durum)
- `/chat` route'u oluşturuldu (app/chat/page.tsx)
- ProtectedRoute ile korunuyor
- Mock response ile çalışıyor, backend entegrasyonu yapılacak
- Sol menüde "Chat" seçeneği eklendi (router.push ile yönlendirme)

## Sonraki Adımlar
1. Backend: FastAPI + google-genai + Kling AI tool tanımlama
2. Frontend: Vercel AI SDK entegrasyonu (useChat hook)
3. Firebase: chat_threads collection + mesaj kaydetme
4. Streaming: Data Stream Protocol ile SSE bağlantısı
5. Async jobs: Video üretimi için polling/webhook sistemi
