'use client'

export default function CalendarError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--neutral-50)]">
      <div className="text-center">
        <p className="text-[var(--neutral-700)] mb-3">載入失敗，請重新整理</p>
        <button
          onClick={reset}
          className="text-sm text-[var(--accent-500)] hover:underline"
        >
          重新整理
        </button>
      </div>
    </div>
  )
}
