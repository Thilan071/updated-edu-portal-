'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUserGraduate, FaChalkboardTeacher, FaKey, FaEye, FaUserPlus, FaEdit, FaTrash, FaPlus, FaEnvelope, FaPhone, FaCalendar, FaIdCard, FaUsers, FaSearch, FaFilter, FaBook, FaTimes, FaCheck } from 'react-icons/fa';
import { studentAPI, educatorAPI, courseAPI, batchAPI, moduleAPI } from '@/lib/apiClient';

// Student Management Component
function StudentManagement({ students, loadingStudents, searchTerm, setSearchTerm, selectedProgram, setSelectedProgram, selectedBatch, setSelectedBatch, handleAssignStudent, handleDeleteStudent, availableBatches }) {
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = !selectedProgram || student.program === selectedProgram;
    const matchesBatch = !selectedBatch || student.batch === selectedBatch;
    return matchesSearch && matchesProgram && matchesBatch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
      {/* Student Assignment Panel */}
      <div className="flex flex-col">
        <div className="glass-effect border border-white/20 rounded-2xl p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FaUserGraduate className="text-blue-400" />
            Assign Students to Programs & Batches
          </h3>
          
          <div className="space-y-4 flex-1">
            {/* Search and Filter Section */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Students
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Search by name, email, or student ID..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Filter by Program
                  </label>
                  <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">All Programs</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Data Science">Data Science</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Filter by Batch
                  </label>
                  <select
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">All Batches</option>
                    {availableBatches.map((batch) => (
                      <option key={batch.id} value={batch.name}>
                        {batch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Assignment Instructions */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                <FaEye className="text-sm" />
                Assignment Instructions
              </h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Use the filters above to find specific students</li>
                <li>• Click on a student card to assign them to programs and batches</li>
                <li>• Students can be enrolled in multiple programs</li>
                <li>• Batch assignments help organize class schedules</li>
              </ul>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                <div className="text-green-400 font-bold text-lg">{filteredStudents.length}</div>
                <div className="text-gray-300 text-sm">Students Found</div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
                <div className="text-purple-400 font-bold text-lg">{students.filter(s => s.program).length}</div>
                <div className="text-gray-300 text-sm">Assigned Students</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Student List */}
      <div className="flex flex-col">
        <div className="glass-effect border border-white/20 rounded-2xl p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FaUserGraduate className="text-blue-400" />
            Student List ({filteredStudents.length} of {students.length})
          </h3>
          
          <div className="flex-1 overflow-hidden">
            {loadingStudents ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <span className="ml-2 text-gray-400">Loading students...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FaUserGraduate className="text-4xl mb-2 opacity-50" />
                <p>No students found</p>
                <p className="text-sm">
                  {students.length === 0 ? 'No students available' : 'Try adjusting your search or filters'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto h-full pr-2">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30 hover:border-blue-500/50 transition-all duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-white text-lg">
                          {student.firstName} {student.lastName}
                        </h4>
                        <p className="text-blue-400 text-sm font-medium">{student.studentId}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAssignStudent(student)}
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-all duration-200"
                          title="Assign to Program/Batch"
                        >
                          <FaUserPlus className="text-sm" />
                        </button>
                        <button className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-all duration-200">
                          <FaEdit className="text-sm" />
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <FaEnvelope className="text-gray-400" />
                        <span>{student.email}</span>
                      </div>
                      {student.phone && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <FaPhone className="text-gray-400" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                      {student.program && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <FaUserGraduate className="text-gray-400" />
                          <span>{student.program}</span>
                        </div>
                      )}
                      {student.batch && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <FaIdCard className="text-gray-400" />
                          <span>Batch: {student.batch}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.status === 'Active' 
                          ? 'bg-green-400/20 text-green-400' 
                          : 'bg-red-400/20 text-red-400'
                      }`}>
                        {student.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Educator Management Component
function EducatorManagement({ educators, loadingEducators, newEducator, setNewEducator, handleCreateEducator, handleDeleteEducator, handleAssignModules }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
      {/* Create New Educator */}
      <div className="flex flex-col">
        <div className="glass-effect border border-white/20 rounded-2xl p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FaChalkboardTeacher className="text-purple-400" />
            Create New Educator
          </h3>
          
          <form onSubmit={handleCreateEducator} className="flex-1 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={newEducator.firstName}
                  onChange={(e) => setNewEducator({...newEducator, firstName: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter first name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={newEducator.lastName}
                  onChange={(e) => setNewEducator({...newEducator, lastName: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter last name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newEducator.email}
                  onChange={(e) => setNewEducator({...newEducator, email: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter email address"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newEducator.phone}
                  onChange={(e) => setNewEducator({...newEducator, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={newEducator.employeeId}
                  onChange={(e) => setNewEducator({...newEducator, employeeId: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter employee ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Department
                </label>
                <select
                  value={newEducator.department}
                  onChange={(e) => setNewEducator({...newEducator, department: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Mathematics">Mathematics</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Specialization
                </label>
                <input
                  type="text"
                  value={newEducator.specialization}
                  onChange={(e) => setNewEducator({...newEducator, specialization: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter specialization"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date of Joining
                </label>
                <input
                  type="date"
                  value={newEducator.dateOfJoining}
                  onChange={(e) => setNewEducator({...newEducator, dateOfJoining: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 flex items-center justify-center gap-2"
            >
              <FaPlus className="text-sm" />
              Create Educator
            </button>
          </form>
        </div>
      </div>
      
      {/* Existing Educators */}
      <div className="flex flex-col">
        <div className="glass-effect border border-white/20 rounded-2xl p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FaUsers className="text-orange-400" />
            Existing Educators ({educators.length})
          </h3>
          
          <div className="flex-1 overflow-hidden">
            {loadingEducators ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <span className="ml-2 text-gray-400">Loading educators...</span>
              </div>
            ) : educators.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FaChalkboardTeacher className="text-4xl mb-2 opacity-50" />
                <p>No educators found</p>
                <p className="text-sm">Create your first educator to get started</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto h-full pr-2">
                {educators.map((educator) => (
                  <div key={educator.id} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30 hover:border-blue-500/50 transition-all duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-white text-lg">
                          {educator.firstName} {educator.lastName}
                        </h4>
                        <p className="text-blue-400 text-sm font-medium">{educator.employeeId}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAssignModules(educator)}
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-all duration-200"
                          title="Assign Modules"
                        >
                          <FaBook className="text-sm" />
                        </button>
                        <button className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-all duration-200">
                          <FaEdit className="text-sm" />
                        </button>
                        <button 
                          onClick={() => handleDeleteEducator(educator.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <FaEnvelope className="text-gray-400" />
                        <span>{educator.email}</span>
                      </div>
                      {educator.phone && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <FaPhone className="text-gray-400" />
                          <span>{educator.phone}</span>
                        </div>
                      )}
                      {educator.department && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <FaChalkboardTeacher className="text-gray-400" />
                          <span>{educator.department}</span>
                        </div>
                      )}
                      {educator.specialization && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <FaKey className="text-gray-400" />
                          <span>{educator.specialization}</span>
                        </div>
                      )}
                      {educator.dateOfJoining && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <FaCalendar className="text-gray-400" />
                          <span>Joined: {new Date(educator.dateOfJoining).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        educator.status === 'Active' 
                          ? 'bg-green-400/20 text-green-400' 
                          : 'bg-red-400/20 text-red-400'
                      }`}>
                        {educator.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  const [selectedTab, setSelectedTab] = useState('student');
  const [mounted, setMounted] = useState(false);
  
  // Student Management State
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  
  // Assignment Modal State
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [assignmentData, setAssignmentData] = useState({ programId: '', batchId: '' });
  
  // Educator Management State
  const [educators, setEducators] = useState([]);
  const [loadingEducators, setLoadingEducators] = useState(false);
  const [newEducator, setNewEducator] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: '',
    department: '',
    specialization: '',
    dateOfJoining: ''
  });

  // Module Assignment State
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [selectedEducator, setSelectedEducator] = useState(null);
  const [availableModules, setAvailableModules] = useState([]);
  const [educatorModules, setEducatorModules] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [moduleSearchTerm, setModuleSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all'); // all, selected, unselected

  useEffect(() => {
    setMounted(true);
    fetchStudents();
    fetchEducators();
    fetchPrograms();
    fetchBatches();
  }, []);
  
  // API functions for fetching data from Firebase
  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const response = await studentAPI.getAll();
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await courseAPI.getAll();
      setAvailablePrograms(response.courses || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setAvailablePrograms([]);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await batchAPI.getAll();
      setAvailableBatches(response.batches || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
      setAvailableBatches([]);
    }
  };
  
  const fetchEducators = async () => {
    setLoadingEducators(true);
    try {
      const response = await educatorAPI.getAll();
      setEducators(response.data || []);
    } catch (error) {
      console.error('Error fetching educators:', error);
      setEducators([]);
    } finally {
      setLoadingEducators(false);
    }
  };
  
  // Removed handleCreateStudent function as we're not creating students anymore
  
  const handleCreateEducator = async (e) => {
    e.preventDefault();
    if (!newEducator.firstName || !newEducator.lastName || !newEducator.email) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const educator = {
        ...newEducator,
        status: 'Active'
      };
      
      await educatorAPI.create(educator);
      setNewEducator({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        employeeId: '',
        department: '',
        specialization: '',
        dateOfJoining: ''
      });
      alert('Educator created successfully!');
      fetchEducators(); // Refresh the list
    } catch (error) {
      console.error('Error creating educator:', error);
      alert('Failed to create educator');
    }
  };
  
  const handleDeleteStudent = async (id) => {
    if (confirm('Are you sure you want to delete this student?')) {
      try {
        await studentAPI.delete(id);
        alert('Student deleted successfully!');
        fetchStudents(); // Refresh the list
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Failed to delete student');
      }
    }
  };
  
  const handleDeleteEducator = async (id) => {
    if (confirm('Are you sure you want to delete this educator?')) {
      try {
        await educatorAPI.delete(id);
        alert('Educator deleted successfully!');
        fetchEducators(); // Refresh the list
      } catch (error) {
        console.error('Error deleting educator:', error);
        alert('Failed to delete educator');
      }
    }
  };

  const handleAssignStudent = (student) => {
    setSelectedStudent(student);
    setAssignmentData({ programId: '', batchId: '' });
    setShowAssignmentModal(true);
  };

  const handleAssignmentSubmit = async () => {
    if (!assignmentData.programId) {
      alert('Please select a program');
      return;
    }

    try {
      // Enroll student in the selected program
      const enrollResponse = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          studentId: selectedStudent.id,
          courseId: assignmentData.programId,
          batchId: assignmentData.batchId || null
        }),
      });

      if (!enrollResponse.ok) {
        const errorData = await enrollResponse.json();
        throw new Error(errorData.error || 'Failed to enroll student');
      }

      // Update student's batch if selected
      if (assignmentData.batchId) {
        // You might need to create an API endpoint for updating student batch
        // For now, we'll just show success for program enrollment
      }

      alert('Student assigned successfully!');
      setShowAssignmentModal(false);
      setSelectedStudent(null);
      fetchStudents(); // Refresh the list
    } catch (error) {
      console.error('Error assigning student:', error);
      alert(error.message || 'Failed to assign student');
    }
  };

  // Module Assignment Functions
  const handleAssignModules = async (educator) => {
    setSelectedEducator(educator);
    setLoadingModules(true);
    setShowModuleModal(true);
    
    try {
      // Fetch all available modules
      const modulesResponse = await moduleAPI.getAll();
      setAvailableModules(modulesResponse.modules || []);
      
      // Fetch educator's current modules
      const educatorModulesResponse = await educatorAPI.getModules(educator.id);
      const currentModules = educatorModulesResponse.modules || [];
      setEducatorModules(currentModules);
      setSelectedModules(currentModules.map(m => m.id));
    } catch (error) {
      console.error('Error fetching modules:', error);
      alert('Failed to load modules');
    } finally {
      setLoadingModules(false);
    }
  };

  const handleModuleToggle = (moduleId) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleModuleAssignmentSubmit = async () => {
    try {
      await educatorAPI.assignModules(selectedEducator.id, selectedModules);
      alert('Modules assigned successfully!');
      setShowModuleModal(false);
      setSelectedEducator(null);
    } catch (error) {
      console.error('Error assigning modules:', error);
      alert('Failed to assign modules');
    }
  };

  const handleModuleModalClose = () => {
    setShowModuleModal(false);
    setSelectedEducator(null);
    setSelectedModules([]);
    setEducatorModules([]);
    setAvailableModules([]);
    setModuleSearchTerm('');
    setModuleFilter('all');
  };

  // Filter modules based on search term and filter type
  const filteredModules = availableModules.filter(module => {
    const matchesSearch = module.name?.toLowerCase().includes(moduleSearchTerm.toLowerCase()) ||
                         module.code?.toLowerCase().includes(moduleSearchTerm.toLowerCase()) ||
                         module.description?.toLowerCase().includes(moduleSearchTerm.toLowerCase());
    
    const matchesFilter = moduleFilter === 'all' ||
                         (moduleFilter === 'selected' && selectedModules.includes(module.id)) ||
                         (moduleFilter === 'unselected' && !selectedModules.includes(module.id));
    
    return matchesSearch && matchesFilter;
  });

  const tabVariants = {
    active: {
      scale: 1.05,
      y: -5,
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
    inactive: {
      scale: 1,
      y: 0,
      boxShadow: '0 0px 0px rgba(0, 0, 0, 0)',
      transition: { duration: 0.2 },
    },
  };

  const contentVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const featureItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animated-entry {
          animation: fadeInSlideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .glass-effect-dark-content {
          background-color: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(15px) saturate(200%);
          -webkit-backdrop-filter: blur(15px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.4);
        }
      `}</style>

      <div className="main-font p-8">
        {/* Header */}
        <header
          className={`mb-8 flex items-center opacity-0 ${mounted ? 'animated-entry' : ''}`}
          style={{ animationDelay: '0.1s' }}
        >
          <h1 className="text-3xl font-bold mb-6 text-primary flex items-center">
            <FaUserPlus className="w-8 h-8 mr-3 text-blue-400" />
            User Management
          </h1>
        </header>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <motion.button
            type="button"
            className={`px-6 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
              selectedTab === 'student'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setSelectedTab('student')}
            variants={tabVariants}
            animate={selectedTab === 'student' ? 'active' : 'inactive'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="inline-flex items-center gap-2">
              <FaUserGraduate /> Student Management
            </span>
          </motion.button>

          <motion.button
            type="button"
            className={`px-6 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
              selectedTab === 'educator'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setSelectedTab('educator')}
            variants={tabVariants}
            animate={selectedTab === 'educator' ? 'active' : 'inactive'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="inline-flex items-center gap-2">
              <FaChalkboardTeacher /> Educator Management
            </span>
          </motion.button>
        </div>

        {/* Content */}
        <motion.section
          key={selectedTab}
          className={`glass-effect-dark-content rounded-2xl p-8`}
          variants={contentVariants}
          initial="initial"
          animate="animate"
        >
          {selectedTab === 'student' ? (
            <StudentManagement 
              students={students}
              loadingStudents={loadingStudents}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedProgram={selectedProgram}
              setSelectedProgram={setSelectedProgram}
              selectedBatch={selectedBatch}
              setSelectedBatch={setSelectedBatch}
              handleAssignStudent={handleAssignStudent}
              handleDeleteStudent={handleDeleteStudent}
              availableBatches={availableBatches}
            />
          ) : (
            <EducatorManagement 
              educators={educators}
              loadingEducators={loadingEducators}
              newEducator={newEducator}
              setNewEducator={setNewEducator}
              handleCreateEducator={handleCreateEducator}
              handleDeleteEducator={handleDeleteEducator}
              handleAssignModules={handleAssignModules}
            />
          )}
        </motion.section>
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 border border-gray-600">
            <h3 className="text-xl font-semibold text-white mb-4">
              Assign Student to Program/Batch
            </h3>
            
            {selectedStudent && (
              <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
                <p className="text-white font-medium">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </p>
                <p className="text-gray-400 text-sm">{selectedStudent.email}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Program *
                </label>
                <select
                  value={assignmentData.programId}
                  onChange={(e) => setAssignmentData({...assignmentData, programId: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a program...</option>
                  {availablePrograms.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.title || program.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Batch (Optional)
                </label>
                <select
                  value={assignmentData.batchId}
                  onChange={(e) => setAssignmentData({...assignmentData, batchId: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a batch...</option>
                  {availableBatches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAssignmentModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignmentSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Assign Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Module Assignment Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl mx-4 border border-gray-600 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                Assign Modules to Educator
              </h3>
              <button
                onClick={handleModuleModalClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            {selectedEducator && (
              <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
                <p className="text-white font-medium">
                  {selectedEducator.firstName} {selectedEducator.lastName}
                </p>
                <p className="text-gray-300 text-sm">
                  {selectedEducator.email} • {selectedEducator.department}
                </p>
              </div>
            )}

            {loadingModules ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-300">Loading modules...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <h4 className="text-lg font-medium text-white">
                    Select Modules ({selectedModules.length} of {availableModules.length} selected)
                  </h4>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Search modules..."
                        value={moduleSearchTerm}
                        onChange={(e) => setModuleSearchTerm(e.target.value)}
                        className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <select
                      value={moduleFilter}
                      onChange={(e) => setModuleFilter(e.target.value)}
                      className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Modules</option>
                      <option value="selected">Selected Only</option>
                      <option value="unselected">Unselected Only</option>
                    </select>
                  </div>
                </div>
                
                {filteredModules.length > 0 ? (
                   <div className="flex items-center justify-between mb-2">
                     <div className="text-sm text-gray-400">
                       Showing {filteredModules.length} of {availableModules.length} modules
                     </div>
                     <div className="flex gap-2">
                       <button
                         onClick={() => {
                           const filteredIds = filteredModules.map(m => m.id);
                           const allSelected = filteredIds.every(id => selectedModules.includes(id));
                           if (allSelected) {
                             setSelectedModules(prev => prev.filter(id => !filteredIds.includes(id)));
                           } else {
                             setSelectedModules(prev => [...new Set([...prev, ...filteredIds])]);
                           }
                         }}
                         className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-md hover:bg-blue-600/30 transition-colors text-xs font-medium"
                       >
                         {filteredModules.every(m => selectedModules.includes(m.id)) ? 'Deselect All' : 'Select All'}
                       </button>
                     </div>
                   </div>
                 ) : moduleSearchTerm || moduleFilter !== 'all' ? (
                   <div className="text-sm text-yellow-400 mb-2">
                     No modules match your search criteria
                   </div>
                 ) : null}
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                   {filteredModules.map((module) => (
                    <div
                      key={module.id}
                      className={`group relative p-5 rounded-xl border cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                        selectedModules.includes(module.id)
                          ? 'bg-gradient-to-br from-blue-600/20 to-blue-700/10 border-blue-400 shadow-xl shadow-blue-500/20 ring-1 ring-blue-400/30'
                          : 'bg-gradient-to-br from-gray-700/40 to-gray-800/20 border-gray-600 hover:border-gray-500 hover:shadow-lg hover:shadow-gray-900/20'
                      }`}
                      onClick={() => handleModuleToggle(module.id)}
                    >
                      {/* Selection indicator */}
                      <div className="absolute top-4 right-4">
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          selectedModules.includes(module.id)
                            ? 'bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/30'
                            : 'border-gray-500 group-hover:border-gray-400 group-hover:bg-gray-600/20'
                        }`}>
                          {selectedModules.includes(module.id) && (
                            <FaCheck className="text-white text-sm" />
                          )}
                        </div>
                      </div>

                      {/* Module header */}
                      <div className="pr-12 mb-4">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex-1">
                            <h5 className={`font-bold text-xl mb-1 transition-colors ${
                              selectedModules.includes(module.id) ? 'text-blue-200' : 'text-white'
                            }`}>
                              {module.title || module.name || 'Untitled Module'}
                            </h5>
                            {selectedModules.includes(module.id) && (
                              <span className="inline-flex items-center px-3 py-1 bg-blue-500/30 text-blue-200 text-xs rounded-full font-semibold border border-blue-400/30">
                                <FaCheck className="mr-1 text-xs" />
                                Selected
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Module code and basic info */}
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-3 py-1.5 rounded-lg font-mono text-sm font-semibold ${
                            selectedModules.includes(module.id) 
                              ? 'bg-blue-500/20 text-blue-200 border border-blue-400/30' 
                              : 'bg-gray-600/60 text-gray-200 border border-gray-500/50'
                          }`}>
                            {module.code || 'No Code'}
                          </span>
                          {module.semester && (
                            <span className="px-3 py-1.5 bg-yellow-500/20 text-yellow-300 text-sm font-medium rounded-lg border border-yellow-400/30">
                              📚 Semester {module.semester}
                            </span>
                          )}
                          {module.credits && (
                            <span className="px-3 py-1.5 bg-green-500/20 text-green-300 text-sm font-medium rounded-lg border border-green-400/30">
                              🎯 {module.credits} Credits
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Module description */}
                      {module.description && (
                        <div className="mb-4">
                          <p className={`text-sm leading-relaxed line-clamp-3 ${
                            selectedModules.includes(module.id) ? 'text-blue-100/80' : 'text-gray-300/90'
                          }`}>
                            {module.description}
                          </p>
                        </div>
                      )}
                      
                      {/* Module metadata */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        {module.difficulty && (
                          <span className={`px-3 py-1.5 rounded-full font-medium border ${
                            module.difficulty === 'beginner' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                            module.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' :
                            'bg-red-500/20 text-red-300 border-red-400/30'
                          }`}>
                            📊 {module.difficulty.charAt(0).toUpperCase() + module.difficulty.slice(1)}
                          </span>
                        )}
                        {module.estimatedHours && (
                          <span className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full font-medium border border-purple-400/30">
                            ⏱️ {module.estimatedHours}h estimated
                          </span>
                        )}
                        {module.isActive !== undefined && (
                          <span className={`px-3 py-1.5 rounded-full font-medium border ${
                            module.isActive 
                              ? 'bg-green-500/20 text-green-300 border-green-400/30' 
                              : 'bg-red-500/20 text-red-300 border-red-400/30'
                          }`}>
                            {module.isActive ? '✅ Active' : '❌ Inactive'}
                          </span>
                        )}
                        {module.createdAt && (
                          <span className="px-3 py-1.5 bg-gray-500/20 text-gray-400 rounded-full font-medium border border-gray-400/30">
                            📅 Created {new Date(module.createdAt.seconds ? module.createdAt.seconds * 1000 : module.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      {/* Hover effect overlay */}
                      <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none ${
                        selectedModules.includes(module.id)
                          ? 'bg-blue-400/5'
                          : 'bg-white/0 group-hover:bg-white/5'
                      }`} />
                    </div>
                  ))}
                  
                  {filteredModules.length === 0 && availableModules.length > 0 && (
                     <div className="text-center py-8 text-gray-400">
                       <FaSearch className="mx-auto text-4xl mb-3 opacity-50" />
                       <p>No modules match your search criteria</p>
                       <button
                         onClick={() => {
                           setModuleSearchTerm('');
                           setModuleFilter('all');
                         }}
                         className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                       >
                         Clear Filters
                       </button>
                     </div>
                   )}
                   
                   {availableModules.length === 0 && (
                     <div className="text-center py-8 text-gray-400">
                       <FaBook className="mx-auto text-4xl mb-3 opacity-50" />
                       <p>No modules available</p>
                     </div>
                   )}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleModuleModalClose}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleModuleAssignmentSubmit}
                disabled={loadingModules}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Modules
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}