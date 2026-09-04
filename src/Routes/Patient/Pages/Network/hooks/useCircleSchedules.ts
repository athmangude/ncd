import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { RefillStatus } from "@/types/care-companion"

export interface CircleScheduleEvent {
  id: string
  memberId: string
  memberFirstName: string
  memberLastName: string
  memberPhone: string
  type: "MEDICATION" | "TEST"
  name: string
  nextDate: string
  status: RefillStatus
  daysUntil: number
  isSelf: boolean
  cost: number
}

const DAY_MS = 86_400_000

function computeStatus(daysUntil: number, dbStatus: string): RefillStatus {
  if (dbStatus === "COMPLETED" || dbStatus === "CANCELLED")
    return dbStatus as RefillStatus
  if (daysUntil <= 0) return "OVERDUE"
  if (daysUntil <= 3) return "DUE"
  return "UPCOMING"
}

export const circleSchedulesQueryKey = "circleSchedules"

interface RpcRow {
  id: string
  memberId: string
  memberFirstName: string
  memberLastName: string
  memberPhone: string
  type: "MEDICATION" | "TEST"
  name: string
  nextDate: string
  dbStatus: string
  isSelf: boolean
  cost: number
}

export function useCircleSchedules() {
  return useQuery({
    queryKey: [circleSchedulesQueryKey],
    queryFn: async (): Promise<CircleScheduleEvent[]> => {
      const { data, error } = await supabase.rpc("get_circle_schedules")
      if (error) throw error

      const rows = (data ?? []) as RpcRow[]
      const now = new Date()

      const events: CircleScheduleEvent[] = rows.map((row) => {
        const days = Math.ceil(
          (new Date(row.nextDate).getTime() - now.getTime()) / DAY_MS,
        )
        return {
          id: row.id,
          memberId: row.memberId,
          memberFirstName: row.memberFirstName,
          memberLastName: row.memberLastName,
          memberPhone: row.memberPhone,
          type: row.type,
          name: row.name,
          nextDate: row.nextDate,
          status: computeStatus(days, row.dbStatus),
          daysUntil: days,
          isSelf: row.isSelf,
          cost: row.cost ?? 0,
        }
      })

      events.sort((a, b) => {
        const statusOrder: Record<string, number> = {
          OVERDUE: 0,
          DUE: 1,
          UPCOMING: 2,
        }
        const sa = statusOrder[a.status] ?? 99
        const sb = statusOrder[b.status] ?? 99
        if (sa !== sb) return sa - sb
        return a.daysUntil - b.daysUntil
      })

      return events
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useMemberSchedules(phoneNumber: string | null) {
  return useQuery({
    queryKey: ["memberSchedules", phoneNumber],
    queryFn: async (): Promise<{
      refills: CircleScheduleEvent[]
      tests: CircleScheduleEvent[]
    }> => {
      if (!phoneNumber) return { refills: [], tests: [] }

      const { data, error } = await supabase.rpc("get_circle_schedules")
      if (error) throw error

      const rows = (data ?? []) as RpcRow[]
      const now = new Date()

      const memberRows = rows.filter((r) => r.memberPhone === phoneNumber)

      const refills: CircleScheduleEvent[] = []
      const tests: CircleScheduleEvent[] = []

      for (const row of memberRows) {
        const days = Math.ceil(
          (new Date(row.nextDate).getTime() - now.getTime()) / DAY_MS,
        )
        const event: CircleScheduleEvent = {
          id: row.id,
          memberId: row.memberId,
          memberFirstName: row.memberFirstName,
          memberLastName: row.memberLastName,
          memberPhone: row.memberPhone,
          type: row.type,
          name: row.name,
          nextDate: row.nextDate,
          status: computeStatus(days, row.dbStatus),
          daysUntil: days,
          isSelf: row.isSelf,
          cost: row.cost ?? 0,
        }
        if (row.type === "MEDICATION") {
          refills.push(event)
        } else {
          tests.push(event)
        }
      }

      return { refills, tests }
    },
    enabled: !!phoneNumber,
    staleTime: 5 * 60 * 1000,
  })
}
