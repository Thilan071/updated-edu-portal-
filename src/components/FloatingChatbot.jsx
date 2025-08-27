"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (inputMessage.trim() === "") return;

    const userMessage = { sender: "user", text: inputMessage };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const payload = {
        contents: [{ role: "user", parts: [{ text: inputMessage }] }],
      };
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
      if (!apiKey) {
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: "API key not configured." },
        ]);
        setIsLoading(false);
        return;
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      const aiText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "AI did not respond.";
      setMessages((prev) => [...prev, { sender: "ai", text: aiText }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Something went wrong." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      // Add welcome message when first opened
      setMessages([
        {
          sender: "ai",
          text: "Hi! How are you? How's your academic journey so far?"
        }
      ]);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg
              key="close"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ rotate: 180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 180, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -180, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M13 8H7" />
              <path d="M17 12H7" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Popup Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop with blue gradient and animations like dashboard */}
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleChat}
              style={{
                background: 'linear-gradient(135deg, #2B3C57 0%, #1A2840 100%)'
              }}
            >
              {/* Background blobs like dashboard */}
              <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-full mix-blend-screen filter blur-xl opacity-60 animate-blob lg:w-96 lg:h-96"></div>
              <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-full mix-blend-screen filter blur-xl opacity-60 animate-blob animation-delay-2000 lg:w-96 lg:h-96"></div>
              <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-br from-teal-600 to-sky-700 rounded-full mix-blend-screen filter blur-xl opacity-60 animate-blob animation-delay-4000 lg:w-96 lg:h-96"></div>
            </motion.div>
            
            {/* Popup Chat Interface */}
            <motion.div
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="glass-effect rounded-2xl p-6 font-sans shadow-2xl">
                <div className="glow-wrapper">
                  {/* Main Form Container */}
                  <div className="form-box-popup">
                    <div className="mb-4 pb-4 border-b border-gray-200 text-center relative">
                      <button
                        onClick={toggleChat}
                        className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                      <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
                        EduBoost AI Mentor
                      </h1>
                      <p className="text-sm text-gray-500 mt-1">
                        Hi I'm EduBoost!!
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-400 text-base italic">
                          Hi! How are you? How's your academic journey so far?
                        </div>
                      ) : (
                        messages.map((msg, i) => (
                          <div
                            key={i}
                            className={`flex mb-4 ${
                              msg.sender === "user" ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[75%] px-4 py-2 rounded-lg shadow-md break-words ${
                                msg.sender === "user"
                                  ? "bg-blue-600 text-white rounded-br-none"
                                  : "bg-gray-200 text-gray-800 rounded-bl-none"
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {isLoading && (
                      <div className="flex justify-center items-center mt-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                        <span className="ml-3 text-blue-600 font-medium text-sm">
                          AI is thinking...
                        </span>
                      </div>
                    )}

                    <div className="mt-4 flex items-center pt-4 border-t border-gray-200">
                      <input
                        type="text"
                        className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-700"
                        placeholder="Type your message..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                      />
                      <button
                        className="ml-3 px-4 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        onClick={sendMessage}
                        disabled={isLoading || inputMessage.trim() === ""}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 12L3.269 3.126A59.768 59.768 0 0721.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                          />
                        </svg>
                        <span className="hidden sm:inline ml-2 text-sm">Send</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .glass-effect { 
          background-color: rgba(255,255,255,.08); 
          backdrop-filter: blur(15px) saturate(200%); 
          -webkit-backdrop-filter: blur(15px) saturate(200%); 
          border:1px solid rgba(255,255,255,.1); 
          box-shadow:0 10px 40px rgba(0,0,0,.4); 
        }

        .glow-wrapper {
          position: relative;
          padding: 3px;
          border-radius: 1rem;
        }

        .glow-wrapper::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 1rem;
          padding: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            #3b82f6,
            transparent
          );
          background-size: 300% 300%;
          animation: shimmer-glow 3s linear infinite;
          z-index: 0;
          pointer-events: none;
          filter: drop-shadow(0 0 12px #3b82f6) drop-shadow(0 0 20px #60a5fa);
        }

        .form-box {
          position: relative;
          z-index: 1;
          background: white;
          border-radius: 1rem;
          width: 100%;
          max-width: 1152px;
          height: 80vh;
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.05);
        }

        .form-box-popup {
          position: relative;
          z-index: 1;
          background: white;
          border-radius: 1rem;
          width: 600px;
          max-width: 90vw;
          height: 500px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.15);
        }

        @keyframes shimmer-glow {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @keyframes blob { 
          0%{transform:translate(0,0) scale(1);} 
          33%{transform:translate(30px,-50px) scale(1.1);} 
          66%{transform:translate(-20px,20px) scale(.9);} 
          100%{transform:translate(0,0) scale(1);} 
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </>
  );
}
