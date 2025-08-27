"use client";

import React, { useState, useRef, useEffect } from "react";

function App() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 font-sans">
      <div className="glow-wrapper">
        {/* 🟦 Main Form Container */}
        <div className="form-box">
          <div className="mb-4 pb-4 border-b border-gray-200 text-center">
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
              EduBoost AI Mentor
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Hi I'm EduBoost!!
            </p>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-lg italic">
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
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-blue-600 font-medium">
                AI is thinking...
              </span>
            </div>
          )}

          <div className="mt-6 flex items-center pt-4 border-t border-gray-200">
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
              className="ml-3 px-5 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              onClick={sendMessage}
              disabled={isLoading || inputMessage.trim() === ""}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                className="w-6 h-6"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
              <span className="hidden sm:inline ml-2">Send</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
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
          max-width: 1152px; /* bit longer width */
          height: 80vh;
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.05);
        }

        @keyframes shimmer-glow {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
