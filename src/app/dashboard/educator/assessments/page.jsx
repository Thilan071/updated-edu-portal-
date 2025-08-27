'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Edit3, List, Users, BookOpen, GraduationCap, Lightbulb, Plus, Save, RefreshCw, Calendar, Play, Pause, Clock, CheckCircle } from 'lucide-react';
import apiClient from '@/lib/apiClient';

const NavIcon = ({ children }) => (
  <span className="inline-flex items-center justify-center w-6 h-6 mr-3">
    {children}
  </span>
);

// 1) Module Assignment Management Component
function ModuleAssignmentManager({ isMounted }) {
  const { data: session } = useSession();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [assignmentTemplates, setAssignmentTemplates] = useState([]);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await apiClient.moduleAPI.getAll();
      setModules(response.modules || []);
    } catch (err) {
      console.error('Error fetching modules:', err);
      setError('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentTemplates = async (moduleId) => {
    try {
      const response = await apiClient.assignmentTemplateAPI.getByModule(moduleId);
      setAssignmentTemplates(response.assignmentTemplates || []);
    } catch (err) {
      console.error('Error fetching assignment templates:', err);
    }
  };

  const handleModuleSelect = (module) => {
    setSelectedModule(module);
    fetchAssignmentTemplates(module.id);
  };

  const handleActivateAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setShowActivateModal(true);
  };

  const handleDeactivateAssignment = async (assignment) => {
    try {
      await apiClient.assignmentTemplateAPI.deactivate(assignment.moduleId, assignment.id);
      fetchAssignmentTemplates(selectedModule.id);
    } catch (err) {
      console.error('Error deactivating assignment:', err);
      alert('Failed to deactivate assignment');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date.seconds ? date.seconds * 1000 : date).toLocaleDateString();
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const due = new Date(dueDate.seconds ? dueDate.seconds * 1000 : dueDate);
    return due < new Date();
  };

  return (
    <div className={`glass-effect-dark rounded-2xl p-6 transform transition-all duration-300
      ${isMounted ? 'card-animated' : 'opacity-0 scale-95'}`}
      style={{ animationDelay: '0.2s' }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center text-white header-font">
          <NavIcon><BookOpen className="text-blue-400" /></NavIcon>
          Module Assignment Management
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading modules...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={fetchModules}
            className="mt-2 text-blue-400 hover:text-blue-300"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Module List */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Select Module</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {modules.map((module) => (
                <div
                  key={module.id}
                  onClick={() => handleModuleSelect(module)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedModule?.id === module.id
                      ? 'bg-blue-600/30 border border-blue-400'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <h4 className="font-semibold text-white">{module.title}</h4>
                  <p className="text-sm text-gray-400 mt-1">{module.description}</p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <span className={`px-2 py-1 rounded-full ${
                      module.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                      module.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {module.difficulty}
                    </span>
                    <span className="ml-2">{module.estimatedHours}h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assignment Templates */}
          <div>
            {selectedModule ? (
              <>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Assignments for {selectedModule.title}
                </h3>
                <div className="space-y-4">
                  {assignmentTemplates.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-white flex items-center gap-2">
                            {assignment.title}
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              assignment.type === 'assignment' 
                                ? 'bg-blue-500/20 text-blue-400' 
                                : 'bg-purple-500/20 text-purple-400'
                            }`}>
                              {assignment.type}
                            </span>
                          </h4>
                          <p className="text-sm text-gray-400 mt-1">{assignment.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {assignment.isActive ? (
                            <>
                              <span className="flex items-center gap-1 text-green-400 text-sm">
                                <CheckCircle size={16} />
                                Active
                              </span>
                              <button
                                onClick={() => handleDeactivateAssignment(assignment)}
                                className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                                title="Deactivate"
                              >
                                <Pause size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="flex items-center gap-1 text-gray-400 text-sm">
                                <Clock size={16} />
                                Inactive
                              </span>
                              <button
                                onClick={() => handleActivateAssignment(assignment)}
                                className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors"
                                title="Activate with due date"
                              >
                                <Play size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {assignment.isActive && (
                        <div className="mt-3 p-3 bg-white/5 rounded-lg">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Due Date:</span>
                              <p className={`font-semibold ${
                                isOverdue(assignment.dueDate) ? 'text-red-400' : 'text-white'
                              }`}>
                                {formatDate(assignment.dueDate)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-400">Activated:</span>
                              <p className="text-white font-semibold">
                                {formatDate(assignment.activatedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3 text-sm text-gray-400">
                        <span className="font-semibold">Max Score:</span> {assignment.maxScore} points
                      </div>
                    </div>
                  ))}
                  
                  {assignmentTemplates.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No assignment templates found for this module.</p>
                      <p className="text-sm text-gray-500 mt-2">Assignment templates need to be created first.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-400">Select a module to view its assignment templates</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activate Assignment Modal */}
      {showActivateModal && selectedAssignment && (
        <ActivateAssignmentModal
          assignment={selectedAssignment}
          onClose={() => {
            setShowActivateModal(false);
            setSelectedAssignment(null);
          }}
          onSuccess={() => {
            fetchAssignmentTemplates(selectedModule.id);
            setShowActivateModal(false);
            setSelectedAssignment(null);
          }}
        />
      )}
    </div>
  );
}

// 2) Activate Assignment Modal
function ActivateAssignmentModal({ assignment, onClose, onSuccess }) {
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Set minimum date to today
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDueDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dueDate) return;

    try {
      setLoading(true);
      await apiClient.assignmentTemplateAPI.activate(assignment.moduleId, assignment.id, dueDate);
      onSuccess();
    } catch (err) {
      console.error('Error activating assignment:', err);
      alert('Failed to activate assignment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-xl font-bold text-white mb-4">Activate Assignment</h3>
        
        <div className="mb-4">
          <h4 className="font-semibold text-white">{assignment.title}</h4>
          <p className="text-sm text-gray-400 mt-1">{assignment.description}</p>
          <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
            assignment.type === 'assignment' 
              ? 'bg-blue-500/20 text-blue-400' 
              : 'bg-purple-500/20 text-purple-400'
          }`}>
            {assignment.type}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Due Date *
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !dueDate}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Activating...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Activate
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 3) Traditional Assessment List (existing assessments)
function TraditionalAssessmentList({ onSelectAssessment, selectedId, isMounted, onCreateNew }) {
  const [assessments, setAssessments] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssessments();
    fetchModules();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.assessmentAPI.getAll();
      setAssessments(response.assessments || []);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setError('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await apiClient.moduleAPI.getAll();
      setModules(response.modules || []);
    } catch (err) {
      console.error('Error fetching modules:', err);
    }
  };

  const getModuleName = (moduleId) => {
    const module = modules.find(m => m.id === moduleId);
    return module ? module.title : 'Unknown Module';
  };

  return (
    <div
      className={`glass-effect-dark rounded-2xl p-6 transform transition-all duration-300
        ${isMounted ? 'card-animated' : 'opacity-0 scale-95'}`}
      style={{ animationDelay: '0.4s' }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center text-white header-font">
          <NavIcon><List className="text-purple-400" /></NavIcon>
          Traditional Assessments
        </h2>
        <button
          onClick={onCreateNew}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          Create New
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading assessments...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={fetchAssessments}
            className="mt-2 text-purple-400 hover:text-purple-300"
          >
            Try Again
          </button>
        </div>
      ) : assessments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No traditional assessments found. Create your first assessment!</p>
        </div>
      ) : (
        <ul className="divide-y divide-white/10 max-h-96 overflow-y-auto">
          {assessments.map((assessment) => (
            <li
              key={assessment.id}
              onClick={() => onSelectAssessment(assessment)}
              className={`p-4 cursor-pointer transition-all duration-200 hover:bg-white/5 ${
                selectedId === assessment.id ? 'bg-purple-600/20 border-l-4 border-purple-400' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{assessment.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{assessment.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Module: {getModuleName(assessment.moduleId)}</span>
                    <span className={`px-2 py-1 rounded-full ${
                      assessment.type === 'exam' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {assessment.type}
                    </span>
                    <span>Max: {assessment.maxScore} pts</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 4) Create Assessment Modal (existing)
function CreateAssessmentModal({ isOpen, onClose, onSuccess }) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'exam',
    moduleId: '',
    maxScore: 100,
    dueDate: ''
  });
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchModules();
    }
  }, [isOpen]);

  const fetchModules = async () => {
    try {
      const response = await apiClient.moduleAPI.getAll();
      setModules(response.modules || []);
    } catch (err) {
      console.error('Error fetching modules:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session?.user) return;

    try {
      setLoading(true);
      await apiClient.assessmentAPI.create({
        ...formData,
        maxScore: parseInt(formData.maxScore),
        createdBy: session.user.id
      });
      
      alert('Assessment created successfully!');
      setFormData({
        title: '',
        description: '',
        type: 'exam',
        moduleId: '',
        maxScore: 100,
        dueDate: ''
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating assessment:', err);
      alert('Failed to create assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">Create New Assessment</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter assessment title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter assessment description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="exam">Exam</option>
                <option value="practical">Practical</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Module *
              </label>
              <select
                value={formData.moduleId}
                onChange={(e) => setFormData({...formData, moduleId: e.target.value})}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select a module</option>
                {modules.map(module => (
                  <option key={module.id} value={module.id}>
                    {module.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Score *
              </label>
              <input
                type="number"
                value={formData.maxScore}
                onChange={(e) => setFormData({...formData, maxScore: e.target.value})}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="100"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Create Assessment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 5) Main component
export default function EducatorAssessments() {
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' or 'traditional'

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      <style jsx>{`
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .card-animated {
          animation: fadeInSlideUp 0.6s ease-out forwards;
        }

        .glass-effect-dark {
          background-color: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(15px) saturate(200%);
          -webkit-backdrop-filter: blur(15px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.4);
        }
      `}</style>
      <div className="main-font text-white">
        <header
          className={`mb-6 ${isMounted ? 'animated-entry' : 'opacity-0'}`}
          style={{ animationDelay: '0.1s' }}
        >
          <h1 className="text-4xl font-bold header-font">
            Assessment Management
          </h1>
          <p className="text-lg text-gray-300">Manage module assignments and traditional assessments.</p>
        </header>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white/5 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === 'assignments'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Module Assignments
            </button>
            <button
              onClick={() => setActiveTab('traditional')}
              className={`px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === 'traditional'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Traditional Assessments
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'assignments' ? (
          <ModuleAssignmentManager isMounted={isMounted} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TraditionalAssessmentList
              key={refreshKey}
              onSelectAssessment={setSelectedAssessment}
              selectedId={selectedAssessment?.id}
              isMounted={isMounted}
              onCreateNew={() => setShowCreateModal(true)}
            />
            <div className={`glass-effect-dark rounded-2xl p-6 transform transition-all duration-300
              ${isMounted ? 'card-animated' : 'opacity-0 scale-95'}`}
              style={{ animationDelay: '0.6s' }}
            >
              {selectedAssessment ? (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Assessment Details</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-white">{selectedAssessment.title}</h4>
                      <p className="text-gray-400 mt-1">{selectedAssessment.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Type:</span>
                        <p className="text-white font-semibold">{selectedAssessment.type}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Max Score:</span>
                        <p className="text-white font-semibold">{selectedAssessment.maxScore} points</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-400">Select an assessment to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <CreateAssessmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleRefresh}
      />
    </>
  );
}