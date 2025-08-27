"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

/** Safe fetch that never throws a JSON parse error */
async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  let data;
  try {
    data = await res.json();
  } catch {
    const text = await res.text();
    data = text ? { message: text } : {};
  }
  return { ok: res.ok, status: res.status, data };
}

const App = () => {
  const [currentView, setCurrentView] = useState("login"); // 'login' | 'register' | 'forgotPassword'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // CHANGED: email -> identifier
  const [loginForm, setLoginForm] = useState({ identifier: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    dob: "",
    telephone: "",
    address: "",
    photo: null,
    role: "student", // Default to student
  });
  const [forgotPasswordForm, setForgotPasswordForm] = useState({ email: "" });

  // ---------- LOGIN ----------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await signIn('credentials', {
        email: String(loginForm.identifier).trim(),
        password: String(loginForm.password),
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        // Get the session to determine the role and redirect
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        
        if (session?.user?.role) {
          const role = session.user.role;
          if (role === "admin") window.location.href = "/dashboard/admin";
          else if (role === "educator") window.location.href = "/dashboard/educator";
          else if (role === "student") window.location.href = "/dashboard/student";
          else setError("Login successful, but role is unknown. Please contact support.");
        } else {
          setError("Login successful, but unable to determine user role.");
        }
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- REGISTER (student only) ----------
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!registerForm.password || registerForm.password.length < 8) {
      setIsLoading(false);
      setError("Password must be at least 8 characters.");
      return;
    }

    // Read photo (optional) as base64
    let photoUrl = "";
    if (registerForm.photo) {
      try {
        photoUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(registerForm.photo);
        });
      } catch {
        setIsLoading(false);
        setError("Failed to read photo file.");
        return;
      }
    }

    try {
      const payload = {
        firstName: registerForm.firstName.trim(),
        lastName: registerForm.lastName.trim(),
        email: String(registerForm.email).toLowerCase().trim(),
        password: registerForm.password, // server will hash / or model pre-save
        dob: registerForm.dob || null,
        telephone: registerForm.telephone.trim(),
        address: registerForm.address.trim(),
        photoUrl,
        role: registerForm.role, // Include selected role
      };

      const { ok, data, status } = await fetchJSON("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!ok) throw new Error(data?.error || data?.message || `Registration failed (HTTP ${status})`);

      setSuccess(data?.message || "Registered. Await admin approval.");
      // reset form
      setRegisterForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        dob: "",
        telephone: "",
        address: "",
        photo: null,
        role: "student",
      });
      setCurrentView("login");
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- FORGOT PASSWORD ----------
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = { email: String(forgotPasswordForm.email).toLowerCase().trim() };
      const { ok, data } = await fetchJSON("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // API intentionally returns a generic success message even if user isn’t found
      setSuccess(data?.message || "If an account with that email exists, a password reset link has been sent.");
      if (!ok) {
        // keep success message but show a subtle error for debugging if needed
        // setError(data?.error || data?.message || "Something went wrong.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleForgotPasswordChange = (e) => {
    const { name, value } = e.target;
    setForgotPasswordForm((prev) => ({ ...prev, [name]: value }));
  };
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setRegisterForm((prev) => ({ ...prev, photo: file }));
  };

  const getDescription = () => {
    if (currentView === "register") return "Fill out the form to create your student account";
    if (currentView === "forgotPassword") return "Enter your email to receive a password reset link";
    return "Login to your portal";
  };

  return (
    <>
      {/* Global Styles and Animations */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Open+Sans:wght@300;400;500;600&display=swap');
        body { font-family: 'Open Sans', sans-serif; }
        .header-font { font-family: 'Outfit', sans-serif; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes blob {
          0% { transform: translate(0,0) scale(1) }
          33% { transform: translate(30px,-50px) scale(1.1) }
          66% { transform: translate(-20px,20px) scale(0.9) }
          100% { transform: translate(0,0) scale(1) }
        }
        @keyframes rotateGlow { 0% { transform: translate(-50%,-50%) rotate(0) } 100% { transform: translate(-50%,-50%) rotate(360deg) } }
        .shimmer-wrapper { position: relative; border-radius: 2rem; padding: 2px; }
        .shimmer-wrapper::before {
          content: ''; position: absolute; top: 50%; left: 50%;
          width: calc(100% + 40px); height: calc(100% + 40px);
          background: conic-gradient(from 0deg, transparent 0%, transparent 20%, rgba(128,203,255,.8) 30%, rgba(0,128,255,.8) 40%, transparent 50%, transparent 70%, rgba(128,203,255,.8) 80%, rgba(0,128,255,.8) 90%, transparent 100%);
          border-radius: 50%; animation: rotateGlow 15s linear infinite; z-index: -1; filter: blur(20px); pointer-events: none;
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans bg-gradient-to-br from-[#2B3C57] to-[#1A2840]">
        {/* Blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full mix-blend-screen filter blur-xl opacity-60 animate-blob"></div>
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mix-blend-screen filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-[rgb(55,100,124)] rounded-full mix-blend-screen filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>

        {/* Card */}
        <div className="relative z-10 w-full max-w-xl bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-white/10 shimmer-wrapper">
          <div className="text-center mb-10">
            <div className="logo-container cursor-pointer flex items-center justify-center space-x-2">
              <img src="/eduboost.png" alt="EduBoost Logo" className="h-20 w-20 rounded-full shadow-lg" />
              <h1 className="text-4xl font-bold text-white tracking-wide header-font mt-2">EduBoost</h1>
            </div>
            <p className="text-white/80 mt-2">{getDescription()}</p>
          </div>

          {error && <div className="bg-red-500 text-white text-sm p-3 rounded-lg mb-4 text-center">{error}</div>}
          {success && <div className="bg-green-500 text-white text-sm p-3 rounded-lg mb-4 text-center">{success}</div>}

          {/* LOGIN */}
          <div className={`transition-opacity duration-300 ${currentView === "login" ? "opacity-100 block" : "opacity-0 hidden"}`}>
            <form onSubmit={handleLoginSubmit} className="space-y-8">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute top-1/2 left-4 -translate-y-1/2 text-white/70"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                {/* CHANGED: type=text, name=identifier, placeholder updated */}
                <input
                  type="text"
                  name="identifier"
                  placeholder="Email address or Student ID"
                  value={loginForm.identifier}
                  onChange={handleLoginChange}
                  required
                  className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-xl py-4 pl-14 pr-4 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20"
                />
              </div>
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute top-1/2 left-4 -translate-y-1/2 text-white/70"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  required
                  className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-xl py-4 pl-14 pr-4 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20"
                />
              </div>
              <div className="text-right">
                <button type="button" onClick={() => setCurrentView("forgotPassword")} className="text-white/70 text-sm hover:text-white">
                  Forgot Password?
                </button>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-white text-blue-600 font-bold py-4 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50">
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>

          {/* REGISTER */}
          <div className={`transition-opacity duration-300 ${currentView === "register" ? "opacity-100 block" : "opacity-0 hidden"}`}>
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <input type="text" name="firstName" placeholder="First Name" value={registerForm.firstName} onChange={handleRegisterChange} required className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-xl py-4 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-white/40" />
                </div>
                <div className="relative">
                  <input type="text" name="lastName" placeholder="Last Name" value={registerForm.lastName} onChange={handleRegisterChange} required className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-xl py-4 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-white/40" />
                </div>
              </div>

              <div className="relative">
                <input type="email" name="email" placeholder="Email address" value={registerForm.email} onChange={handleRegisterChange} required className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-xl py-4 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-white/40" />
              </div>

              <div className="relative">
                <input type="password" name="password" placeholder="Password (min 8 chars)" value={registerForm.password} onChange={handleRegisterChange} required className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-xl py-4 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-white/40" />
              </div>

              <div className="relative">
                <input type="date" name="dob" placeholder="Date of Birth" value={registerForm.dob} onChange={handleRegisterChange} required className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-xl py-4 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-white/40" />
              </div>

              <div className="relative">
                <input type="tel" name="telephone" placeholder="Telephone" value={registerForm.telephone} onChange={handleRegisterChange} required className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-xl py-4 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-white/40" />
              </div>

              <div className="relative">
                <input type="text" name="address" placeholder="Address" value={registerForm.address} onChange={handleRegisterChange} required className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-xl py-4 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-white/40" />
              </div>

              <div className="relative">
                <select name="role" value={registerForm.role} onChange={handleRegisterChange} required className="w-full bg-white/10 text-white border border-white/20 rounded-xl py-4 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-white/40">
                  <option value="student" className="bg-blue-600 text-white">Student</option>
                  <option value="educator" className="bg-blue-600 text-white">Educator</option>
                </select>
              </div>

              <div className="relative">
                <label htmlFor="photo-upload" className="w-full cursor-pointer flex items-center justify-between bg-white/10 text-white/50 border border-white/20 rounded-xl py-4 px-4">
                  <span>{registerForm.photo ? registerForm.photo.name : "Upload Photo"}</span>
                  <span className="text-xs px-2 py-1 rounded-md bg-white/10 hover:bg-white/20">Browse</span>
                </label>
                <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-white text-blue-600 font-bold py-4 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50">
                {isLoading ? "Registering..." : "Register"}
              </button>
            </form>
          </div>

          {/* FORGOT PASSWORD */}
          <div className={`transition-opacity duration-300 ${currentView === "forgotPassword" ? "opacity-100 block" : "opacity-0 hidden"}`}>
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-8">
              <div className="relative">
                <input type="email" name="email" placeholder="Email address" value={forgotPasswordForm.email} onChange={handleForgotPasswordChange} required className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-xl py-4 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-white/40" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-white text-blue-600 font-bold py-4 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50">
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </div>

          {/* Switcher */}
          <div className="mt-10 text-center">
            {currentView === "login" && (
              <p className="text-white/80">
                Don&apos;t have an account?
                <button onClick={() => setCurrentView("register")} className="ml-2 text-white font-semibold hover:underline">
                  Register here
                </button>
              </p>
            )}
            {currentView === "register" && (
              <p className="text-white/80">
                Already have an account?
                <button onClick={() => setCurrentView("login")} className="ml-2 text-white font-semibold hover:underline">
                  Login here
                </button>
              </p>
            )}
            {currentView === "forgotPassword" && (
              <p className="text-white/80">
                Remember your password?
                <button onClick={() => setCurrentView("login")} className="ml-2 text-white font-semibold hover:underline">
                  Return to Login
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
