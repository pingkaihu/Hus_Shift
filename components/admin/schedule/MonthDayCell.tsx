'use client'

import type { Shift, Profile, ScheduleEntry, Holiday, ScheduleMatrix } from '@/lib/types'
import StaffChip from '@/components/admin/schedule/StaffChip'

interface Props {
  date: string
  isCurrentMonth: boolean
  isToday: boolean
  holiday: Holiday | undefined
  shifts: Shift[]
  matrix: ScheduleMatrix
  profiles: Profile[]
  isSelected: boolean
  isSelectingMode: boolean
  filteredProfileId: string | null
  density: 'full' | 'compact'
  onClick: () => void
  onDelete: (entry: ScheduleEntry) => void
}

export default function MonthDayCell({
  date,
  isCurrentMonth,
  isToday,
  holiday,
  shifts,
  matrix,
  profiles,
  isSelected,
  isSelectingMode,
  filteredProfileId,
  density,
  onClick,
  onDelete,
}: Props) {
  const dayNumber = date.slice(8) // "DD" portion

  const isHoliday = holiday?.is_holiday === true
  const isMakeupDay = holiday !== undefined && !holiday.is_holiday
  const showHolidayName = holiday && holiday.source !== 'weekend'

  let dateNumberClass = 'text-zinc-700'
  if (isToday) {
    dateNumberClass = ''
  } else if (isHoliday) {
    dateNumberClass = 'text-red-500'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative flex flex-col items-start p-1 w-full min-h-[90px] rounded-md border text-left',
        'transition-colors focus:outline-none',
        isSelected
          ? 'ring-2 ring-[var(--accent-500)] border-[var(--accent-200)] bg-[var(--accent-50)]'
          : 'border-zinc-200 bg-white hover:bg-zinc-50',
        !isCurrentMonth ? 'opacity-40' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Date number */}
      <div className="flex flex-col items-start w-full">
        <div
          className={[
            'w-5 h-5 flex items-center justify-center rounded-full text-xs font-semibold',
            isToday
              ? 'bg-[var(--accent-500)] text-white'
              : dateNumberClass,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {parseInt(dayNumber, 10)}
        </div>

        {/* Holiday name */}
        {showHolidayName && (
          <span
            className={[
              'text-[9px] leading-tight mt-0.5',
              isHoliday ? 'text-red-500' : isMakeupDay ? 'text-amber-600' : 'text-zinc-400',
            ].join(' ')}
          >
            {holiday.name}
          </span>
        )}
      </div>

      {/* Entries */}
      {density === 'full' ? (
        <div className="flex flex-col gap-0.5 mt-1 w-full">
          {shifts.map((shift) => {
            const entries = matrix[shift.id]?.[date] ?? []
            if (entries.length === 0) return null
            return (
              <div key={shift.id} className="flex items-start gap-0.5">
                {/* Left color bar */}
                <div
                  className="w-0.5 self-stretch rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: shift.color }}
                />
                <div className="flex flex-wrap gap-0.5">
                  {entries.map((entry) => {
                    const profile = profiles.find((p) => p.id === entry.profile_id)
                    if (!profile) return null
                    const dimmed =
                      filteredProfileId !== null && filteredProfileId !== entry.profile_id
                    return (
                      <span
                        key={entry.id}
                        style={{ '--shift-color': shift.color } as React.CSSProperties}
                      >
                        <StaffChip
                          entry={entry}
                          profile={profile}
                          dimmed={dimmed}
                          onDelete={(e) => {
                            onDelete(e)
                          }}
                        />
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1 mt-1">
          {shifts.map((shift) => {
            const entries = matrix[shift.id]?.[date] ?? []
            if (entries.length === 0) return null
            return (
              <div key={shift.id} className="flex items-center gap-0.5">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: shift.color }}
                />
                <span className="text-[10px] text-zinc-600">{entries.length}</span>
              </div>
            )
          })}
        </div>
      )}
      {/* Selection mode circle indicator (mobile batch select) */}
      {isSelectingMode && (
        <div
          className={[
            'absolute top-1 right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center',
            isSelected
              ? 'bg-[var(--accent-500)] border-[var(--accent-500)]'
              : 'bg-white border-zinc-300',
          ].join(' ')}
        >
          {isSelected && (
            <svg
              className="w-2.5 h-2.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}
    </button>
  )
}
