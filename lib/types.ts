export type Profile = {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: 'admin' | 'staff'
  is_active: boolean
  created_at: string
}

export type PublicProfile = {
  id: string
  full_name: string
  role: 'admin' | 'staff'
}

export type Shift = {
  id: string
  name: string
  start_time: string   // "HH:MM:SS" from Postgres time type
  end_time: string
  color: string        // hex, e.g. "#4F81BD"
}

export type ScheduleEntry = {
  id: string
  profile_id: string
  shift_id: string
  work_date: string    // "YYYY-MM-DD"
  note: string | null
  created_at: string
}

export type Holiday = {
  date: string         // "YYYY-MM-DD"
  name: string
  is_holiday: boolean  // true = day off, false = make-up workday
  description: string | null
  year: number
  source: 'government' | 'weekend' | 'manual'
}

// Each cell holds all entries for (shift, date) — multiple staff per shift per day
export type ScheduleMatrix = {
  [shiftId: string]: {
    [date: string]: ScheduleEntry[]
  }
}

export type SelectionState =
  | { mode: 'idle' }
  | { mode: 'single'; date: string }
  | { mode: 'dragging'; dates: string[] }
  | { mode: 'multi'; dates: string[] }