import { supabase, useSupabase } from "@/lib/supabase"
import axios from "axios"

const baseUrl = import.meta.env.VITE_API_BASE_URL

export const dataService = {
  async query<T>(table: string, options?: {
    select?: string
    filter?: Record<string, unknown>
    order?: { column: string; ascending?: boolean }
    limit?: number
    single?: boolean
  }): Promise<T> {
    if (!useSupabase) {
      const endpoint = TABLE_TO_ENDPOINT[table]
      const { data } = await axios.get(`${baseUrl}${endpoint}`)
      return data as T
    }

    let query = supabase.from(table).select(options?.select ?? "*")

    if (options?.filter) {
      for (const [key, value] of Object.entries(options.filter)) {
        query = query.eq(key, value)
      }
    }
    if (options?.order) {
      query = query.order(options.order.column, {
        ascending: options.order.ascending ?? false,
      })
    }
    if (options?.limit) query = query.limit(options.limit)

    const result = options?.single
      ? await query.single()
      : await query

    if (result.error) throw result.error
    return result.data as T
  },

  async insert<T>(table: string, data: Partial<T>): Promise<T> {
    if (!useSupabase) {
      const endpoint = TABLE_TO_ENDPOINT[table]
      const { data: result } = await axios.post(`${baseUrl}${endpoint}`, data)
      return result as T
    }

    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return result as T
  },

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    if (!useSupabase) {
      const endpoint = TABLE_TO_ENDPOINT[table]
      const { data: result } = await axios.patch(
        `${baseUrl}${endpoint}/${id}`,
        data,
      )
      return result as T
    }

    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return result as T
  },

  async invokeFunction<T>(
    name: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    if (!useSupabase) {
      throw new Error(`Edge Function ${name} not available in MSW mode`)
    }

    const { data, error } = await supabase.functions.invoke(name, { body })
    if (error) throw error
    return data as T
  },
}

const TABLE_TO_ENDPOINT: Record<string, string> = {
  profiles: "/companion/profile",
  events: "/companion/events",
  refill_schedules: "/companion/refill-schedule",
  test_schedules: "/companion/test-schedules",
  medication_cards: "/companion/medication-cards",
  notifications: "/api/companion/notifications",
  payments: "/companion/payments",
  wallets: "/companion/wallet",
  chat_messages: "/companion/assistant/messages",
  education_content: "/companion/education-cards",
  education_progress: "/companion/lesson-progress",
}
