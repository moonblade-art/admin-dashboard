import { Bell, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const Header = () => {
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email || 'Admin')
    }
    getUser()
  }, [])

  return (
    <header className="bg-white shadow-soft px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Welcome back!</h2>
        <p className="text-sm text-text-secondary">Here's what's happening today</p>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-text-secondary" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-10 h-10 bg-third rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="hidden md:block">
            <p className="font-medium text-text-primary text-sm">{userEmail}</p>
            <p className="text-xs text-text-secondary">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header