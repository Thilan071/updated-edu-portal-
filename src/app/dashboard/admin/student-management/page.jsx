'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Pencil, Trash, Eye, Lock, UserX, UserPlus } from 'lucide-react'
import Link from 'next/link'

const mockStudents = [
  {
    id: 'ST001',
    name: 'Nadeesha Perera',
    email: 'nadeesha@nibm.lk',
    batch: 'BATCH23C',
    modules: ['OOP', 'DBMS'],
    participation: '87%',
    assessments: '3 Passed, 1 Repeat',
    status: 'Active'
  },
  {
    id: 'ST002',
    name: 'Ishara Gunasekara',
    email: 'ishara@nibm.lk',
    batch: 'BATCH24A',
    modules: ['SE', 'CN'],
    participation: '92%',
    assessments: 'All Passed',
    status: 'Active'
  }
]

export default function StudentManagementPage() {
  const [students, setStudents] = useState(mockStudents);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDelete = (id) => {
    const confirm = window.confirm('Are you sure you want to delete this student?');
    if (confirm) {
      setStudents(prev => prev.filter(student => student.id !== id));
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes subtleScale {
          0% { transform: scale(1); }
          50% { transform: scale(1.01); }
          100% { transform: scale(1); }
        }

        .animated-entry {
          animation: fadeInSlideUp 0.6s ease-out forwards;
        }

        .card-hover:hover {
          animation: subtleScale 0.3s ease-in-out forwards;
        }
        
        .glass-effect-dark {
          background-color: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(15px) saturate(200%);
          -webkit-backdrop-filter: blur(15px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.4);
          transition: all 0.3s ease-in-out;
        }

        .glass-effect-dark:hover {
          background-color: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-5px) scale(1.01);
          box-shadow: 0 15px 50px 0 rgba(0, 0, 0, 0.5);
        }
      `}</style>

      <div className="main-font min-h-screen p-6 md:p-10 text-white bg-gray-900">
        <motion.header
          className={`mb-8 flex items-center opacity-0 ${isMounted ? 'animated-entry' : ''}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-4xl font-bold flex items-center header-font text-white">
            <UserPlus className="w-8 h-8 mr-3 text-blue-400" />
            Student Management
          </h1>
        </motion.header>

        <div className="space-y-4">
          {students.map((student, index) => (
            <motion.div
              key={student.id}
              className={`p-4 flex flex-col md:flex-row justify-between items-start md:items-center rounded-2xl glass-effect-dark transition-all duration-300`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.01, boxShadow: '0 15px 50px rgba(0, 0, 0, 0.5)', y: -3 }}
            >
              <div className="flex-grow mb-4 md:mb-0">
                <h2 className="text-xl font-semibold text-white">{student.name}</h2>
                <p className="text-sm text-gray-400">{student.email}</p>
                <div className="mt-2 text-sm text-gray-300 space-y-1">
                  <p>Batch: <span className="font-medium text-blue-300">{student.batch}</span></p>
                  <p>Modules: <span className="font-medium text-green-300">{student.modules.join(', ')}</span></p>
                  <p>Participation: <span className="font-medium text-yellow-300">{student.participation}</span></p>
                  <p>Assessments: <span className="font-medium text-purple-300">{student.assessments}</span></p>
                  <p>Status: <span className="font-medium text-red-300">{student.status}</span></p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild className="glass-effect-dark hover:bg-white/20 text-blue-300 border-blue-600 transition-all">
                  <Link href={`/students/${student.id}`}>
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Link>
                </Button>
                <Button className="glass-effect-dark hover:bg-white/20 text-green-300 border-green-600 transition-all">
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button className="glass-effect-dark hover:bg-white/20 text-yellow-300 border-yellow-600 transition-all">
                  <Lock className="w-4 h-4 mr-1" />
                  Reset
                </Button>
                <Button className="glass-effect-dark hover:bg-white/20 text-gray-400 border-gray-600 transition-all">
                  <UserX className="w-4 h-4 mr-1" />
                  Disable
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white transition-all"
                  onClick={() => handleDelete(student.id)}
                >
                  <Trash className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  )
}