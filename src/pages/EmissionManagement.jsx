import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react'
import { supabase } from '../services/supabase'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

const VEHICLE_TYPES = [
  'car',
  'motorcycle',
  'bicycle'
]

const VEHICLE_TYPE_LABELS = {
  car: 'Car',
  motorcycle: 'Motorcycle',
  bicycle: 'Bicycle'
}

const VEHICLE_TYPE_COLORS = {
  car: 'bg-blue-100 text-blue-700',
  motorcycle: 'bg-orange-100 text-orange-700',
  bicycle: 'bg-green-100 text-green-700'
}

const FUEL_TYPES = [
  'gasoline',
  'diesel',
  'electric',
  
]

const FUEL_TYPE_LABELS = {
  gasoline: 'Gasoline',
  diesel: 'Diesel',
  electric: 'Electric',
  hybrid: 'Hybrid'
}

const FUEL_TYPE_COLORS = {
  gasoline: 'bg-red-100 text-red-700',
  diesel: 'bg-yellow-100 text-yellow-700',
  electric: 'bg-cyan-100 text-cyan-700',
  hybrid: 'bg-purple-100 text-purple-700'
}

const INITIAL_FORM_STATE = {
  vehicle_type: '',
  fuel_type: '',
  cc_min: '',
  cc_max: '',
  emission_factor_min: '',
  emission_factor_max: '',
  emission_factor_avg: '',
  description: '',
}

const EmissionManagement = () => {
  const [emissions, setEmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmission, setEditingEmission] = useState(null)
  const [inlineEdit, setInlineEdit] = useState(null)
  const [formData, setFormData] = useState(INITIAL_FORM_STATE)
  const [submitting, setSubmitting] = useState(false)

  const fetchEmissions = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('vehicle_emission_factors')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error

      // Sanitize data to prevent null errors in Flutter
      const sanitizedData = (data || []).map(item => ({
        ...item,
        vehicle_type: item.vehicle_type ?? '',
        fuel_type: item.fuel_type ?? '',
        cc_min: item.cc_min ?? 0,
        cc_max: item.cc_max ?? 0,
        emission_factor_min: item.emission_factor_min ?? 0,
        emission_factor_max: item.emission_factor_max ?? 0,
        emission_factor_avg: item.emission_factor_avg ?? 0,
        description: item.description ?? '',
      }))

      setEmissions(sanitizedData)
    } catch (error) {
      console.error('Error fetching emission factors:', error)
      alert('Error fetching emission factors: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmissions()
  }, [fetchEmissions])

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE)
    setEditingEmission(null)
  }

  const validateForm = (data) => {
    const ccMin = parseInt(data.cc_min, 10)
    const ccMax = parseInt(data.cc_max, 10)
    const emissionMin = parseFloat(data.emission_factor_min)
    const emissionMax = parseFloat(data.emission_factor_max)
    const emissionAvg = parseFloat(data.emission_factor_avg)

    if (!data.vehicle_type) {
      return 'Vehicle type is required'
    }

    if (!data.fuel_type) {
      return 'Fuel type is required'
    }

    if (isNaN(ccMin) || ccMin < 0) {
      return 'CC Min must be a non-negative number'
    }

    if (isNaN(ccMax) || ccMax < 0) {
      return 'CC Max must be a non-negative number'
    }

    if (isNaN(emissionMin)) {
      return 'Emission Min must be a valid number'
    }

    if (isNaN(emissionMax)) {
      return 'Emission Max must be a valid number'
    }

    if (isNaN(emissionAvg)) {
      return 'Emission Avg must be a valid number'
    }

    if (emissionMax < emissionMin) {
      return 'Emission Max must be greater than or equal to Emission Min'
    }

    if (emissionAvg < emissionMin || emissionAvg > emissionMax) {
      return 'Emission Avg must be between Min and Max'
    }

    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const validationError = validateForm(formData)
      if (validationError) {
        alert(validationError)
        setSubmitting(false)
        return
      }

      const emissionData = {
        vehicle_type: formData.vehicle_type,
        fuel_type: formData.fuel_type,
        cc_min: parseInt(formData.cc_min, 10) || 0,
        cc_max: parseInt(formData.cc_max, 10) || 0,
        emission_factor_min: parseFloat(formData.emission_factor_min) || 0,
        emission_factor_max: parseFloat(formData.emission_factor_max) || 0,
        emission_factor_avg: parseFloat(formData.emission_factor_avg) || 0,
        description: formData.description.trim() || null,
        updated_at: new Date().toISOString(),
      }

      if (editingEmission) {
        const { error } = await supabase
          .from('vehicle_emission_factors')
          .update(emissionData)
          .eq('id', editingEmission.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('vehicle_emission_factors')
          .insert([{
            ...emissionData,
            created_at: new Date().toISOString(),
          }])

        if (error) throw error
      }

      setIsModalOpen(false)
      resetForm()
      fetchEmissions()
    } catch (error) {
      console.error('Error saving emission factor:', error)
      alert('Error saving emission factor: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleInlineEdit = (emission) => {
    setInlineEdit({ ...emission })
  }

  const handleInlineSave = async () => {
    try {
      if (!inlineEdit) return

      const validationError = validateForm({
        vehicle_type: inlineEdit.vehicle_type,
        fuel_type: inlineEdit.fuel_type,
        cc_min: inlineEdit.cc_min,
        cc_max: inlineEdit.cc_max,
        emission_factor_min: inlineEdit.emission_factor_min,
        emission_factor_max: inlineEdit.emission_factor_max,
        emission_factor_avg: inlineEdit.emission_factor_avg,
        description: inlineEdit.description,
      })

      if (validationError) {
        alert(validationError)
        return
      }

      const { error } = await supabase
        .from('vehicle_emission_factors')
        .update({
          vehicle_type: inlineEdit.vehicle_type,
          fuel_type: inlineEdit.fuel_type,
          cc_min: parseInt(inlineEdit.cc_min, 10) || 0,
          cc_max: parseInt(inlineEdit.cc_max, 10) || 0,
          emission_factor_min: parseFloat(inlineEdit.emission_factor_min) || 0,
          emission_factor_max: parseFloat(inlineEdit.emission_factor_max) || 0,
          emission_factor_avg: parseFloat(inlineEdit.emission_factor_avg) || 0,
          description: (inlineEdit.description ?? '').trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inlineEdit.id)
      
      if (error) throw error

      setInlineEdit(null)
      fetchEmissions()
    } catch (error) {
      console.error('Error updating emission factor:', error)
      alert('Error updating emission factor: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this emission factor?')) return

    try {
      const { error } = await supabase
        .from('vehicle_emission_factors')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      fetchEmissions()
    } catch (error) {
      console.error('Error deleting emission factor:', error)
      alert('Error deleting emission factor: ' + error.message)
    }
  }

  const formatEmission = (val) => {
    const num = parseFloat(val)
    if (isNaN(num)) return '0.0000 kg/km'
    return `${num.toFixed(4)} kg/km`
  }

  const formatCc = (val) => {
    const num = parseInt(val, 10)
    if (isNaN(num)) return '0'
    return `${num.toLocaleString()} cc`
  }

  const columns = [
    { 
      key: 'vehicle_type', 
      label: 'Vehicle Type',
      render: (val, row) => {
        if (inlineEdit?.id === row.id) {
          return (
            <select
              value={inlineEdit.vehicle_type || ''}
              onChange={(e) => setInlineEdit({ ...inlineEdit, vehicle_type: e.target.value })}
              className="input-field py-1 px-2 text-sm"
            >
              <option value="">Select</option>
              {VEHICLE_TYPES.map(type => (
                <option key={type} value={type}>
                  {VEHICLE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          )
        }
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${VEHICLE_TYPE_COLORS[val] || 'bg-gray-100 text-gray-700'}`}>
            {VEHICLE_TYPE_LABELS[val] || val || '-'}
          </span>
        )
      }
    },
    { 
      key: 'fuel_type', 
      label: 'Fuel Type',
      render: (val, row) => {
        if (inlineEdit?.id === row.id) {
          return (
            <select
              value={inlineEdit.fuel_type || ''}
              onChange={(e) => setInlineEdit({ ...inlineEdit, fuel_type: e.target.value })}
              className="input-field py-1 px-2 text-sm"
            >
              <option value="">Select</option>
              {FUEL_TYPES.map(type => (
                <option key={type} value={type}>
                  {FUEL_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          )
        }
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${FUEL_TYPE_COLORS[val] || 'bg-gray-100 text-gray-700'}`}>
            {FUEL_TYPE_LABELS[val] || val || '-'}
          </span>
        )
      }
    },
    { 
      key: 'cc_min', 
      label: 'CC Min',
      render: (val, row) => {
        if (inlineEdit?.id === row.id) {
          return (
            <input
              type="number"
              min="0"
              step="1"
              value={inlineEdit.cc_min ?? ''}
              onChange={(e) => setInlineEdit({ ...inlineEdit, cc_min: e.target.value })}
              className="input-field py-1 px-2 text-sm w-24"
            />
          )
        }
        return formatCc(val)
      }
    },
    { 
      key: 'cc_max', 
      label: 'CC Max',
      render: (val, row) => {
        if (inlineEdit?.id === row.id) {
          return (
            <input
              type="number"
              min="0"
              step="1"
              value={inlineEdit.cc_max ?? ''}
              onChange={(e) => setInlineEdit({ ...inlineEdit, cc_max: e.target.value })}
              className="input-field py-1 px-2 text-sm w-24"
            />
          )
        }
        return formatCc(val)
      }
    },
    { 
      key: 'emission_factor_min', 
      label: 'Emission Min',
      render: (val, row) => {
        if (inlineEdit?.id === row.id) {
          return (
            <input
              type="number"
              step="0.0001"
              min="0"
              value={inlineEdit.emission_factor_min ?? ''}
              onChange={(e) => setInlineEdit({ ...inlineEdit, emission_factor_min: e.target.value })}
              className="input-field py-1 px-2 text-sm w-28"
            />
          )
        }
        return formatEmission(val)
      }
    },
    { 
      key: 'emission_factor_max', 
      label: 'Emission Max',
      render: (val, row) => {
        if (inlineEdit?.id === row.id) {
          return (
            <input
              type="number"
              step="0.0001"
              min="0"
              value={inlineEdit.emission_factor_max ?? ''}
              onChange={(e) => setInlineEdit({ ...inlineEdit, emission_factor_max: e.target.value })}
              className="input-field py-1 px-2 text-sm w-28"
            />
          )
        }
        return formatEmission(val)
      }
    },
    { 
      key: 'emission_factor_avg', 
      label: 'Emission Avg',
      render: (val, row) => {
        if (inlineEdit?.id === row.id) {
          return (
            <input
              type="number"
              step="0.0001"
              min="0"
              value={inlineEdit.emission_factor_avg ?? ''}
              onChange={(e) => setInlineEdit({ ...inlineEdit, emission_factor_avg: e.target.value })}
              className="input-field py-1 px-2 text-sm w-28"
            />
          )
        }
        return formatEmission(val)
      }
    },
    { 
      key: 'description', 
      label: 'Description',
      render: (val, row) => {
        if (inlineEdit?.id === row.id) {
          return (
            <input
              type="text"
              value={inlineEdit.description ?? ''}
              onChange={(e) => setInlineEdit({ ...inlineEdit, description: e.target.value })}
              className="input-field py-1 px-2 text-sm"
              placeholder="Optional"
            />
          )
        }
        return val || '-'
      }
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

  if (loading && emissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading emission factors...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Vehicle Emission Factors</h1>
          <p className="text-text-secondary">Manage emission factors by vehicle type, fuel type and engine capacity</p>
        </div>
        <button 
          onClick={handleOpenModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Emission Factor
        </button>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={emissions}
          searchable
          sortable
          pagination
          actions={(row) => (
            <div className="flex items-center gap-2">
              {inlineEdit?.id === row.id ? (
                <>
                  <button 
                    onClick={handleInlineSave}
                    className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setInlineEdit(null)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => handleInlineEdit(row)}
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
                </>
              )}
            </div>
          )}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingEmission ? 'Edit Emission Factor' : 'Add Emission Factor'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Vehicle Type *
            </label>
            <select
              value={formData.vehicle_type}
              onChange={(e) => setFormData(prev => ({ ...prev, vehicle_type: e.target.value }))}
              className="input-field"
              required
            >
              <option value="">Select Vehicle Type</option>
              {VEHICLE_TYPES.map(type => (
                <option key={type} value={type}>
                  {VEHICLE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          {/* Fuel Type */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Fuel Type *
            </label>
            <select
              value={formData.fuel_type}
              onChange={(e) => setFormData(prev => ({ ...prev, fuel_type: e.target.value }))}
              className="input-field"
              required
            >
              <option value="">Select Fuel Type</option>
              {FUEL_TYPES.map(type => (
                <option key={type} value={type}>
                  {FUEL_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          {/* CC Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                CC Min *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.cc_min}
                onChange={(e) => setFormData(prev => ({ ...prev, cc_min: e.target.value }))}
                className="input-field"
                required
                placeholder="0"
              />
              <p className="text-xs text-text-secondary mt-1">Minimum engine capacity</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                CC Max *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.cc_max}
                onChange={(e) => setFormData(prev => ({ ...prev, cc_max: e.target.value }))}
                className="input-field"
                required
                placeholder="0"
              />
              <p className="text-xs text-text-secondary mt-1">0 = 0</p>
            </div>
          </div>

          {/* Emission Range */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Emission Min (kg/km) *
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={formData.emission_factor_min}
                onChange={(e) => setFormData(prev => ({ ...prev, emission_factor_min: e.target.value }))}
                className="input-field"
                required
                placeholder="0.0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Emission Avg (kg/km) *
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={formData.emission_factor_avg}
                onChange={(e) => setFormData(prev => ({ ...prev, emission_factor_avg: e.target.value }))}
                className="input-field"
                required
                placeholder="0.0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Emission Max (kg/km) *
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={formData.emission_factor_max}
                onChange={(e) => setFormData(prev => ({ ...prev, emission_factor_max: e.target.value }))}
                className="input-field"
                required
                placeholder="0.0000"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input-field min-h-[80px] resize-none"
              rows={2}
              placeholder="Optional description"
            />
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
              {submitting ? 'Saving...' : (editingEmission ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default EmissionManagement