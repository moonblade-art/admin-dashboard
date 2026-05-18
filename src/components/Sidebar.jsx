import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Heart, 
  Users, 
  Cloud, 
  Bell, 
  FileText, 
  LogOut,
  Car
} from 'lucide-react'
import { signOut } from '../services/supabase'
import { useNavigate } from 'react-router-dom'

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/donations', icon: Heart, label: 'Catatan Donasi' },
    { path: '/communities', icon: Users, label: 'Komunitas' },
    { path: '/emissions', icon: Cloud, label: 'Emisi' },
    { path: '/notifications', icon: Bell, label: 'Notifikasi' },
    { path: '/logs', icon: FileText, label: 'Log Aktivitas' },
  ]

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-soft-lg z-50 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-text-primary">EcoAdmin</h1>
            <p className="text-xs text-text-secondary">Manajemen Sistem</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar