'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Edit, Trash2, Users, GraduationCap, Save, X, Layers, UserPlus, Calendar, Settings } from 'lucide-react';
import { moduleAPI, courseAPI, batchAPI } from '@/lib/apiClient';
import { useSession } from 'next-auth/react';

// NavIcon component for consistent styling
function NavIcon({ children }) {
  return (
    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
      {children}
    </div>
  );
}

// ModuleList component
function ModuleList({ onSelectModule, selectedId, onCreateNew, onRefresh }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchModules();
  }, [onRefresh]);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await moduleAPI.getAll();
      setModules(response.modules || []);
    } catch (err) {
      console.error('Error fetching modules:', err);
      setError('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this module?')) {
      try {
        await moduleAPI.delete(moduleId);
        fetchModules();
      } catch (err) {
        console.error('Error deleting module:', err);
        alert('Failed to delete module');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-effect border border-white/20 rounded-2xl p-6 h-[400px] flex flex-col"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center text-white">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3">
            <BookOpen className="text-blue-400 w-5 h-5" />
          </div>
          Modules
        </h2>
        <button
          onClick={onCreateNew}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus size={16} />
          Create Module
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-white/70 mt-2">Loading modules...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={fetchModules}
            className="mt-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : modules.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/70">No modules found. Create your first module!</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {modules.map((module) => (
              <div
                 key={module.id}
                 className={`p-6 border rounded-xl cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.03] h-fit backdrop-blur-sm
                   ${module.id === selectedId ? 'border-blue-400/60 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 shadow-lg shadow-blue-500/25' : 'border-white/20 hover:border-blue-400/40 bg-gradient-to-br from-white/5 to-white/10 hover:from-white/10 hover:to-blue-500/5'}`}
                 onClick={() => onSelectModule(module)}
               >
                <div className="flex flex-col h-full min-h-[180px]">
                   <div className="flex justify-between items-start mb-3">
                     <div className="font-bold text-white text-base leading-tight">{module.title}</div>
                     <button
                       onClick={(e) => handleDeleteModule(module.id, e)}
                       className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-all duration-200 flex-shrink-0"
                       title="Delete Module"
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                   <div className="text-sm text-blue-200/90 mb-4 line-clamp-3 leading-relaxed">
                     {module.description}
                   </div>
                   <div className="mt-auto space-y-2">
                     <div className="flex items-center justify-between text-xs">
                       <span className="text-white/70">Difficulty:</span>
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                         module.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-300' :
                         module.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                         'bg-red-500/20 text-red-300'
                       }`}>
                         {module.difficulty}
                       </span>
                     </div>
                     <div className="flex items-center justify-between text-xs">
                       <span className="text-white/70">Duration:</span>
                       <span className="text-cyan-300 font-medium">{module.estimatedHours}h</span>
                     </div>
                     <div className="text-xs text-white/50 pt-2 border-t border-white/10">
                       Created: {new Date(module.createdAt).toLocaleDateString()}
                     </div>
                   </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ProgramBuilder component (renamed from CourseBuilder)
function ProgramBuilder({ selectedModule, onRefresh }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newProgram, setNewProgram] = useState({ 
    title: '', 
    description: '', 
    moduleIds: [], 
    duration: '', 
    level: 'beginner', 
    isActive: true 
  });
  const [isCreating, setIsCreating] = useState(false);
  const [modules, setModules] = useState([]);

  useEffect(() => {
    fetchPrograms();
    fetchModules();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getAll();
      setPrograms(response.courses || []);
    } catch (err) {
      console.error('Error fetching programs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await moduleAPI.getAll();
      setModules(response.modules || []);
    } catch (err) {
      console.error('Error fetching modules:', err);
    }
  };

  const getModuleTitle = (moduleId) => {
    const module = modules.find(m => m.id === moduleId);
    return module ? module.title : 'Unknown Module';
  };

  const handleCreateProgram = async () => {
    if (!newProgram.title.trim()) {
      alert('Please enter a program title');
      return;
    }

    if (!newProgram.duration.trim()) {
      alert('Please enter program duration');
      return;
    }

    try {
      setIsCreating(true);
      await courseAPI.create({
        title: newProgram.title,
        description: newProgram.description,
        modules: newProgram.moduleIds, // API expects 'modules' field
        duration: newProgram.duration,
        level: newProgram.level,
        isActive: newProgram.isActive
      });
      setNewProgram({ 
        title: '', 
        description: '', 
        moduleIds: [], 
        duration: '', 
        level: 'beginner', 
        isActive: true 
      });
      fetchPrograms();
      alert('Program created successfully!');
    } catch (err) {
      console.error('Error creating program:', err);
      alert('Failed to create program');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProgram = async (programId) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      try {
        await courseAPI.delete(programId);
        fetchPrograms();
      } catch (err) {
        console.error('Error deleting program:', err);
        alert('Failed to delete program');
      }
    }
  };

  const handleModuleToggle = (moduleId) => {
    setNewProgram(prev => ({
      ...prev,
      moduleIds: prev.moduleIds.includes(moduleId)
        ? prev.moduleIds.filter(id => id !== moduleId)
        : [...prev.moduleIds, moduleId]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-effect border border-white/20 rounded-2xl p-6"
    >
      <h2 className="text-2xl font-bold flex items-center text-white mb-6">
        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mr-3">
          <GraduationCap className="text-green-400 w-5 h-5" />
        </div>
        Program Builder
      </h2>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
        {/* Left Column - Create New Program */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg flex flex-col">
          <h3 className="font-semibold text-white mb-4 flex items-center">
            <Plus className="w-4 h-4 mr-2 text-green-400" />
            Create New Program
          </h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Program Title"
              value={newProgram.title}
              onChange={(e) => setNewProgram(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white placeholder-white/60"
            />
            <textarea
              placeholder="Program Description"
              value={newProgram.description}
              onChange={(e) => setNewProgram(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white placeholder-white/60 h-20 resize-none"
            />
            
            {/* Duration Field */}
            <input
              type="text"
              placeholder="Duration (e.g., 6 months)"
              value={newProgram.duration}
              onChange={(e) => setNewProgram(prev => ({ ...prev, duration: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white placeholder-white/60"
            />
            
            {/* Level Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Level</label>
              <select
                value={newProgram.level}
                onChange={(e) => setNewProgram(prev => ({ ...prev, level: e.target.value }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white"
              >
                <option value="beginner" className="bg-gray-800 text-white">Beginner</option>
                <option value="intermediate" className="bg-gray-800 text-white">Intermediate</option>
                <option value="advanced" className="bg-gray-800 text-white">Advanced</option>
              </select>
            </div>
            
            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={newProgram.isActive}
                onChange={(e) => setNewProgram(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-white">Active Program</label>
            </div>
            
            {/* Module Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Select Modules</label>
              <div className="max-h-32 overflow-y-auto space-y-2 p-2 bg-white/5 rounded-lg border border-white/10">
                {modules.map((module) => (
                  <label key={module.id} className="flex items-center space-x-2 cursor-pointer hover:bg-white/5 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={newProgram.moduleIds.includes(module.id)}
                      onChange={() => handleModuleToggle(module.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-white">{module.title}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleCreateProgram}
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Save size={16} />
              {isCreating ? 'Creating...' : 'Create Program'}
            </button>
          </div>
        </div>

        {/* Right Column - Existing Programs */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg flex flex-col">
          <h3 className="font-semibold text-white mb-4 flex items-center">
            <Layers className="w-4 h-4 mr-2 text-blue-400" />
            Existing Programs
          </h3>
          {loading ? (
            <div className="text-center py-8 flex-1 flex items-center justify-center">
              <div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-white/60 mt-2">Loading programs...</p>
              </div>
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-8 flex-1 flex items-center justify-center">
              <div>
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <GraduationCap className="w-8 h-8 text-white/40" />
                </div>
                <p className="text-white/60">No programs created yet.</p>
                <p className="text-white/40 text-sm mt-1">Create your first program to get started!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
              {programs.map((program) => (
                <div key={program.id} className="p-4 border border-white/20 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-200 hover:border-white/30 hover:shadow-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-white text-base mb-1">{program.title}</div>
                      <div className="text-sm text-white/70 mb-2 line-clamp-2">{program.description}</div>
                      <div className="flex items-center text-xs text-green-400">
                        <BookOpen className="w-3 h-3 mr-1" />
                        <span className="font-medium">{program.moduleIds?.length || 0} modules</span>
                      </div>
                      {program.moduleIds?.length > 0 && (
                        <div className="text-xs text-white/50 mt-1 line-clamp-1">
                          {program.moduleIds.map(id => getModuleTitle(id)).join(', ')}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteProgram(program.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-all duration-200 ml-2"
                      title="Delete Program"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// BatchManagement component
function BatchManagement() {
  const [batches, setBatches] = useState([]);
  const [newBatch, setNewBatch] = useState({ name: '', academicYear: '', startDate: '', endDate: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await batchAPI.getAll();
      setBatches(response.batches || []);
    } catch (err) {
      console.error('Error fetching batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async () => {
    if (!newBatch.name.trim() || !newBatch.academicYear.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsCreating(true);
      await batchAPI.create({
        ...newBatch,
        studentCount: 0,
        isActive: true
      });
      setNewBatch({ name: '', academicYear: '', startDate: '', endDate: '' });
      fetchBatches(); // Refresh the list
      alert('Batch created successfully!');
    } catch (err) {
      console.error('Error creating batch:', err);
      alert('Failed to create batch. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      try {
        await batchAPI.delete(batchId);
        fetchBatches(); // Refresh the list
      } catch (err) {
        console.error('Error deleting batch:', err);
        alert('Failed to delete batch. Please try again.');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-effect border border-white/20 rounded-2xl p-6"
    >
      <h2 className="text-2xl font-bold flex items-center text-white mb-6">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3">
          <Users className="text-purple-400 w-5 h-5" />
        </div>
        Batch Management
      </h2>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
        {/* Left Column - Create New Batch */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg flex flex-col">
          <h3 className="font-semibold text-white mb-4 flex items-center">
            <Plus className="w-4 h-4 mr-2 text-purple-400" />
            Create New Batch
          </h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Batch Name"
              value={newBatch.name}
              onChange={(e) => setNewBatch(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400 text-white placeholder-white/60"
            />
            <input
              type="text"
              placeholder="Academic Year (e.g., 2024-2025)"
              value={newBatch.academicYear}
              onChange={(e) => setNewBatch(prev => ({ ...prev, academicYear: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400 text-white placeholder-white/60"
            />
            <input
              type="date"
              placeholder="Start Date"
              value={newBatch.startDate}
              onChange={(e) => setNewBatch(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400 text-white placeholder-white/60"
            />
            <input
              type="date"
              placeholder="End Date"
              value={newBatch.endDate}
              onChange={(e) => setNewBatch(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400 text-white placeholder-white/60"
            />
            <button
              onClick={handleCreateBatch}
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus size={16} />
              {isCreating ? 'Creating...' : 'Create Batch'}
            </button>
          </div>
        </div>

        {/* Right Column - Existing Batches */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg flex flex-col">
          <h3 className="font-semibold text-white mb-4 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-purple-400" />
            Existing Batches
          </h3>
          {loading ? (
            <div className="text-center py-8 flex-1 flex items-center justify-center">
              <div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                <p className="text-white/60 mt-2">Loading batches...</p>
              </div>
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-8 flex-1 flex items-center justify-center">
              <div>
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-white/40" />
                </div>
                <p className="text-white/60">No batches created yet.</p>
                <p className="text-white/40 text-sm mt-1">Create your first batch to get started!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
              {batches.map((batch) => (
                <div key={batch.id} className="p-4 border border-white/20 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-200 hover:border-white/30 hover:shadow-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-white text-base mb-1">{batch.name}</div>
                      <div className="text-sm text-white/70 mb-2">
                        Academic Year: {batch.academicYear}
                      </div>
                      <div className="flex items-center text-xs text-purple-400">
                        <Users className="w-3 h-3 mr-1" />
                        <span className="font-medium">{batch.studentCount || 0} students</span>
                      </div>
                      <div className="text-xs text-white/50 mt-1">
                        {batch.startDate && `Start: ${new Date(batch.startDate).toLocaleDateString()}`}
                        {batch.endDate && ` | End: ${new Date(batch.endDate).toLocaleDateString()}`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBatch(batch.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-all duration-200 ml-2"
                      title="Delete Batch"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// CreateModuleModal component
function CreateModuleModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Beginner',
    estimatedHours: 10
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a module title');
      return;
    }

    try {
      setIsSubmitting(true);
      await moduleAPI.create({
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      });
      setFormData({ title: '', description: '', difficulty: 'Beginner', estimatedHours: 10 });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating module:', err);
      alert('Failed to create module');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-effect border border-white/20 rounded-2xl p-6 w-full max-w-md mx-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Create New Module</h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white placeholder-white/60"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white placeholder-white/60 h-20 resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-1">Difficulty</label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-1">Estimated Hours</label>
            <input
              type="number"
              min="1"
              value={formData.estimatedHours}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 text-white placeholder-white/60"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-white/20 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-500 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function AdminModuleManagement() {
  const { data: session, status } = useSession();
  const [selectedModule, setSelectedModule] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access the admin module management.</p>
        </div>
      </div>
    );
  }

  if (session.user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-8"
    >
      <h1 className="text-3xl font-bold mb-6 text-primary">
        📚 Module, Program & Batch Management
      </h1>

      <div className="space-y-6 mb-6">
        <ModuleList
          key={refreshKey}
          onSelectModule={setSelectedModule}
          selectedId={selectedModule?.id}
          onCreateNew={() => setShowCreateModal(true)}
          onRefresh={refreshKey}
        />
        <ProgramBuilder
          selectedModule={selectedModule}
          onRefresh={handleRefresh}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <BatchManagement />
      </div>

      {/* Module Completion Criteria Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-6 glass-effect border border-blue-400/30 p-4 rounded-lg"
      >
        <h3 className="font-semibold text-blue-300 mb-2">Module Completion Criteria</h3>
        <div className="text-sm text-blue-200 space-y-1">
          <p>• Students must complete both exam and practical assessments</p>
          <p>• Total possible score: 200% (100% exam + 100% practical)</p>
          <p>• Pass mark: 70% of total possible score (140/200)</p>
          <p>• Both assessments are required for module completion</p>
        </div>
      </motion.div>
      
      <CreateModuleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleRefresh}
      />
    </motion.div>
  );
}
