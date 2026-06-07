'use client'

export default function WeekError() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <p className="text-zinc-600">載入失敗，請重新整理</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-[var(--accent-500)] hover:underline"
        >
          重新整理
        </button>
      </div>
    </div>
  )
}
