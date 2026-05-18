import { TrendingUp, TrendingDown } from 'lucide-react'

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    third: 'bg-third/10 text-third',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
  }

  return (
    <div className="card hover:shadow-soft-lg transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-secondary text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-text-primary">{value}</h3>
          
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

export default StatCard