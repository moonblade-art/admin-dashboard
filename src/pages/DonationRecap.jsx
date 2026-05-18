import { useEffect, useState } from 'react'
import { Download, Filter } from 'lucide-react'
import DataTable from '../components/DataTable'
import { supabase } from '../services/supabase'

const DonationRecap = () => {
  const [donations, setDonations] = useState([])
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    community: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: donationsData } = await supabase
        .from('donations')
        .select('*, communities(name)')
        .order('donated_at', { ascending: false })

      const { data: communitiesData } = await supabase
        .from('communities')
        .select('id, name')

      setDonations(donationsData || [])
      setCommunities(communitiesData || [])
    } catch (error) {
      console.error('Error fetching donations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDonations = donations.filter(d => {
    const matchesCommunity = !filters.community || d.community_id === filters.community
    const matchesStartDate = !filters.startDate || new Date(d.donated_at) >= new Date(filters.startDate)
    const matchesEndDate = !filters.endDate || new Date(d.donated_at) <= new Date(filters.endDate)
    return matchesCommunity && matchesStartDate && matchesEndDate
  })

  const totalAmount = filteredDonations.reduce((sum, d) => sum + d.amount, 0)

  const columns = [
    { key: 'communities.name', label: 'Community', render: (_, row) => row.communities?.name || 'Unknown' },
    { key: 'amount', label: 'Amount', render: (val) => `Rp${val.toLocaleString()}` },
    { key: 'donor_name', label: 'Donatur' },
    { key: 'donated_at', label: 'Date', render: (val) => new Date(val).toLocaleDateString() },
  ]

  const handleExport = () => {
    const csv = [
      ['Community', 'Amount', 'Donatur', 'Date'].join(','),
      ...filteredDonations.map(d => [
        d.communities?.name,
        d.amount,
        d.donor_name,
        d.donated_at
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'donations.csv'
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Donation Recap</h1>
          <p className="text-text-secondary">View and filter all donation records</p>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-text-secondary">
              <Filter className="w-5 h-5" />
              <span className="font-medium">Filters:</span>
            </div>
            
            <select
              value={filters.community}
              onChange={(e) => setFilters({ ...filters, community: e.target.value })}
              className="input-field w-48 py-2"
            >
              <option value="">All Communities</option>
              {communities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="input-field w-40 py-2"
              placeholder="Start Date"
            />

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="input-field w-40 py-2"
              placeholder="End Date"
            />
          </div>

          <div className="text-right">
            <p className="text-sm text-text-secondary">Total Amount</p>
            <p className="text-2xl font-bold text-primary">Rp{totalAmount.toLocaleString()}</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredDonations.map(d => ({
            ...d,
            'communities.name': d.communities?.name
          }))}
          searchable
          sortable
          pagination
        />
      </div>
    </div>
  )
}

export default DonationRecap