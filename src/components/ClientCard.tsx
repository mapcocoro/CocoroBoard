import type { Client } from '../types'

interface Props {
  client: Client
  expanded: boolean
  onToggle: () => void
}

export function ClientCard({ client, expanded, onToggle }: Props) {
  const c = client
  const statusColor = getStatusColor(c)

  return (
    <div
      className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden transition-all"
    >
      {/* Summary Row */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-800/50 transition-colors"
      >
        {/* Status dot */}
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusColor}`} />

        {/* Name & type */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{c.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {c.project?.type ?? c.category}
          </p>
        </div>

        {/* Status badge */}
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 shrink-0">
          {c.project?.status ?? '-'}
        </span>

        {/* Billing badge */}
        {c.billing?.status && (
          <BillingBadge status={c.billing.status} amount={c.billing.amount} />
        )}

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-800 space-y-3">
          {/* Contact */}
          {c.contact?.name && (
            <Section title="連絡先">
              <Row label="担当" value={c.contact.name} />
              {c.contact.phone && <Row label="電話" value={c.contact.phone} />}
              {c.contact.fax && <Row label="FAX" value={c.contact.fax} />}
              {c.contact.email && (
                <Row label="メール" value={c.contact.email} link={`mailto:${c.contact.email}`} />
              )}
              {c.contact.address && <Row label="住所" value={c.contact.address} />}
            </Section>
          )}

          {/* Project */}
          {c.project && (
            <Section title="案件">
              {c.project.tech && <Row label="技術" value={c.project.tech} />}
              {c.project.deadline && <Row label="期限" value={c.project.deadline} />}
              {c.project.url && (
                <Row label="URL" value={c.project.url} link={c.project.url} />
              )}
            </Section>
          )}

          {/* Billing */}
          {c.billing?.amount && (
            <Section title="請求">
              <Row
                label="金額"
                value={typeof c.billing.amount === 'number'
                  ? `¥${c.billing.amount.toLocaleString()}`
                  : String(c.billing.amount)
                }
              />
              {c.billing.status && <Row label="状態" value={c.billing.status} />}
              {c.billing.due_date && <Row label="期限" value={c.billing.due_date} />}
            </Section>
          )}

          {/* Referral */}
          {c.referral && <Row label="紹介元" value={c.referral} />}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium mb-1">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function Row({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div className="flex text-sm gap-2">
      <span className="text-gray-500 w-16 shrink-0">{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">
          {value}
        </a>
      ) : (
        <span className="text-gray-200 truncate">{value}</span>
      )}
    </div>
  )
}

function BillingBadge({ status, amount }: { status: string; amount?: number | string }) {
  const isUnpaid = status === '請求済み'
  const isPaid = status === '入金済み'

  const bg = isUnpaid ? 'bg-amber-900/50 text-amber-300' : isPaid ? 'bg-green-900/50 text-green-300' : 'bg-gray-800 text-gray-300'

  const display = typeof amount === 'number' ? `¥${amount.toLocaleString()}` : status

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${bg}`}>
      {isUnpaid ? `${display} 未入金` : isPaid ? `${display}` : display}
    </span>
  )
}

function getStatusColor(c: Client): string {
  if (c.category.includes('失注')) return 'bg-gray-500'
  const s = c.project?.status ?? ''
  if (s.includes('停止') || s.includes('凍結')) return 'bg-red-500'
  if (s === '納品完了') return 'bg-green-500'
  if (s.includes('稼働') || s.includes('デプロイ')) return 'bg-green-500'
  if (s.includes('制作中') || s.includes('審査')) return 'bg-blue-500'
  if (s.includes('待ち') || s.includes('提案')) return 'bg-amber-500'
  return 'bg-gray-500'
}
