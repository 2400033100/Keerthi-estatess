import React, { useEffect, useRef, useState } from "react";
import App from "./App";
import { supabase } from "./supabaseClient";

const LOCAL_KEY = "keerthi-estate-data";
const DIRTY_KEY = "keerthi-estate-dirty";

const readLocal = () => {
  try {
    const saved = localStorage.getItem(LOCAL_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

export default function Root() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [initialData, setInitialData] = useState(null);
  const [status, setStatus] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);
  const latest = useRef(null);

  // Restore login (works offline too)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const push = async (data, userId) => {
    setStatus("Saving…");
    const { error: err } = await supabase.from("estate").upsert({
      user_id: userId,
      data,
      updated_at: new Date().toISOString(),
    });
    if (err) {
      setStatus("Offline – saved on this device, will sync later");
      return false;
    }
    localStorage.removeItem(DIRTY_KEY);
    setStatus("Saved ✓");
    return true;
  };

  // Load data after login
  const userId = session ? session.user.id : null;
  useEffect(() => {
    if (!userId) {
      setInitialData(null);
      return;
    }
    (async () => {
      const local = readLocal();
      const dirty = localStorage.getItem(DIRTY_KEY) === "1";
      if (dirty && local) {
        setInitialData(local);
        push(local, userId);
        return;
      }
      const { data: row, error: err } = await supabase
        .from("estate")
        .select("data")
        .eq("user_id", userId)
        .maybeSingle();
      if (!err && row) {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(row.data));
        setInitialData(row.data);
      } else if (!err && !row) {
        const start = local || [];
        setInitialData(start);
        push(start, userId);
      } else {
        setInitialData(local || []);
        setStatus("Offline – using data saved on this device");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Try again when internet returns
  useEffect(() => {
    const onOnline = () => {
      if (userId && localStorage.getItem(DIRTY_KEY) === "1" && latest.current) {
        push(latest.current, userId);
      }
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleDataChange = (data) => {
    if (data === initialData) return;
    latest.current = data;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
    localStorage.setItem(DIRTY_KEY, "1");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => push(data, userId), 800);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (err) setError("Wrong email or password, or no internet.");
    setBusy(false);
  };

  const handleLogout = () => {
    supabase.auth.signOut();
  };

  if (checking) return <div style={{ padding: 40 }}>Loading…</div>;

  if (!session) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Keerthi Estates</h1>
          <p className="login-subtitle">Secure Ledger Access</p>
          <form onSubmit={handleSignIn}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p style={{ color: "#c53030" }}>{error}</p>}
            <button
              type="submit"
              className="primary-action-btn w-full mt-4"
              disabled={busy}
            >
              {busy ? "Signing in…" : "Unlock Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (initialData === null) {
    return <div style={{ padding: 40 }}>Loading your data…</div>;
  }

  return (
    <>
      <App
        key={userId}
        initialData={initialData}
        onDataChange={handleDataChange}
        onLogout={handleLogout}
      />
      {status && (
        <div
          style={{
            position: "fixed",
            bottom: 8,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 12,
            color: "#718096",
            pointerEvents: "none",
          }}
        >
          {status}
        </div>
      )}
    </>
  );
}
