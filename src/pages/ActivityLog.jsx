import { useEffect, useState, useCallback } from 'react'
import { FileText, Database, Edit3, Trash2, Plus, Shield, Globe, Clock } from 'lucide-react'
import DataTable from '../components/DataTable'
import { supabase } from '../services/supabase'

const ACTION_CONFIG = {
  INSERT: { icon: Plus, color: 'text-green-600', bg: 'bg-green-100', label: 'Create' },
  UPDATE: { icon: Edit3, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Update' },
  DELETE: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-100', label: 'Delete' },
  LOGIN: { icon: Shield, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Login' },
  LOGOUT: { icon: Shield, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Logout' },
}

const getActionConfig = (action) => {
  const key = (action || '').toUpperCase()
  return ACTION_CONFIG[key] || { icon: Database, color: 'text-gray-600', bg: 'bg-gray-100', label: action || 'Unknown' }
}

const ActivityLog = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalLogs: 0,
    inserts: 0,
    updates: 0,
    deletes: 0,
  })

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const sanitizedData = (data || []).map(log => ({
        ...log,
        action: log.action || 'UNKNOWN',
        table_name: log.table_name || '-',
        record_id: log.record_id || '-',
        ip_address: log.ip_address || '-',
        user_agent: log.user_agent || '-',
        old_data: log.old_data || null,
        new_data: log.new_data || null,
        admin_user_id: log.admin_user_id || '-',
        created_at: log.created_at || new Date().toISOString(),
      }))

      setLogs(sanitizedData)

      // Calculate stats
      setStats({
        totalLogs: sanitizedData.length,
        inserts: sanitizedData.filter(l => (l.action || '').toUpperCase() === 'INSERT').length,
        updates: sanitizedData.filter(l => (l.action || '').toUpperCase() === 'UPDATE').length,
        deletes: sanitizedData.filter(l => (l.action || '').toUpperCase() === 'DELETE').length,
      })
    } catch (error) {
      console.error('Error fetching logs:', error)
      alert('Error fetching logs: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const formatDate = (val) => {
    if (!val) return '-'
    try {
      return new Date(val).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return '-'
    }
  }

  const formatJson = (data) => {
    if (!data) return '-'
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data
      return JSON.stringify(parsed, null, 2)
    } catch {
      return String(data)
    }
  }

  const truncateId = (id) => {
    if (!id || id === '-') return '-'
    return id.length > 8 ? `${id.substring(0, 8)}...` : id
  }

  const columns = [
    {
      key: 'action',
      label: 'Action',
      render: (val) => {
        const config = getActionConfig(val)
        const Icon = config.icon
        return (
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 ${config.bg} rounded-lg flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${config.color}`} />
            </div>
            <span className={`font-medium ${config.color}`}>{config.label}</span>
          </div>
        )
      }
    },
    {
      key: 'table_name',
      label: 'Table',
      render: (val) => (
        <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-mono text-text-secondary">
          {val || '-'}
        </span>
      )
    },
    {
      key: 'record_id',
      label: 'Record ID',
      render: (val) => (
        <span className="font-mono text-xs text-text-secondary" title={val || ''}>
          {truncateId(val)}
        </span>
      )
    },
    {
      key: 'admin_user_id',
      label: 'Admin User',
      render: (val) => (
        <span className="font-mono text-xs text-text-secondary" title={val || ''}>
          {truncateId(val)}
        </span>
      )
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      render: (val) => (
        <div className="flex items-center gap-1">
          <Globe className="w-3 h-3 text-text-secondary" />
          <span className="text-sm text-text-secondary">{val || '-'}</span>
        </div>
      )
    },
    {
      key: 'old_data',
      label: 'Old Data',
      render: (val) => (
        <div className="max-w-[200px]">
          <pre className="text-xs text-text-secondary bg-gray-50 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
            {formatJson(val)}
          </pre>
        </div>
      )
    },
    {
      key: 'new_data',
      label: 'New Data',
      render: (val) => (
        <div className="max-w-[200px]">
          <pre className="text-xs text-text-secondary bg-gray-50 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
            {formatJson(val)}
          </pre>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Timestamp',
      render: (val) => (
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-text-secondary" />
          <span className="text-sm text-text-secondary">{formatDate(val)}</span>
        </div>
      )
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Activity Log</h1>
        <p className="text-text-secondary">Track all system activities and audit trails</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Total Logs</p>
            <p className="text-2xl font-bold text-text-primary">{stats.totalLogs.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Plus className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Creates</p>
            <p className="text-2xl font-bold text-text-primary">{stats.inserts.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Edit3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Updates</p>
            <p className="text-2xl font-bold text-text-primary">{stats.updates.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Deletes</p>
            <p className="text-2xl font-bold text-text-primary">{stats.deletes.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={logs}
          searchable
          sortable
          pagination
          itemsPerPage={15}
        />
      </div>
    </div>
  )
}

export default ActivityLog