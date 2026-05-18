import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search, ArrowUpDown } from 'lucide-react'

const DataTable = ({ 
  columns, 
  data, 
  searchable = false, 
  sortable = false,
  pagination = false,
  itemsPerPage = 10,
  onRowClick,
  actions
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)

  // Filter data
  const filteredData = searchable && searchTerm
    ? data.filter(row => 
        columns.some(col => 
          String(row[col.key]).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data

  // Sort data
  const sortedData = sortConfig.key
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    : filteredData

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : sortedData

  const handleSort = (key) => {
    if (!sortable) return
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-4 py-2">
          <Search className="w-5 h-5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-text-primary placeholder-gray-400"
          />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {columns.map(col => (
                  <th 
                    key={col.key}
                    className={`px-6 py-4 text-left text-sm font-semibold text-text-secondary ${sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {sortable && <ArrowUpDown className="w-4 h-4" />}
                    </div>
                  </th>
                ))}
                {actions && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-8 text-center text-text-secondary">
                    No data found
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr 
                    key={row.id || idx}
                    className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {columns.map(col => (
                      <td key={col.key} className="px-6 py-4 text-sm text-text-primary">
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-6 py-4 text-right">
                        {actions(row)}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-text-primary">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable