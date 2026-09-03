import { supabase } from "@/lib/supabase"

export const dataService = {
  async query<T>(table: string, options?: {
    select?: string
    filter?: Record<string, unknown>
    order?: { column: string; ascending?: boolean }
    limit?: number
    single?: boolean
  }): Promise<T> {
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
    const { data: result, error } = await supabase
      .from(table)
      .insert(data as any)
      .select()
      .single()
    if (error) throw error
    return result as T
  },

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await supabase
      .from(table)
      .update(data as any)
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
    const { data, error } = await supabase.functions.invoke(name, { body })
    if (error) throw error
    return data as T
  },
}
