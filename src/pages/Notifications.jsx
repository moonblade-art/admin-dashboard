import { useEffect, useState } from 'react'
import { Send, Bell, Trash2 } from 'lucide-react'
import { supabase } from '../services/supabase'
import { useRealtime } from '../hooks/useRealtime'
import DataTable from '../components/DataTable'

const Notifications = () => {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const { data: notifications, loading, setData: setNotifications } = useRealtime('notifications', '*, profiles(email)')

  const handleSendNotification = async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          message: message.trim(),
          sent_by: user.id,
        }])
        .select()

      if (error) throw error

      setMessage('')
      // Realtime will update the list
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('Error sending notification: ' + error.message)
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this notification?')) return
    
    try {
      await supabase.from('notifications').delete().eq('id', id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const columns = [
    { 
      key: 'message', 
      label: 'Message',
      render: (val) => <span className="font-medium text-text-primary">{val}</span>
    },
    { 
      key: 'sent_by', 
      label: 'Sent By',
      render: (_, row) => row.profiles?.email || 'Unknown'
    },
    { 
      key: 'sent_at', 
      label: 'Sent At',
      render: (val) => new Date(val).toLocaleString()
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Notification System</h1>
        <p className="text-text-secondary">Send notifications to all users</p>
      </div>

      <div className="card">
        <form onSubmit={handleSendNotification} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Notification Message
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Bell className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your notification message..."
                  className="input-field pl-12"
                  maxLength={500}
                />
              </div>
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="btn-primary flex items-center gap-2 px-6"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send
              </button>
            </div>
            <p className="text-xs text-text-secondary mt-2">
              {message.length}/500 characters
            </p>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Sent Notifications</h3>
        <DataTable
          columns={columns}
          data={notifications}
          searchable
          pagination
          actions={(row) => (
            <button 
              onClick={() => handleDelete(row.id)}
              className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        />
      </div>
    </div>
  )
}

export default Notifications