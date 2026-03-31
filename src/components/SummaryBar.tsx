import type { Client } from '../types'

interface Props {
  clients: Client[]
}

export function SummaryBar({ clients }: Props) {
  const clientWork = clients.filter(c => c.category.startsWith('クライアント'))
  const unpaid = clientWork.filter(c => c.billing?.status === '請求済み')
  const totalRevenue = clientWork.reduce((sum, c) => {
    if (c.billing?.status === '入金済み' && typeof c.billing.amount === 'number') {
      return sum + c.billing.amount
    }
    return sum
  }, 0)
  const pendingRevenue = unpaid.reduce((sum, c) => {
    if (typeof c.billing?.amount === 'number') return sum + c.billing.amount
    return sum
  }, 0)

  const iosApps = clients.filter(c => c.category === 'iOSアプリ')
  const webApps = clients.filter(c => c.category === 'Webアプリ')
  const totalProducts = clients.filter(c =>
    !c.category.startsWith('クライアント') && c.category !== 'デモサイト' && c.category !== '社内ツール'
  )

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card
        label="未入金"
        value={unpaid.length > 0 ? `${unpaid.length}件` : 'なし'}
        sub={pendingRevenue > 0 ? `¥${pendingRevenue.toLocaleString()}` : undefined}
        color={unpaid.length > 0 ? 'amber' : 'green'}
      />
      <Card
        label="売上（入金済み）"
        value={`¥${totalRevenue.toLocaleString()}`}
        color="green"
      />
      <Card
        label="iOSアプリ"
        value={`${iosApps.length}本`}
        sub={`Web ${webApps.length}本`}
        color="blue"
      />
      <Card
        label="全プロダクト"
        value={`${totalProducts.length}件`}
        color="purple"
      />
    </div>
  )
}

function Card({ label, value, sub, color }: {
  label: string
  value: string
  sub?: string
  color: string
}) {
  const colors: Record<string, string> = {
    blue: 'border-blue-800 bg-blue-950/30',
    amber: 'border-amber-800 bg-amber-950/30',
    green: 'border-green-800 bg-green-950/30',
    purple: 'border-purple-800 bg-purple-950/30',
  }

  return (
    <div className={`rounded-xl border p-3 ${colors[color] ?? colors.blue}`}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
