import { useState, useEffect, useCallback } from "react";
import "./Admin.css";

const API = "/api/admin";

function getToken() {
  return localStorage.getItem("admin_token") ?? "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ---- Login ----

function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      onLogin(data.token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page} className="admin-page">
      <form onSubmit={submit} style={styles.loginForm}>
        <h1 style={styles.h1}>Admin</h1>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" disabled={loading} style={styles.btn}>
          {loading ? "..." : "Login"}
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </form>
    </div>
  );
}

// ---- Image Upload ----

function ImageUpload({ value, onChange }: { value: string; onChange: (path: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      onChange(data.path);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {value && (
        <img
          src={value}
          alt="preview"
          style={{ maxHeight: 80, maxWidth: 160, objectFit: "contain", borderRadius: 4, border: "1px solid #444" }}
        />
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ ...styles.btn, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>
          {uploading ? "Uploading…" : "Choose file"}
          <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} style={{ display: "none" }} />
        </label>
        {value && (
          <span style={{ color: "#aaa", fontSize: 12, wordBreak: "break-all" }}>{value}</span>
        )}
      </div>
      {error && <span style={{ color: "#e74c3c", fontSize: 12 }}>{error}</span>}
    </div>
  );
}

// ---- Bio Tab ----

function BioTab() {
  const [bio, setBio] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    apiFetch("/bio", { headers: authHeaders() }).then(setBio).catch(() => {});
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await apiFetch("/bio", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(bio),
      });
      setMsg("Saved.");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  if (!bio) return <p>Loading…</p>;

  const fields: [string, string, string][] = [
    ["name", "Name", "text"],
    ["title", "Title", "text"],
    ["description", "Hero Description", "text"],
    ["aboutDescription", "About Description", "text"],
    ["location", "Location", "text"],
    ["email", "Email", "email"],
    ["github", "GitHub URL", "url"],
    ["linkedin", "LinkedIn URL", "url"],
    ["twitter", "Twitter URL (optional)", "url"],
    ["facebook", "Facebook URL (optional)", "url"],
    ["instagram", "Instagram URL (optional)", "url"],
    ["photo", "Photo", "image"],
  ];

  return (
    <form onSubmit={save} style={styles.form}>
      {fields.map(([key, label, type]) => (
        <label key={key} style={styles.label}>
          {label}
          {type === "image" ? (
            <ImageUpload
              value={(bio[key] as string) ?? ""}
              onChange={(path) => setBio({ ...bio, [key]: path })}
            />
          ) : (
            <input
              type={type}
              value={(bio[key] as string) ?? ""}
              onChange={(e) => setBio({ ...bio, [key]: e.target.value })}
              style={styles.input}
            />
          )}
        </label>
      ))}
      <button type="submit" disabled={saving} style={styles.btn}>
        {saving ? "Saving…" : "Save Bio"}
      </button>
      {msg && <p style={styles.msg}>{msg}</p>}
    </form>
  );
}

// ---- Generic CRUD list ----

type Row = Record<string, unknown> & { id: number };

function CrudTab({
  endpoint,
  fields,
  defaultRow,
}: {
  endpoint: string;
  fields: { key: string; label: string; type?: string; multiline?: boolean }[];
  defaultRow: Record<string, unknown>;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>(defaultRow);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    apiFetch(`/${endpoint}`, { headers: authHeaders() })
      .then((data) => setRows(data ?? []))
      .catch(() => {});
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    try {
      if (adding) {
        await apiFetch(`/${endpoint}`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(coerce(draft, fields)),
        });
      } else if (editing) {
        await apiFetch(`/${endpoint}/${editing.id}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(coerce(draft, fields)),
        });
      }
      setAdding(false);
      setEditing(null);
      setDraft(defaultRow);
      setMsg("Saved.");
      load();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  };

  const del = async (id: number) => {
    if (!confirm("Delete?")) return;
    try {
      await apiFetch(`/${endpoint}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      load();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  };

  const startEdit = (row: Row) => {
    setEditing(row);
    setAdding(false);
    setDraft({ ...row });
    setMsg("");
  };

  const startAdd = () => {
    setAdding(true);
    setEditing(null);
    setDraft(defaultRow);
    setMsg("");
  };

  const cancel = () => {
    setAdding(false);
    setEditing(null);
    setDraft(defaultRow);
    setMsg("");
  };

  return (
    <div>
      <button onClick={startAdd} style={{ ...styles.btn, marginBottom: 16 }}>+ Add</button>
      {msg && <p style={styles.msg}>{msg}</p>}

      {(adding || editing) && (
        <form onSubmit={save} style={styles.form}>
          <h3 style={{ color: "#fff", marginBottom: 12 }}>{adding ? "New" : "Edit"}</h3>
          {fields.map((f) => (
            <label key={f.key} style={styles.label}>
              {f.label}
              {f.type === "image" ? (
                <ImageUpload
                  value={String(draft[f.key] ?? "")}
                  onChange={(path) => setDraft({ ...draft, [f.key]: path })}
                />
              ) : f.multiline ? (
                <textarea
                  value={String(draft[f.key] ?? "")}
                  onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                  style={{ ...styles.input, height: 80 }}
                />
              ) : (
                <input
                  type={f.type ?? "text"}
                  value={String(draft[f.key] ?? "")}
                  onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                  style={styles.input}
                />
              )}
            </label>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" style={styles.btn}>Save</button>
            <button type="button" onClick={cancel} style={{ ...styles.btn, background: "#555" }}>Cancel</button>
          </div>
        </form>
      )}

      <table style={styles.table}>
        <thead>
          <tr>
            {fields.slice(0, 3).map((f) => (
              <th key={f.key} style={styles.th}>{f.label}</th>
            ))}
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {fields.slice(0, 3).map((f) => (
                <td key={f.key} style={styles.td}>
                  {String(row[f.key] ?? "").slice(0, 60)}
                </td>
              ))}
              <td style={styles.td}>
                <button onClick={() => startEdit(row)} style={{ ...styles.btn, padding: "4px 8px", marginRight: 4 }}>Edit</button>
                <button onClick={() => del(row.id)} style={{ ...styles.btn, padding: "4px 8px", background: "#c0392b" }}>Del</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function coerce(
  draft: Record<string, unknown>,
  fields: { key: string; type?: string }[]
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...draft };
  for (const f of fields) {
    if (f.type === "number") out[f.key] = Number(out[f.key] ?? 0);
    if (f.key === "responsibilities" || f.key === "technologies") {
      out[f.key] = String(out[f.key] ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return out;
}

// ---- Main Admin ----

type Tab = "bio" | "projects" | "experience" | "skills";

export default function Admin() {
  const [token, setToken] = useState(getToken());
  const [tab, setTab] = useState<Tab>("bio");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const login = (t: string) => {
    localStorage.setItem("admin_token", t);
    setToken(t);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken("");
  };

  if (!token) return <LoginForm onLogin={login} />;

  const tabs: Tab[] = ["bio", "projects", "experience", "skills"];

  return (
    <div style={styles.page} className="admin-page">
      <div style={styles.adminWrap}>
        <div style={styles.header}>
          <h1 style={styles.h1}>Admin</h1>
          <button onClick={logout} style={{ ...styles.btn, background: "#555" }}>Logout</button>
        </div>
        <div style={{ marginBottom: 24, background: "#222", borderRadius: 6, padding: "4px 0", display: "flex", gap: 4 }}>
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...styles.btn,
                background: tab === t ? "#e74c3c" : "transparent",
                border: "none",
                flex: 1,
                textTransform: "capitalize",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "bio" && <BioTab />}
        {tab === "projects" && (
          <CrudTab
            endpoint="projects"
            fields={[
              { key: "title", label: "Title" },
              { key: "category", label: "Category" },
              { key: "technologies", label: "Technologies" },
              { key: "image", label: "Image", type: "image" },
              { key: "description", label: "Description", multiline: true },
              { key: "order", label: "Order", type: "number" },
            ]}
            defaultRow={{ title: "", category: "", technologies: "", image: "", description: "", order: 0 }}
          />
        )}
        {tab === "experience" && (
          <CrudTab
            endpoint="experience"
            fields={[
              { key: "position", label: "Position" },
              { key: "company", label: "Company" },
              { key: "period", label: "Period" },
              { key: "location", label: "Location" },
              { key: "description", label: "Description", multiline: true },
              { key: "responsibilities", label: "Responsibilities (one per line)", multiline: true },
              { key: "technologies", label: "Technologies (one per line)", multiline: true },
              { key: "order", label: "Order", type: "number" },
            ]}
            defaultRow={{ position: "", company: "", period: "", location: "", description: "", responsibilities: "", technologies: "", order: 0 }}
          />
        )}
        {tab === "skills" && (
          <CrudTab
            endpoint="skills"
            fields={[
              { key: "category", label: "Category" },
              { key: "name", label: "Name" },
              { key: "order", label: "Order", type: "number" },
            ]}
            defaultRow={{ category: "", name: "", order: 0 }}
          />
        )}

        <div style={{ marginTop: 40, padding: 16, background: "#222", borderRadius: 8 }}>
          <h3 style={{ color: "#aaa", fontSize: 13, marginBottom: 8 }}>Rebuild site</h3>
          <p style={{ color: "#666", fontSize: 12, margin: 0 }}>
            After saving content, rebuild the static site by running:<br />
            <code style={{ color: "#e74c3c" }}>docker compose up frontend-builder</code>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#111",
    display: "flex",
    justifyContent: "center",
    padding: "40px 16px",
  },
  adminWrap: {
    width: "100%",
    maxWidth: 860,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  loginForm: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: 320,
    margin: "auto",
    paddingTop: 80,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: "#1a1a1a",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  h1: {
    color: "#fff",
    fontSize: 28,
    margin: 0,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    color: "#aaa",
    fontSize: 13,
    gap: 4,
  },
  input: {
    background: "#2a2a2a",
    border: "1px solid #444",
    borderRadius: 4,
    color: "#fff",
    padding: "8px 10px",
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
  },
  btn: {
    background: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: 14,
  },
  error: { color: "#e74c3c", margin: 0, fontSize: 13 },
  msg: { color: "#2ecc71", margin: 0, fontSize: 13 },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    color: "#aaa",
    textAlign: "left",
    padding: "8px 6px",
    borderBottom: "1px solid #333",
  },
  td: {
    color: "#ddd",
    padding: "8px 6px",
    borderBottom: "1px solid #222",
    verticalAlign: "top",
  },
};
