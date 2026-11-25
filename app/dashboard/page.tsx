'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Device {
  id: string;
  owner_id?: string;
  user_id?: string;
  brand: string;
  model: string;
  imei_1: string;
  imei_2?: string;
  serial_number?: string;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      setUserEmail(session.user.email ?? null);

      const { data, error } = await supabase
        .from('devices')
        .select('*');

      if (error) {
        setErrorMsg(error.message);
      } else if (data) {
        const userId = session.user.id;
        const owned = data.filter(
          (d: Device) =>
            d.owner_id === userId ||
            d.user_id === userId ||
            (!d.owner_id && !d.user_id)
        );
        setDevices(owned.length > 0 ? owned : data);
      }

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  const handleReportStolen = async (deviceId: string) => {
    const { error } = await supabase
      .from('devices')
      .update({ status: 'STOLEN' })
      .eq('id', deviceId);

    if (!error) {
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, status: 'STOLEN' } : d))
      );
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600 font-medium">Loading your registered devices...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
            The Motivation Center Uganda
          </p>
          <h1 className="text-xl font-bold">My Registered Devices</h1>
        </div>
        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="hidden sm:inline text-xs text-slate-300">{userEmail}</span>
          )}
          <Link
            href="/register-device"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            + Add Device
          </Link>
          <button
            onClick={handleSignOut}
            className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-3 py-2 rounded-lg"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {errorMsg && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            Database error: {errorMsg}
          </div>
        )}

        {devices.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <p className="text-slate-500 mb-4">
              You haven&apos;t registered any phones or laptops yet.
            </p>
            <Link
              href="/register-device"
              className="inline-block bg-slate-900 text-white font-semibold px-6 py-3 rounded-lg"
            >
              Register Your First Device
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {devices.map((device) => {
              const isStolen = device.status?.toUpperCase() === 'STOLEN';
              return (
                <div
                  key={device.id}
                  className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase text-slate-400">
                        Phone
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          isStolen
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isStolen ? 'STOLEN' : 'CLEAN'}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {device.brand} {device.model}
                    </h2>
                    <p className="text-sm text-slate-600 mt-2">
                      <strong>IMEI 1:</strong> {device.imei_1}
                    </p>
                    {device.serial_number && (
                      <p className="text-sm text-slate-600">
                        <strong>Serial:</strong> {device.serial_number}
                      </p>
                    )}
                  </div>

                  {!isStolen && (
                    <button
                      onClick={() => handleReportStolen(device.id)}
                      className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg"
                    >
                      Report Stolen / Lost
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
