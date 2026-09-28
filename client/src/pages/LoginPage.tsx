import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/http";
import { motion } from "framer-motion";

export function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname + (location.state as any)?.from?.search || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/login", { password });
      if (response.data.token) {
        login(response.data.token);
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Invalid access key.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-panel p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
        
        <h2 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">Access Portal</h2>
        <p className="text-slate-400 text-sm mb-8 text-center">Enter your private key to access Ataraxia.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              placeholder="Enter Private Key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-accent transition-all text-center tracking-[0.5em]"
              autoFocus
            />
            {error && <p className="text-red-400 text-xs mt-3 text-center font-medium">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-accent text-white font-bold rounded-2xl shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Authenticate
          </button>
        </form>
      </motion.div>
    </div>
  );
}
