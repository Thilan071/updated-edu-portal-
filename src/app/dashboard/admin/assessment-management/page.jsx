'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Clock, 
  AlertCircle, 
  Users, 
  CheckCircle, 
  RefreshCw,
  Search,
  Filter
} from 'lucide-react'
import { moduleAPI, assignmentTemplateAPI } from '@/lib/apiClient'

const AssessmentManagement = () => {
  const { data: session } = useSession()
  const [modules, setModules] = useState([])
  const [expandedModules, setExpandedModules] = useState({})
  const [moduleAssignments, setModuleAssignments] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchModules()
  }, [])

  const fetchModules = async () => {
    try {
      setLoading(true)
      const response = await moduleAPI.getAll()
      setModules(response.modules || [])
    } catch (err) {
      console.error('Error fetching modules:', err)
      setError('Failed to fetch modules')
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignmentTemplates = async (moduleId) => {
    try {
      const response = await assignmentTemplateAPI.getByModule(moduleId)
      setModuleAssignments(prev => ({
        ...prev,
        [moduleId]: response.assignmentTemplates || []
      }))
    } catch (err) {
      console.error('Error fetching assignment templates:', err)
      setModuleAssignments(prev => ({
        ...prev,
        [moduleId]: []
      }))
    }
  }

  const toggleModule = async (moduleId) => {
    const isExpanded = expandedModules[moduleId]
    
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !isExpanded
    }))

    // Fetch assignment templates if expanding and not already fetched
    if (!isExpanded && !moduleAssignments[moduleId]) {
      await fetchAssignmentTemplates(moduleId)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'inactive': return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
      case 'draft': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      case 'expired': return 'bg-red-500/20 text-red-300 border-red-400/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  const getAssignmentStatus = (assignment) => {
    if (assignment.isActive) return 'active'
    if (assignment.dueDate && new Date(assignment.dueDate.seconds * 1000) < new Date()) return 'expired'
    return 'inactive'
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No due date'
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp)
    return date.toLocaleDateString()
  }

  const filteredModules = modules.filter(module => {
    const matchesSearch = module.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          module.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (statusFilter === 'all') return matchesSearch
    
    const moduleStatus = module.isActive ? 'active' : 'inactive'
    return matchesSearch && moduleStatus === statusFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-blue-400" size={48} />
          <p className="text-white/80 text-lg">Loading modules...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Open+Sans:wght@300;400;500;600&display=swap');
        .header-font { font-family: 'Outfit', sans-serif; }
        .glass-effect { 
          background-color: rgba(255,255,255,.08); 
          backdrop-filter: blur(15px) saturate(200%); 
          -webkit-backdrop-filter: blur(15px) saturate(200%); 
          border:1px solid rgba(255,255,255,.1); 
          box-shadow:0 10px 40px rgba(0,0,0,.4); 
        }
      `}</style>
      <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 header-font">Assessment Management</h1>
          <p className="text-white/70">Manage modules and their assignment templates</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 glass-effect"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-white/40" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 glass-effect"
            >
              <option value="all">All Modules</option>
              <option value="active">Active Modules</option>
              <option value="inactive">Inactive Modules</option>
            </select>
          </div>

          <button
            onClick={fetchModules}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-300"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl glass-effect">
            <div className="flex items-center gap-2 text-red-300">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Modules List */}
        <div className="space-y-4">
          {filteredModules.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto mb-4 text-white/30" size={48} />
              <p className="text-white/60 text-lg">No modules found</p>
              {searchTerm && (
                <p className="text-white/40 mt-2">Try adjusting your search criteria</p>
              )}
            </div>
          ) : (
            filteredModules.map((module) => (
              <div key={module.id} className="glass-effect border border-white/20 rounded-xl overflow-hidden">
                {/* Module Header */}
                <div
                  onClick={() => toggleModule(module.id)}
                  className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {expandedModules[module.id] ? (
                        <ChevronDown className="text-blue-400" size={20} />
                      ) : (
                        <ChevronRight className="text-blue-400" size={20} />
                      )}
                      <BookOpen className="text-blue-400" size={24} />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-white">{module.title}</h3>
                      <p className="text-white/60 mt-1">{module.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(module.isActive ? 'active' : 'inactive')}`}>
                          {module.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-sm text-white/50">
                          Semester {module.semester || 'N/A'}
                        </span>
                        <span className="text-sm text-white/50">
                          {module.estimatedHours || 0} hours
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-white/60">
                      {moduleAssignments[module.id]?.length || 0} assignments
                    </div>
                  </div>
                </div>

                {/* Assignment Templates */}
                {expandedModules[module.id] && (
                  <div className="border-t border-white/20 bg-white/5">
                    {moduleAssignments[module.id] ? (
                      moduleAssignments[module.id].length > 0 ? (
                        <div className="p-6">
                          <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <FileText size={20} />
                            Assignment Templates
                          </h4>
                          <div className="grid gap-4">
                            {moduleAssignments[module.id].map((assignment) => (
                              <div key={assignment.id} className="glass-effect border border-white/10 rounded-xl p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-white mb-2">{assignment.title}</h5>
                                    <p className="text-white/60 text-sm mb-3">{assignment.description}</p>
                                    
                                    <div className="flex items-center gap-4 text-sm">
                                      <span className={`px-2 py-1 rounded-full border ${getStatusColor(getAssignmentStatus(assignment))}`}>
                                        {getAssignmentStatus(assignment)}
                                      </span>
                                      
                                      <div className="flex items-center gap-1 text-white/60">
                                        <Clock size={14} />
                                        Due: {formatDate(assignment.dueDate)}
                                      </div>
                                      
                                      <div className="flex items-center gap-1 text-white/60">
                                        <Users size={14} />
                                        Max Score: {assignment.maxScore || 100}
                                      </div>

                                      <span className={`px-2 py-1 text-xs rounded ${
                                        assignment.type === 'exam' 
                                          ? 'bg-red-500/20 text-red-300 border border-red-400/30' 
                                          : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                                      }`}>
                                        {assignment.type || 'Assignment'}
                                      </span>
                                    </div>

                                    {assignment.instructions && (
                                      <div className="mt-3 p-3 bg-white/5 rounded-lg text-sm text-white/70">
                                        <strong>Instructions:</strong> {assignment.instructions}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <FileText className="mx-auto mb-2 text-white/30" size={32} />
                          <p className="text-white/60">No assignment templates found for this module</p>
                        </div>
                      )
                    ) : (
                      <div className="p-6 text-center">
                        <RefreshCw className="animate-spin mx-auto mb-2 text-blue-400" size={24} />
                        <p className="text-white/60">Loading assignment templates...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        {modules.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-effect border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="text-blue-400" size={24} />
                <div>
                  <p className="text-white/60 text-sm">Total Modules</p>
                  <p className="text-white text-xl font-semibold">{modules.length}</p>
                </div>
              </div>
            </div>
            
            <div className="glass-effect border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-400" size={24} />
                <div>
                  <p className="text-white/60 text-sm">Active Modules</p>
                  <p className="text-white text-xl font-semibold">
                    {modules.filter(m => m.isActive).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="glass-effect border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <FileText className="text-cyan-400" size={24} />
                <div>
                  <p className="text-white/60 text-sm">Total Assignments</p>
                  <p className="text-white text-xl font-semibold">
                    {Object.values(moduleAssignments).reduce((total, assignments) => total + (assignments?.length || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

export default AssessmentManagement
