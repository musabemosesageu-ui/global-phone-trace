"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ShieldCheck } from "lucide-react";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nin, setNin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
          const { error: profileErr } = await supabase.from("users").insert({
            id: data.user.id,
            full_name: fullName,
            phone_number: phone,
            national_id_number: nin.toUpperCase(),
            role: "owner",
          });
          if (profileErr) throw profileErr;
        }

        alert("Account created! You can now register your phones and laptops.");
        window.location.href = "/register-device";
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profile?.role === "admin") window.location.href = "/admin";
        else if (profile?.role === "police_partner") window.location.href = "/police-portal";
        else window.location.href = "/dashboard";
      }
    } catch (err: any) {
      alert(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-md border border-slate-200">
        <div className="text-center mb-6">
          <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
            The Motivation Center Uganda
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            {isSignUp ? "Create Verified Account" : "Global Phone Trace Login"}
          </h1>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Full Name (As on National ID)</label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number (e.g. +2567...)</label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">National ID Number (NIN)</label>
                <input
                  required
                  type="text"
                  value={nin}
                  onChange={(e) => setNin(e.target.value)}
                  className="w-full p-3 border rounded-xl font-mono uppercase"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
          >
            {loading ? "Please wait..." : isSignUp ? "Register & Verify Identity" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          {isSignUp ? "Already registered?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-emerald-700 font-bold hover:underline"
          >
            {isSignUp ? "Sign In" : "Create Account"}
          </button>
        </p>
      </div>
    </div>
  );
}
