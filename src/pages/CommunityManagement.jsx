import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, Trash2, Upload } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { supabase } from '../services/supabase'

const INITIAL_FORM_STATE = {
  name: '',
  description: '',
  location: '',
  focus_area: '',
  carbon_price_per_kg: '',
  total_donations: '',
  total_carbon_offset: '',
  is_active: true,
  image: null,
}

const CommunityManagement = () => {
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCommunity, setEditingCommunity] = useState(null)
  const [formData, setFormData] = useState(INITIAL_FORM_STATE)
  const [imagePreview, setImagePreview] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Memoized fetch function
  const fetchCommunities = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Ensure no null values that could cause Flutter errors
      const sanitizedData = (data || []).map(community => ({
        ...community,
        name: community.name ?? '',
        description: community.description ?? '',
        location: community.location ?? '',
        focus_area: community.focus_area ?? '',
        image_url: community.image_url ?? '',
        carbon_price_per_kg: community.carbon_price_per_kg ?? 0,
        total_donations: community.total_donations ?? 0,
        total_carbon_offset: community.total_carbon_offset ?? 0,
        is_active: community.is_active ?? true,
      }))
      
      setCommunities(sanitizedData)
    } catch (error) {
      console.error('Error fetching communities:', error)
      alert('Error fetching communities: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCommunities()
  }, [fetchCommunities])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, image: file }))
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE)
    setImagePreview('')
    setEditingCommunity(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      let imageUrl = editingCommunity?.image_url || ''

      // Upload image if new one selected
      if (formData.image) {
        const fileExt = formData.image.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('community-images')
          .upload(fileName, formData.image)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('community-images')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      // Build communityData with all Supabase fields
      const communityData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        location: formData.location.trim() || null,
        focus_area: formData.focus_area.trim() || null,
        carbon_price_per_kg: parseFloat(formData.carbon_price_per_kg) || 0,
        total_donations: parseFloat(formData.total_donations) || 0,
        total_carbon_offset: parseFloat(formData.total_carbon_offset) || 0,
        is_active: formData.is_active,
        image_url: imageUrl || null,
        updated_at: new Date().toISOString(),
      }

      if (editingCommunity) {
        const { error: updateError } = await supabase
          .from('communities')
          .update(communityData)
          .eq('id', editingCommunity.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('communities')
          .insert([{
            ...communityData,
            created_at: new Date().toISOString(),
          }])

        if (insertError) throw insertError
      }

      setIsModalOpen(false)
      resetForm()
      fetchCommunities()
    } catch (error) {
      console.error('Error saving community:', error)
      alert('Error saving community: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (community) => {
    setEditingCommunity(community)
    setFormData({
      name: community.name ?? '',
      description: community.description ?? '',
      location: community.location ?? '',
      focus_area: community.focus_area ?? '',
      carbon_price_per_kg: community.carbon_price_per_kg?.toString() ?? '',
      total_donations: community.total_donations?.toString() ?? '',
      total_carbon_offset: community.total_carbon_offset?.toString() ?? '',
      is_active: community.is_active ?? true,
      image: null,
    })
    setImagePreview(community.image_url ?? '')
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this community?')) return

    try {
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      fetchCommunities()
    } catch (error) {
      console.error('Error deleting community:', error)
      alert('Error deleting community: ' + error.message)
    }
  }

  const columns = [
    { 
      key: 'image_url', 
      label: 'Image',
      render: (url) => url ? (
        <img src={url} alt="" className="w-12 h-12 rounded-lg object-cover" />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
          <Upload className="w-5 h-5 text-gray-400" />
        </div>
      )
    },
    { key: 'name', label: 'Name' },
    { 
      key: 'location', 
      label: 'Location',
      render: (val) => val || '-'
    },
    { 
      key: 'focus_area', 
      label: 'Focus Area',
      render: (val) => val || '-'
    },
    { 
      key: 'description', 
      label: 'Description', 
      render: (val) => val?.substring(0, 50) + (val?.length > 50 ? '...' : '') || '-' 
    },
    { 
      key: 'carbon_price_per_kg', 
      label: 'Carbon Price/kg', 
      render: (val) => `Rp${(val ?? 0).toLocaleString()}` 
    },
    { 
      key: 'total_donations', 
      label: 'Total Donasi', 
      render: (val) => `Rp${(val ?? 0).toLocaleString()}` 
    },
    { 
      key: 'total_carbon_offset', 
      label: 'Carbon Offset', 
      render: (val) => `${(val ?? 0).toLocaleString()} kg` 
    },
    { 
      key: 'is_active', 
      label: 'Status',
      render: (val) => (
        <span className={`px-2 py-1 rounded-full text-xs ${val ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {val ? 'Active' : 'Inactive'}
        </span>
      )
    },
  ]

  const handleOpenModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Community Management</h1>
          <p className="text-text-secondary">Manage your communities and their details</p>
        </div>
        <button 
          onClick={handleOpenModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Community
        </button>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={communities}
          searchable
          sortable
          pagination
          actions={(row) => (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleEdit(row)}
                className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDelete(row.id)}
                className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCommunity ? 'Edit Community' : 'Add Community'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Community Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Community Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input-field"
              required
              placeholder="Enter community name"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="input-field"
              placeholder="Enter location"
            />
          </div>

          {/* Focus Area */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Focus Area
            </label>
            <input
              type="text"
              value={formData.focus_area}
              onChange={(e) => setFormData(prev => ({ ...prev, focus_area: e.target.value }))}
              className="input-field"
              placeholder="e.g., Reforestation, Solar Energy"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input-field min-h-[100px] resize-none"
              rows={3}
              placeholder="Enter description"
            />
          </div>

          {/* Carbon Price per kg */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Carbon Price per kg (Rp)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.carbon_price_per_kg}
              onChange={(e) => setFormData(prev => ({ ...prev, carbon_price_per_kg: e.target.value }))}
              className="input-field"
              placeholder="0.00"
            />
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-text-primary">
              Active Community
            </label>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Community Image
            </label>
            <div className="flex items-center gap-4">
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-xl object-cover" />
              )}
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-primary transition-colors">
                  <Upload className="w-6 h-6 mx-auto mb-2 text-text-secondary" />
                  <span className="text-sm text-text-secondary">Click to upload image</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1"
            >
              {submitting ? 'Saving...' : (editingCommunity ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default CommunityManagement