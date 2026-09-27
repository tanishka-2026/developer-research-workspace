// Frontend API wrapper for POST /api/chat
// The Vite proxy rewrites /api/* → http://localhost:3001

export interface ChatMessage {
  role: 'user' | 'ai'
  text: string
}

export interface ChatPayload {
  message: string
  history: ChatMessage[]
  research: {
    title: string
    question: string
    goal: string
    domain: string
    context: string
    summary: string
    findings: Array<{ id: string; title: string; summary: string; category: string; tags: string[] }>
    evidence: Array<{ id: string; text: string; category: string }>
    sources: Array<{ id: string; label: string; url?: string }>
    relationships: Array<{ from: string; to: string; label: string }>
    insights: Array<{ metric: string; valueA: number; valueB: number; labelA: string; labelB: string }>
  }
}

export async function sendChatMessage(payload: ChatPayload): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({})) as { error?: unknown; reply?: unknown }
  if (!res.ok) {
    const message = typeof data.error === 'string' ? data.error : `/api/chat failed with status ${res.status}`
    throw new Error(message)
  }
  if (typeof data.reply !== 'string' || !data.reply.trim()) {
    throw new Error('The chat service returned an empty response.')
  }
  return data.reply
}
