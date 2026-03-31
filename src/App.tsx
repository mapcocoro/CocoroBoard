import { useState, useEffect } from 'react'
import type { BoardData, Client } from './types'
import { ClientCard } from './components/ClientCard'
import { SummaryBar } from './components/SummaryBar'

type Filter = 'active' | 'all' | 'client' | 'ios' | 'web' | 'line' | 'demo' | 'book' | 'youtube' | 'tool'

const FILTERS: [Filter, string][] = [
  ['active', '進行中'],
  ['all', 'すべて'],
  ['client', 'クライアント'],
  ['ios', 'iOSアプリ'],
  ['web', 'Webアプリ'],
  ['line', 'LINE'],
  ['demo', 'デモ'],
  ['book', '書籍'],
  ['youtube', 'YouTube'],
  ['tool', '社内ツール'],
]

function App() {
  const [data, setData] = useState<BoardData | null>(null)
  const [filter, setFilter] = useState<Filter>('active')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data.json')
      .then(r => r.json())
      .then(setData)
  }, [])

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    )
  }

  const clients = data.clients
  const filtered = filterClients(clients, filter)

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">CocoroBoard</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              最終更新: {new Date(data.generated).toLocaleString('ja-JP')}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Summary */}
        <SummaryBar clients={clients} />

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(([key, label]) => {
            const count = filterClients(clients, key).length
            if (count === 0) return null
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {label}
                <span className="ml-1.5 text-xs opacity-70">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Client List */}
        <div className="space-y-3">
          {filtered.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              expanded={expandedId === client.id}
              onToggle={() => setExpandedId(expandedId === client.id ? null : client.id)}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

function isActive(c: Client): boolean {
  const s = c.project?.status ?? ''
  // 明確にアクティブなもの
  if (s.includes('制作中') || s.includes('提案') || s.includes('待ち') || s.includes('審査')) return true
  // 明確に完了・停止でないもの
  if (s === '納品完了' || s === '完了' || s === '公開中' || s === '失注') return false
  if (s.includes('停止') || s.includes('凍結')) return false
  if (c.category.includes('失注')) return false
  // 稼働中の社内ツール・Webアプリも進行中扱い
  if (s.includes('稼働') || s.includes('運営')) return true
  return false
}

function filterClients(clients: Client[], filter: Filter): Client[] {
  switch (filter) {
    case 'active':
      return clients.filter(isActive)
    case 'client':
      return clients.filter(c => c.category.startsWith('クライアント'))
    case 'ios':
      return clients.filter(c => c.category === 'iOSアプリ')
    case 'web':
      return clients.filter(c => c.category === 'Webアプリ')
    case 'line':
      return clients.filter(c => c.category === 'LINEミニアプリ')
    case 'demo':
      return clients.filter(c => c.category === 'デモサイト')
    case 'book':
      return clients.filter(c => c.category === '書籍')
    case 'youtube':
      return clients.filter(c => c.category === 'YouTube')
    case 'tool':
      return clients.filter(c => c.category === '社内ツール')
    default:
      return clients
  }
}

export default App
