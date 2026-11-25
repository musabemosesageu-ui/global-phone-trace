'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DeviceResult {
  id: string;
  brand: string;
  model: string;
  imei_1: string;
  imei_2?: string;
  serial_number?: string;
  status: string;
  owner_name?: string;
  owner_phone?: string;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<DeviceResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = query.trim();
    if (!cleaned) return;

    setLoading(true);
    setResult(null);
    setNotFound(false);

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .or(`imei_1.eq.${cleaned},imei_2.eq.${cleaned},serial_number.eq.${cleaned}`)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      setNotFound(true);
    } else {
      setResult(data as DeviceResult);
    }

    setLoading(false);
  };

  const isStolen = result?.status?.toUpperCase() === 'STOLEN';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
            The Motivation Center Uganda
          </p>
          <h1 className="text-xl font-bold">Global Phone Trace</h1>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            href="/police-portal"
            className="text-sm text-slate-300 hover:text-white px-3 py-2"
          >
            Police Desk
          </Link>
          <Link
            href="/login"
            className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Owner Login
          </Link>
          <Link
            href="/register-device"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            Register Device
          </Link>
        </nav>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12">
        <section className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
            Verify Any Phone Before You Buy
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Check an IMEI or Serial Number instantly to see if a device has been
            reported stolen or lost.
          </p>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter 15-digit IMEI or Serial Number..."
              className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl"
            >
              {loading ? 'Checking...' : 'Verify Device'}
            </button>
          </form>

          {notFound && (
            <div className="mt-6 p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
              <p className="font-semibold">No Record Found</p>
              <p className="text-sm mt-1">
                This IMEI or Serial Number is not currently registered or flagged in our database.
              </p>
            </div>
          )}

          {result && (
            <div
              className={`mt-6 p-6 rounded-xl border ${
                isStolen
                  ? 'bg-red-50 border-red-300 text-red-950'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold">
                  {result.brand} {result.model}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    isStolen
                      ? 'bg-red-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isStolen ? 'REPORTED STOLEN' : 'CLEAN / VERIFIED'}
                </span>
              </div>
              <p className="text-sm">
                <strong>IMEI 1:</strong> {result.imei_1}
              </p>
              {result.serial_number && (
                <p className="text-sm">
                  <strong>Serial Number:</strong> {result.serial_number}
                </p>
              )}
              {isStolen && (
                <div className="mt-4 pt-4 border-t border-red-200 text-sm">
                  <p className="font-semibold text-red-800">
                    Warning: Do not purchase this device. Report to the nearest police station.
                  </p>
                  {result.owner_name && (
                    <p className="mt-1">
                      <strong>Registered Owner:</strong> {result.owner_name}
                    </p>
                  )}
                  {result.owner_phone && (
                    <p>
                      <strong>Owner Contact:</strong> {result.owner_phone}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 text-xs py-6 text-center">
        <p>© 2026 The Motivation Center Uganda - Global Phone Trace. All rights reserved.</p>
      </footer>
    </div>
  );
}
