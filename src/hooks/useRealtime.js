import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

export const useRealtime = (table, query = '*') => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: initialData, error: fetchError } = await supabase
          .from(table)
          .select(query)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setData(initialData || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up realtime subscription
    const channel = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setData(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new : item
            ))
          } else if (payload.eventType === 'DELETE') {
            setData(prev => prev.filter(item => item.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, query])

  return { data, loading, error, setData }
}