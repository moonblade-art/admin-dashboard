import { useEffect, useState, useCallback } from 'react'
import { Car, Cloud, Heart, Users } from 'lucide-react'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import StatCard from '../components/StatCard'
import { supabase } from '../services/supabase'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

// --- Helpers & Formatters ---

const safeNumber = (val, fallback = 0) => {
  const num = parseFloat(val)
  return isNaN(num) ? fallback : num
}

const safeInt = (val, fallback = 0) => {
  const num = parseInt(val, 10)
  return isNaN(num) ? fallback : num
}

const formatRupiah = (val) => {
  const num = safeNumber(val)
  return `Rp${num.toLocaleString('id-ID')}`
}

const formatKg = (val) => {
  const num = safeNumber(val)
  return `${num.toFixed(2)} kg`
}

const sumByKey = (items, key) => 
  items.reduce((sum, item) => sum + safeNumber(item[key]), 0)

const groupBy = (items, keyFn, valueFn) => {
  const groups = {}
  items.forEach(item => {
    const groupKey = keyFn(item)
    if (!groupKey) return
    groups[groupKey] = (groups[groupKey] || 0) + valueFn(item)
  })
  return Object.entries(groups).map(([name, value]) => ({ name, value }))
}

// --- Color Palette ---
const CHART_COLORS = [
  '#3E5F44', // Primary green
  '#6C8C73', // Secondary
  '#BCA88D', // Third
  '#5C6D5D', // Darker
  '#1E1E1E', // Dark
  '#8B9D83', // Light green
  '#D4A373', // Warm
  '#6B705C', // Olive
]

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalEmissions: 0,
    totalDonations: 0,
    totalCommunities: 0,
  })
  const [donationsByCommunity, setDonationsByCommunity] = useState([])
  const [emissionsByVehicleType, setEmissionsByVehicleType] = useState([])
  const [emissionsByFuelType, setEmissionsByFuelType] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch counts in parallel
      const [
        { count: vehiclesCount, error: vehiclesError },
        { count: communitiesCount, error: communitiesError },
      ] = await Promise.all([
        supabase.from('vehicles').select('*', { count: 'exact', head: true }),
        supabase.from('communities').select('*', { count: 'exact', head: true }),
      ])

      if (vehiclesError) throw vehiclesError
      if (communitiesError) throw communitiesError

      // Fetch emission factors (new table)
      const { data: emissionFactors, error: emissionError } = await supabase
        .from('vehicle_emission_factors')
        .select('vehicle_type, fuel_type, emission_factor_avg')

      if (emissionError) throw emissionError

      // Fetch donations
      const { data: donationsData, error: donationsError } = await supabase
        .from('donations')
        .select('amount, communities(name)')

      if (donationsError) throw donationsError

      // Calculate total emissions using emission_factor_avg
      const totalEmissions = sumByKey(emissionFactors || [], 'emission_factor_avg')

      // Calculate total donations
      const totalDonations = sumByKey(donationsData || [], 'amount')

      setStats({
        totalVehicles: safeInt(vehiclesCount),
        totalEmissions,
        totalDonations,
        totalCommunities: safeInt(communitiesCount),
      })

      // Group donations by community
      const communityDonations = groupBy(
        donationsData || [],
        d => d.communities?.name || 'Unknown',
        d => safeNumber(d.amount)
      )
      setDonationsByCommunity(communityDonations)

      // Group emissions by vehicle_type for Doughnut chart
      const vehicleTypeEmissions = groupBy(
        emissionFactors || [],
        e => e.vehicle_type || 'Unknown',
        e => safeNumber(e.emission_factor_avg)
      )
      setEmissionsByVehicleType(vehicleTypeEmissions)

      // Group emissions by fuel_type for secondary insight
      const fuelTypeEmissions = groupBy(
        emissionFactors || [],
        e => e.fuel_type || 'Unknown',
        e => safeNumber(e.emission_factor_avg)
      )
      setEmissionsByFuelType(fuelTypeEmissions)

    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      alert('Error loading dashboard data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const barChartData = {
    labels: donationsByCommunity.map(d => d.name),
    datasets: [
      {
        label: 'Donations (Rp)',
        data: donationsByCommunity.map(d => d.value),
        backgroundColor: '#3E5F44',
        borderRadius: 8,
      },
    ],
  }

  const doughnutData = {
    labels: emissionsByVehicleType.map(e => e.name),
    datasets: [
      {
        data: emissionsByVehicleType.map(e => e.value),
        backgroundColor: CHART_COLORS,
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }

  const fuelTypeDoughnutData = {
    labels: emissionsByFuelType.map(e => e.name),
    datasets: [
      {
        data: emissionsByFuelType.map(e => e.value),
        backgroundColor: CHART_COLORS.slice(2),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }

  // Options untuk Bar Chart Donasi - format Rupiah
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || ''
            const value = safeNumber(context.raw)
            return `${label}: ${formatRupiah(value)}`
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => formatRupiah(value),
        },
      },
    },
  }

  // Options untuk Doughnut Emissions - format kg/km
  const emissionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || ''
            const value = safeNumber(context.raw)
            return `${label}: ${value.toFixed(2)} kg/km`
          },
        },
      },
    },
  }

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
        <h1 className="text-2xl font-bold text-text-primary mb-2">Dashboard</h1>
        <p className="text-text-secondary">Overview of your environmental impact</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Vehicles"
          value={stats.totalVehicles.toLocaleString('id-ID')}
          icon={Car}
          trend="up"
          trendValue="+12% this month"
          color="primary"
        />
        <StatCard
          title="Total Emissions"
          value={formatKg(stats.totalEmissions)}
          icon={Cloud}
          trend="down"
          trendValue="-5% this month"
          color="secondary"
        />
        <StatCard
          title="Total Donations"
          value={formatRupiah(stats.totalDonations)}
          icon={Heart}
          trend="up"
          trendValue="+23% this month"
          color="third"
        />
        <StatCard
          title="Communities"
          value={stats.totalCommunities.toLocaleString('id-ID')}
          icon={Users}
          trend="up"
          trendValue="+3 new"
          color="green"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donations Bar Chart - format Rupiah */}
        <div className="card">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Donations by Community
          </h3>
          <div className="h-64">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Emissions by Vehicle Type Doughnut - format kg/km */}
        <div className="card">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Emissions by Vehicle Type
          </h3>
          <div className="h-64">
            <Doughnut data={doughnutData} options={emissionChartOptions} />
          </div>
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emissions by Fuel Type Doughnut - format kg/km */}
        <div className="card">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Emissions by Fuel Type
          </h3>
          <div className="h-64">
            <Doughnut data={fuelTypeDoughnutData} options={emissionChartOptions} />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="card">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Emission Factors Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-text-secondary">Total Factor Records</span>
              <span className="font-semibold text-text-primary">
                {(emissionsByVehicleType.length + emissionsByFuelType.length).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-text-secondary">Vehicle Types</span>
              <span className="font-semibold text-text-primary">
                {emissionsByVehicleType.length}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-text-secondary">Fuel Types</span>
              <span className="font-semibold text-text-primary">
                {emissionsByFuelType.length}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-text-secondary">Avg Emission Factor</span>
              <span className="font-semibold text-text-primary">
                {emissionsByVehicleType.length > 0
                  ? formatKg(stats.totalEmissions / emissionsByVehicleType.length)
                  : '0.00 kg'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard