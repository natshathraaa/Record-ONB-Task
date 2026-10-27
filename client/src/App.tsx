import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ChevronDown, Eye, EyeOff, Info, Linkedin, Mail, UserRound } from "lucide-react";
import { api } from "./lib/api";

type User = { id: string; name: string; email: string };
type FormValues = Record<string, string | string[]>;
const steps = [1, 2, 3, 4, 5, 6];
function apiErrorMessage(error: unknown, fallback: string) {
  const response = (error as { response?: { data?: { message?: string } } }).response;
  if (response?.data?.message) return response.data.message;
  if ((error as { request?: unknown }).request) return "The server could not be reached. Please check that the backend is running.";
  return fallback;
}

function useSession() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { api.get("/auth/me").then((r) => setUser(r.data.user)).catch(() => undefined); }, []);
  return { user, setUser };
}

function AuthCard({ mode }: { mode: "signup" | "login" }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isSignup = mode === "signup";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (!data.email || !data.password || (isSignup && !data.name)) { setError("Please complete all required fields."); setBusy(false); return; }
    try {
      const response = await api.post(`/auth/${isSignup ? "register" : "login"}`, data);
      if (isSignup) navigate("/login", { state: { message: "Account created. You can now log in." } });
      else { localStorage.setItem("user", JSON.stringify(response.data.user)); navigate("/form/1"); }
    } catch (requestError: unknown) { setError(apiErrorMessage(requestError, "Unable to create the account. Please try again.")); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><section className="auth-card">
    <h1>{isSignup ? "SIGN UP" : "LOGIN"}</h1>
    <form onSubmit={submit} className="auth-form">
      {isSignup && <label>Name<input name="name" placeholder="Your name" autoComplete="name" /><UserRound size={17} /></label>}
      <label>Email<input name="email" type="email" placeholder="Email" autoComplete="email" /><Mail size={17} /></label>
      <label>Password<div className="password-field"><input name="password" type={showPassword ? "text" : "password"} placeholder="Password" autoComplete={isSignup ? "new-password" : "current-password"} /><button className="password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label>
      {!isSignup && <label className="remember"><input type="checkbox" name="remember" /> <span>Remember me?</span></label>}
      {error && <p className="error">{error}</p>}
      <button className="pink-button" disabled={busy}>{busy ? "PLEASE WAIT..." : isSignup ? "SIGN UP" : "LOGIN"}</button>
    </form>
    <div className="or-divider"><span>OR</span></div>
    <div className="socials"><button className="social google">G</button><button className="social facebook">f</button><button className="social linkedin"><Linkedin size={20} /></button></div>
    <p className="auth-switch">{isSignup ? "Already a user?" : "Need an account?"} <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "LOGIN" : "SIGN UP"}</Link></p>
  </section></main>;
}

const stepContent: Record<number, { title: string; subtitle: string; fields: { name: string; label: string; type?: string; options?: string[] }[] }> = {
  1: { title: "It's your time!", subtitle: "Let us know about yourself first.", fields: [{ name: "name", label: "Your Name" }, { name: "username", label: "Your Username" }, { name: "role", label: "What best describes you?", options: ["Student", "Professional", "Creator"] }, { name: "location", label: "Select your location", options: ["India", "United States", "United Kingdom"] }, { name: "source", label: "How do you know us?", options: ["A friend", "Social media", "Search"] }] },
  2: { title: "", subtitle: "", fields: [{ name: "goals", label: "What's your main goal?", options: ["Build my Skill Repository", "Get a Good Job", "Upskill for Current Role", "Explore New Skills", "Make Learning a Habit!", "Others"] }] },
  3: { title: "You bring the curiosity.", subtitle: "We'll back it up with proof.", fields: [{ name: "focus", label: "What would you like to focus on?" }] },
  4: { title: "Showcase your strengths.", subtitle: "Select the skills you want to build.", fields: [{ name: "skills", label: "Choose your skills", options: ["Design", "Engineering", "Marketing", "Product"] }] },
  5: { title: "Almost there!", subtitle: "Tell us a little more about your experience.", fields: [{ name: "experience", label: "Your experience", type: "textarea" }] },
  6: { title: "Ready to get started?", subtitle: "Review your answers and continue.", fields: [{ name: "confirmation", label: "Confirm your details", options: ["Everything looks good"] }] }
};

function FormShell() {
  const { step = "1" } = useParams();
  const current = Number(step);
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>({});
  const [error, setError] = useState("");
  const content = stepContent[current] ?? stepContent[1];
  const registeredName = JSON.parse(localStorage.getItem("user") ?? '{"name":"there"}').name;
  useEffect(() => { api.get("/form").then((r) => setValues(r.data.form?.[`step${current}`] ?? {})).catch(() => undefined); }, [current]);
  function update(name: string, value: string) { setValues((old) => ({ ...old, [name]: value })); }
  function toggleGoal(goal: string) {
    setValues((old) => {
      const selected = Array.isArray(old.goals) ? old.goals : [];
      return { ...old, goals: selected.includes(goal) ? selected.filter((item) => item !== goal) : [...selected, goal] };
    });
  }
  async function next() {
    setError("");
    const missing = current === 2 || current === 3 || current === 4 || current === 5 ? false : content.fields.some((field) => !values[field.name] || (Array.isArray(values[field.name]) && values[field.name].length === 0));
    if (missing) { setError("Please complete the required field before continuing."); return; }
    try { await api.put(`/form/step/${current}`, values); navigate(current === 6 ? "/dashboard" : `/form/${current + 1}`); }
    catch (requestError: any) { setError(requestError.response?.data?.message ?? "Unable to save your response."); }
  }
  const renderFields = () => {
    if (current === 1) return <div className="fields screen-one-fields">{content.fields.map((field) => field.options ? <div className="select-wrap" key={field.name}><select aria-label={field.label} value={String(values[field.name] ?? "")} onChange={(e) => update(field.name, e.target.value)}><option value="">{field.label}</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={16} /></div> : <input aria-label={field.label} placeholder={field.label} value={String(values[field.name] ?? "")} onChange={(e) => update(field.name, e.target.value)} />)}</div>;
    if (current === 2) return <div className="screen-four-fields"><h2>Hey {registeredName}; 👋</h2><p>Let us know, how would you like to use Record for:</p><strong>{content.fields[0].label}</strong>{content.fields[0].options?.map((option) => <label className="check-option" key={option}><input type="checkbox" checked={Array.isArray(values.goals) && values.goals.includes(option)} onChange={() => toggleGoal(option)} /><span>{option}</span></label>)}</div>;
    if (current === 3) return <div className="screen-five-card"><div className="proof-copy"><h2>You bring the curiosity.<br />We'll <em>back it up with proof.</em></h2><p>Record is built for people like you – learners, job-seekers, builders. Whatever your goal, we help you verify your skill badges and turn effort into outcomes.</p>{["Earn verified skill badges from projects, courses & YouTube", "Take AI-powered assessments to showcase your skills", "Share your profile & badges publicly, like a mini portfolio", "Be visible to 200+ recruiters hiring via Record"].map((item) => <div className="proof-item" key={item}><span>⬡</span>{item}</div>)}</div><div className="quote-copy"><svg className="certificate" viewBox="0 0 64 64" aria-label="Achievement certificate"><path d="M13 8h38v39H13zM20 17h24M20 27h24M20 37h15" /><circle cx="45" cy="43" r="10" /><path d="m38 52-3 9 10-5 10 5-3-9" /></svg><p>Throughout my journey spanning projects, work experience, licenses, education, and even my personal YouTube learning playlist, I've built a strong skill set. And now, I can see them all in one place with Record.</p><strong>— Arumuthavan</strong><small>Mobile App Developer at NSIC</small></div><div className="trusted">Trusted &amp; Supported by <span>ZOHO</span><span>aws</span><span>▦ Founders Hub</span><span>Notion</span><span>StartupTN</span></div></div>;
    if (current === 4) return <div className="fields screen-three-fields">{content.fields.map((field) => field.options ? <label className="field" key={field.name}>{field.label}<div className="select-wrap"><select value={String(values[field.name] ?? "")} onChange={(e) => update(field.name, e.target.value)}><option value="">Select your option</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={16} /></div></label> : <label className="field" key={field.name}><input placeholder={field.label} value={String(values[field.name] ?? "")} onChange={(e) => update(field.name, e.target.value)} /></label>)}<p className="username-hint"><Info size={12} /> app.getrecord/username</p></div>;
    return <div className="fields">{content.fields.map((field) => field.options ? <label className="field" key={field.name}>{field.label}<div className="select-wrap"><select value={String(values[field.name] ?? "")} onChange={(e) => update(field.name, e.target.value)}><option value="">Select an option</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={16} /></div></label> : <label className="field" key={field.name}>{field.label}{field.type === "textarea" ? <textarea value={String(values[field.name] ?? "")} onChange={(e) => update(field.name, e.target.value)} /> : <input value={String(values[field.name] ?? "")} onChange={(e) => update(field.name, e.target.value)} />}</label>)}</div>;
  };
  return <main className={`form-page screen-${current}`}><header className="form-header"><button className="back-button" onClick={() => current > 1 && navigate(`/form/${current - 1}`)} disabled={current === 1}><ArrowLeft size={14} /> Back</button><div className="progress-wrap"><div className="progress-track"><span style={{ width: `${(current / 6) * 100}%` }} /></div><div className="brand-ship" style={{ left: `${((current - 1) / 5) * 100}%` }} aria-label="Record"><svg viewBox="0 0 58 48" role="img"><path d="M29 4v25M29 8l-11 8h11M29 13l12 8H29M18 16v13M40 21v8M12 30h34l-5 8H17l-5-8Z" /><path d="M8 40c7 4 14 4 21 0 7 4 14 4 21 0" /></svg></div></div><div className="record-mark" aria-hidden="true" /></header>
    <section className="form-content"><div className="form-copy"><h1>{content.title}</h1><p>{content.subtitle}</p></div>{renderFields()}{error && <p className="error centered">{error}</p>}</section>
    <footer className="form-footer"><span>or press Enter</span><button className="continue-button" onClick={next}>{current === 6 ? "Finish" : "Continue"} <Check size={16} /></button></footer>
  </main>;
}

function Dashboard() { const user = JSON.parse(localStorage.getItem("user") ?? '{"name":"there"}'); return <main className="dashboard"><div className="success-icon"><Check size={34} /></div><h1>You're all set, {user.name}!</h1><p>You have successfully completed the form.</p><Link className="continue-button" to="/form/1">Review responses</Link></main>; }
function Protected({ children }: { children: JSX.Element }) { return localStorage.getItem("user") ? children : <Navigate to="/login" replace />; }
export default function App() { const { user } = useSession(); return <Routes><Route path="/signup" element={<AuthCard mode="signup" />} /><Route path="/login" element={<AuthCard mode="login" />} /><Route path="/form/:step" element={<Protected><FormShell /></Protected>} /><Route path="/dashboard" element={<Protected><Dashboard /></Protected>} /><Route path="*" element={<Navigate to={user ? "/form/1" : "/signup"} replace />} /></Routes>; }
