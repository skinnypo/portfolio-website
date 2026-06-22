import { useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import "./styles/ContactForm.css";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";

const ContactForm = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    company: "",
    message: "",
  });
  const [token, setToken] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Please complete the CAPTCHA verification.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, turnstileToken: token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to send message.");
      }
      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to send message. Please try again."
      );
      setToken("");
      turnstileRef.current?.reset();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="contact-form-section section-container" id="get-in-touch">
      <div className="contact-form-container">
        <h3>Get In Touch</h3>
        <p className="contact-form-subtitle">
          Have a project in mind or want to talk? Send me a message.
        </p>

        <div className="contact-form-card">
          {success ? (
            <div className="contact-form-success">
              <p className="contact-form-success-title">Message sent!</p>
              <p className="contact-form-success-sub">
                Thanks for reaching out. I&apos;ll get back to you soon.
              </p>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="contact-form-row">
                <div className="contact-form-field">
                  <label htmlFor="cf-name">Name *</label>
                  <input
                    id="cf-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange}
                    data-cursor="disable"
                  />
                </div>
                <div className="contact-form-field">
                  <label htmlFor="cf-email">Email *</label>
                  <input
                    id="cf-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    data-cursor="disable"
                  />
                </div>
              </div>

              <div className="contact-form-row">
                <div className="contact-form-field">
                  <label htmlFor="cf-subject">Subject *</label>
                  <input
                    id="cf-subject"
                    name="subject"
                    type="text"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    data-cursor="disable"
                  />
                </div>
                <div className="contact-form-field">
                  <label htmlFor="cf-company">
                    Company <span className="contact-form-optional">(optional)</span>
                  </label>
                  <input
                    id="cf-company"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    value={form.company}
                    onChange={handleChange}
                    data-cursor="disable"
                  />
                </div>
              </div>

              <div className="contact-form-field">
                <label htmlFor="cf-message">Message *</label>
                <textarea
                  id="cf-message"
                  name="message"
                  required
                  rows={6}
                  value={form.message}
                  onChange={handleChange}
                  data-cursor="disable"
                />
              </div>

              {SITE_KEY && (
                <Turnstile
                  ref={turnstileRef}
                  siteKey={SITE_KEY}
                  onSuccess={setToken}
                  onExpire={() => setToken("")}
                  options={{ theme: "dark" }}
                />
              )}

              {error && <p className="contact-form-error">{error}</p>}

              <button
                type="submit"
                disabled={sending}
                className="contact-form-btn"
                data-cursor="disable"
              >
                {sending ? "Sending…" : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
