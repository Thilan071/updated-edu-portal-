'use client';
import { useState, useEffect } from "react";
import { Download, CalendarCheck2, FileSearch, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

const dummyData = [
  {
    studentName: "Nimesha Perera",
    module: "Data Structures",
    repeatDate: "2025-09-10",
    paymentStatus: "Paid",
    status: "Approved",
  },
  {
    studentName: "Isuru Madushanka",
    module: "Web Development",
    repeatDate: "2025-09-12",
    paymentStatus: "Pending",
    status: "Pending",
  },
  {
    studentName: "Thilini Silva",
    module: "DBMS",
    repeatDate: "2025-09-14",
    paymentStatus: "Paid",
    status: "Approved",
  },
];

export default function RepeatedModuleTracking() {
  const [data, setData] = useState(dummyData);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleApprove = (indexToApprove) => {
    const newData = [...data];
    newData[indexToApprove].status = "Approved";
    setData(newData);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

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

        .glass-effect-dark {
          background-color: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(15px) saturate(200%);
          -webkit-backdrop-filter: blur(15px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.4);
          transition: all 0.3s ease-in-out;
        }
      `}</style>
      <div className="main-font min-h-screen bg-gray-900 text-white p-6 md:p-10">
        <motion.header
          className={`mb-8 flex items-center opacity-0 ${isMounted ? 'animated-entry' : ''}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold flex items-center header-font text-white">
            <FileSearch className="w-8 h-8 mr-3 text-blue-400" />
            Repeated Module Tracking
          </h2>
        </motion.header>

        <motion.div
          className="glass-effect-dark rounded-2xl p-6"
          variants={cardVariants}
          initial="hidden"
          animate={isMounted ? "visible" : "hidden"}
          transition={{ delay: 0.3 }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-white/10 text-white">
                <tr>
                  <th className="p-3 text-left font-semibold">Student Name</th>
                  <th className="p-3 text-left font-semibold">Module</th>
                  <th className="p-3 text-left font-semibold">Repeat Date</th>
                  <th className="p-3 text-left font-semibold">Payment Status</th>
                  <th className="p-3 text-left font-semibold">Approval Status</th>
                  <th className="p-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry, index) => (
                  <motion.tr
                    key={index}
                    className="border-t border-white/10 hover:bg-white/5 transition-colors duration-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  >
                    <td className="p-3">{entry.studentName}</td>
                    <td className="p-3">{entry.module}</td>
                    <td className="p-3">{entry.repeatDate}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-white text-xs font-medium ${
                          entry.paymentStatus === "Paid"
                            ? "bg-green-600"
                            : "bg-yellow-500"
                        }`}
                      >
                        {entry.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-white text-xs font-medium flex items-center gap-1 ${
                          entry.status === "Approved"
                            ? "bg-green-700"
                            : "bg-gray-500"
                        }`}
                      >
                        {entry.status === "Approved" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {entry.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <motion.button
                        className={`px-3 py-1 text-xs rounded-xl flex items-center gap-1 font-semibold transition-all duration-200
                          ${
                            entry.status === "Approved"
                              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        onClick={() => handleApprove(index)}
                        disabled={entry.status === "Approved"}
                        whileHover={entry.status !== "Approved" ? { scale: 1.05 } : {}}
                        whileTap={entry.status !== "Approved" ? { scale: 0.95 } : {}}
                      >
                        <CalendarCheck2 className="w-4 h-4" />
                        Approve
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          className="mt-6 flex justify-end"
          initial={{ opacity: 0, y: 20 }}
          animate={isMounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <motion.button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-4 h-4" />
            Download Report
          </motion.button>
        </motion.div>
      </div>
    </>
  );
}