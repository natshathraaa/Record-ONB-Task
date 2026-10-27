import { ChangeEvent, CSSProperties, FormEvent, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ChevronDown, Eye, EyeOff, Info, Linkedin, Mail, UserRound, Upload } from "lucide-react";
import { api } from "./lib/api";
import recordLogo from "./assets/record-logo.png";
import youtubeLogo from "./assets/youtube.svg";
import youtubeHero from "./assets/youtube-hero.svg";
import leetcodeLogo from "./assets/leetcode.svg";
import hackerrankLogo from "./assets/hackerrank.svg";
import dribbbleLogo from "./assets/dribbble.svg";
import foundersHubLogo from "./assets/founders-hub.svg";
import notionLogo from "./assets/notion.svg";
import startupTnLogo from "./assets/startup-tn.svg";
import proofCertificate from "./assets/proof-certificate.png";
import proofMark from "./assets/proof-mark.png";
import zohoReference from "./assets/zoho-reference.png";
import awsReference from "./assets/aws-reference.png";

type User = { id: string; name: string; email: string };
type FormValues = Record<string, string | string[]>;
const formSteps = [1, 2, 3, 4, 5];
const progressMap: Record<number, number> = { 1: 0, 2: 20, 3: 40, 4: 60, 5: 80 };

const skillsCatalog = {
  Business: ["DaVinci Resolve", "Microsoft SharePoint", "IBA Entry Certificate in Business Analysis", "Microsoft Project", "Operations Management", "Microsoft Access", "Management Skills", "Lean", "Sony Vegas", "Quality Checking", "Business Model Canvas", "Technical Writing", "HR Analytics", "Online Course Creation", "Microsoft PowerPoint"],
  Design: ["Cinematic Editing", "Wix", "Adobe Premiere Pro", "User Experience (UX) design", "Fashion", "Game Design", "Canva", "Character Design", "Sewing", "Building Information Modelling (BIM)", "Mobile App design", "Textiles", "Illustration", "Virtual Reality", "UI/UX"]
};

function apiErrorMessage(error: unknown, fallback: string) {
  const response = (error as { response?: { data?: { message?: string } } }).response;
  if (response?.data?.message) return response.data.message;
  if ((error as { request?: unknown }).request) return "The server could not be reached. Please check that the backend is running.";
  return fallback;
}

function useSession() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    api.get("/auth/me").then((response) => {
      setUser(response.data.user);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }).catch(() => undefined);
  }, []);
  return user;
}

function AuthCard({ mode }: { mode: "signup" | "login" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const isSignup = mode === "signup";
  const successMessage = notice || (!isSignup && (location.state as { message?: string } | null)?.message);

  useEffect(() => {
    setEmail("");
    setPassword("");
    setError("");
    setNotice("");
    setShowPassword(false);
  }, [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (!data.email || !data.password || (isSignup && !data.name)) {
      setError("Please complete all required fields.");
      setBusy(false);
      return;
    }
    try {
      const response = await api.post("/auth/" + (isSignup ? "register" : "login"), data);
      if (isSignup) {
        const message = "Account created successfully. Redirecting to login...";
        setNotice(message);
        window.setTimeout(() => navigate("/login", { state: { message: "Account created successfully. Please log in." } }), 1200);
      }
      else {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setNotice("Login successful. Redirecting to your form...");
        window.setTimeout(() => navigate("/form/1"), 1200);
      }
    } catch (requestError: unknown) {
      setError(apiErrorMessage(requestError, "Unable to create the account. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-page"><section className="auth-card">
    <h1>{isSignup ? "SIGN UP" : "LOGIN"}</h1>
    <form onSubmit={submit} className="auth-form" autoComplete="off">
      {isSignup && <label>Name<input name="name" placeholder="Your name" autoComplete="name" /><UserRound size={17} /></label>}
      <label>Email<input name="email" type="email" placeholder="Email" autoComplete={isSignup ? "email" : "new-password"} value={email} onChange={(event) => setEmail(event.target.value)} /><Mail size={17} /></label>
      <label>Password<div className="password-field"><input name="password" type={showPassword ? "text" : "password"} placeholder="Password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /><button className="password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label>
      {!isSignup && <><label className="remember"><input type="checkbox" name="remember" /> <span>Remember me?</span></label><p className="forgot-password">Forgot Password?</p></>}
      {successMessage && <p className="success-message" role="status">{successMessage}</p>}
      {error && <p className="error">{error}</p>}
      <button className="pink-button" disabled={busy}>{busy ? "PLEASE WAIT..." : isSignup ? "SIGN UP" : "LOGIN"}</button>
    </form>
    <div className="or-divider"><span>OR</span></div>
    <div className="socials"><button className="social google" type="button">G</button><button className="social facebook" type="button">f</button><button className="social linkedin" type="button"><Linkedin size={20} /></button></div>
    <p className="auth-switch">{isSignup ? "Already a user?" : "Need an account?"} <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "LOGIN" : "SIGN UP"}</Link></p>
  </section></main>;
}

const stepContent: Record<number, { title: string; subtitle: string; fields: { name: string; label: string; options?: string[] }[] }> = {
  1: { title: "It's your time!", subtitle: "Let us know about yourself first.", fields: [{ name: "name", label: "Your Name" }, { name: "username", label: "Your Username" }, { name: "role", label: "What best describes you?", options: ["Student", "Professional", "Creator"] }, { name: "location", label: "Select your location", options: ["India", "United States", "United Kingdom"] }, { name: "source", label: "How do you know us?", options: ["A friend", "Social media", "Search"] }] },
  2: { title: "", subtitle: "", fields: [{ name: "goals", label: "What's your main goal?", options: ["Build my Skill Repository", "Get a Good Job", "Upskill for Current Role", "Explore New Skills", "Make Learning a Habit!", "Others"] }] },
  3: { title: "", subtitle: "", fields: [] },
  4: { title: "What's your Interest?", subtitle: "Let us know what you are most curious about.", fields: [{ name: "skills", label: "Selected Skills" }] },
  5: { title: "Set your profile", subtitle: "This is important!", fields: [{ name: "jobStatus", label: "Are you actively looking for a job?", options: ["Yes, I'm actively seeking", "No, I'm not looking"] }] }
};

function FormShell() {
  const { step = "1" } = useParams();
  const current = Number(step);
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>({});
  const [error, setError] = useState("");
  const [profilePreview, setProfilePreview] = useState("");
  const [expandedSkillGroups, setExpandedSkillGroups] = useState<Record<string, boolean>>({});
  const content = stepContent[current] ?? stepContent[1];
  const stored = JSON.parse(localStorage.getItem("user") ?? '{"name":"there"}') as { name: string };
  const progress = progressMap[current] ?? 0;

  useEffect(() => {
    if (!formSteps.includes(current)) return;
    setError("");
    api.get("/form").then((response) => {
      const saved = response.data.form?.["step" + current] ?? {};
      setValues(saved);
      setProfilePreview(typeof saved.profilePhoto === "string" ? saved.profilePhoto : "");
    }).catch(() => undefined);
  }, [current]);

  function update(name: string, value: string | string[]) {
    setValues((old) => ({ ...old, [name]: value }));
  }

  function toggleGoal(goal: string) {
    const selected = Array.isArray(values.goals) ? values.goals : [];
    update("goals", selected.includes(goal) ? selected.filter((item) => item !== goal) : [...selected, goal]);
  }

  function toggleSkill(skill: string) {
    const selected = Array.isArray(values.skills) ? values.skills : [];
    update("skills", selected.includes(skill) ? selected.filter((item) => item !== skill) : [...selected, skill]);
  }

  function handleProfilePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const preview = String(reader.result ?? "");
      setProfilePreview(preview);
      update("profilePhoto", preview);
    };
    reader.readAsDataURL(file);
  }

  async function next() {
    setError("");
    const fieldsToValidate = current === 3 ? [] : content.fields;
    const missing = fieldsToValidate.some((field) => {
      const value = values[field.name];
      return Array.isArray(value) ? value.length === 0 : !String(value ?? "").trim();
    });
    if (missing) {
      setError("Please complete the required field before continuing.");
      return;
    }
    try {
      await api.put("/form/step/" + current, values);
      navigate(current === 5 ? "/dashboard" : "/form/" + (current + 1));
    } catch (requestError: unknown) {
      setError(apiErrorMessage(requestError, "Unable to save your response."));
    }
  }

  function renderFields() {
    if (current === 1) {
      return <div className="fields screen-one-fields">{content.fields.map((field) => field.options ? <div className="select-wrap" key={field.name}><select className={values[field.name] ? "has-value" : ""} aria-label={field.label} value={String(values[field.name] ?? "")} onChange={(event) => update(field.name, event.target.value)}><option value="">{field.label}</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={16} /></div> : <div className="screen-one-input" key={field.name}><input aria-label={field.label} placeholder={field.label} value={String(values[field.name] ?? "")} onChange={(event) => update(field.name, event.target.value)} />{field.name === "username" && <p className="username-hint"><Info size={12} /> app.getrecord/username</p>}</div>)}</div>;
    }
    if (current === 2) {
      return <div className="screen-four-fields"><h2>Hey {stored.name}; 👋</h2><p>Let us know, how would you like to use Record for:</p><strong>{content.fields[0].label}</strong>{content.fields[0].options?.map((option) => <label className="check-option" key={option}><input type="checkbox" checked={Array.isArray(values.goals) && values.goals.includes(option)} onChange={() => toggleGoal(option)} /><span>{option}</span></label>)}</div>;
    }
    if (current === 3) {
      return <div className="screen-five-card"><div className="proof-copy"><h2>You bring the curiosity.<br />We'll <em>back it up with proof.</em></h2><p>Record is built for people like you – learners, job-seekers, builders. Whatever your goal, we help you earn verified skill badges and turn effort into outcomes.</p>{["Earn verified skill badges from projects, courses & YouTube", "Take AI-powered assessments to showcase your skills", "Share your profile & badges publicly, like a mini portfolio", "Be visible to 200+ recruiters hiring via Record"].map((item) => <div className="proof-item" key={item}><img src={proofMark} alt="" />{item}</div>)}</div><div className="quote-copy"><img className="certificate" src={proofCertificate} alt="Achievement certificate" /><p>Throughout my journey spanning projects, work experience, licenses, education, and even my personal YouTube learning playlist, I've built a strong skill set. And now, I can see them all in one place with Record.</p><strong>— Arunmathavan</strong><small>Mobile App Developer at NSIC</small></div><div className="trusted"><span className="trusted-label">Trusted &amp; Supported by</span><img className="reference-logo" src={zohoReference} alt="Zoho" /><img className="reference-logo" src={awsReference} alt="AWS" /><img src={foundersHubLogo} alt="Microsoft for Startups Founders Hub" /><img src={notionLogo} alt="Notion" /><img src={startupTnLogo} alt="StartupTN" /></div></div>;
    }
    if (current === 4) {
      const selected = Array.isArray(values.skills) ? values.skills : [];
      const query = String(values.skillSearch ?? "");
      const groups = Object.entries(skillsCatalog).map(([name, skills]) => [name, skills.filter((skill) => skill.toLowerCase().includes(query.toLowerCase()))] as const).filter(([, skills]) => skills.length);
      return <div className="interest-step"><input className="skill-search" placeholder="Search Skills i.e figma, front end" value={query} onChange={(event) => update("skillSearch", event.target.value)} /><p className="skill-count">({selected.length}/5 skills selected — you can edit later)</p>{selected.length > 0 && <><p className="selected-label">Selected Skills</p><div className="selected-skills">{selected.map((skill) => <button type="button" className="skill-chip selected" key={skill} onClick={() => toggleSkill(skill)}>{skill} ×</button>)}</div></>}{groups.map(([group, skills]) => { const expanded = expandedSkillGroups[group] || Boolean(query); const visibleSkills = expanded ? skills : skills.slice(0, 10); return <div className="skill-group" key={group}><strong>{group}</strong><div className="skill-options">{visibleSkills.map((skill) => <button type="button" className={"skill-chip " + (selected.includes(skill) ? "selected" : "")} key={skill} onClick={() => toggleSkill(skill)}>{skill}</button>)}</div>{skills.length > 10 && <button type="button" className="see-more" onClick={() => setExpandedSkillGroups((old) => ({ ...old, [group]: !expanded }))}>{expanded ? "See less" : "See more"}</button>}</div>; })}</div>;
    }
    return <div className="profile-step"><div className="profile-avatar">{profilePreview ? <img src={profilePreview} alt="Profile preview" /> : <UserRound size={44} />}</div><small>Your Profile Preview</small><label className="upload-button"><Upload size={15} /> Upload Photo<input type="file" accept="image/*" onChange={handleProfilePhoto} /></label><p>Are you actively looking for a job?</p>{content.fields[0].options?.map((option) => <label className="radio-option" key={option}><input type="radio" name="jobStatus" checked={values.jobStatus === option} onChange={() => update("jobStatus", option)} />{option}</label>)}</div>;
  }

  if (!formSteps.includes(current)) return <Navigate to="/form/1" replace />;

  return <form className={"form-page screen-" + current} onSubmit={(event) => { event.preventDefault(); void next(); }}><header className="form-header"><button className="back-button" type="button" onClick={() => { setError(""); if (current > 1) navigate("/form/" + (current - 1)); }} disabled={current === 1}><ArrowLeft size={14} /> Back</button><div className="progress-wrap"><div className="progress-track"><span style={{ width: progress + "%" }} /></div><div className="brand-ship" style={{ left: progress + "%" }} aria-label="Record"><svg viewBox="0 0 58 48" role="img"><path d="M29 4v25M29 8l-11 8h11M29 13l12 8H29M18 16v13M40 21v8M12 30h34l-5 8H17l-5-8Z" /><path d="M8 40c7 4 14 4 21 0 7 4 14 4 21 0" /></svg></div></div><div className="record-mark" aria-label="Record logo" /></header><section className="form-content"><div className="form-copy"><h1>{content.title}</h1><p>{content.subtitle}</p></div>{renderFields()}{error && <p className="error centered">{error}</p>}</section><footer className="form-footer"><span>or press Enter</span><button type="submit" className="continue-button">{current === 5 ? "Finish" : "Continue"} <Check size={16} strokeWidth={2.5} /></button></footer></form>;
}

function Dashboard() {
  type DashboardForm = { step1?: { name?: string; username?: string; role?: string; location?: string }; step2?: { goals?: string[] }; step4?: { skills?: string[] }; step5?: { profilePhoto?: string; jobStatus?: string }; completed?: boolean };
  type Course = { title: string; progress: number; tone: string; thumbnail: string; videoUrl?: string };
  type Integration = { name: string; logo: string; description: string };
  const cachedUser = JSON.parse(localStorage.getItem("user") ?? '{"name":"there"}') as { name: string };
  const [form, setForm] = useState<DashboardForm | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { api.get("/form").then((response) => setForm((response.data.form ?? {}) as DashboardForm)).catch(() => setForm({})).finally(() => setLoaded(true)); }, []);
  const step1 = form?.step1 ?? {};
  const step4 = form?.step4 ?? {};
  const step5 = form?.step5 ?? {};
  const name = step1.name?.trim() || cachedUser.name || "there";
  const photo = step5.profilePhoto;
  const youtubeCourses: Course[] = [
    { title: "Digital Marketing Mastery for Business", progress: 93, tone: "course-0", thumbnail: "https://i.ytimg.com/vi/bixR-KIJKYM/hqdefault.jpg" },
    { title: "MySQL Playlist", progress: 91, tone: "course-1", thumbnail: "https://i.ytimg.com/vi/7S_tz1z_5bA/hqdefault.jpg" },
    { title: "RESTful Web Services and API Testing", progress: 91, tone: "course-2", thumbnail: "https://i.ytimg.com/vi/Q-BpqyOT3a8/hqdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=Q-BpqyOT3a8" },
    { title: "Comprehensive Python Programming", progress: 89, tone: "course-3", thumbnail: "https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg" }
  ];
  const courses = youtubeCourses.map((course, index) => ({ ...course, progress: form?.completed ? 100 - index * 4 : course.progress }));
  const integrations: Integration[] = [
    { name: "LeetCode", logo: leetcodeLogo, description: "Highlight your problem solving skills with coding challenges completed." },
    { name: "HackerRank", logo: hackerrankLogo, description: "Prove your expertise through coding badges, challenges, and achievements." },
    { name: "Dribbble", logo: dribbbleLogo, description: "Display your creative designs and build a strong visual portfolio." }
  ];
  const activities = Array.from({ length: 35 }, (_, index) => index % 7 === 0 || index % 11 === 0);
  if (!loaded) return <main className="dashboard-loading"><div className="loading-sidebar" /><div className="loading-content"><span /><span /><span /><span /></div></main>;
  return <main className={"dashboard-shell " + (collapsed ? "sidebar-collapsed" : "")}><aside className="dashboard-sidebar"><div className="dashboard-brand"><img src={recordLogo} alt="Record" /><strong>Record</strong><small>v1.25.0</small></div><nav><a className="active">▦　Dashboard</a><a>♙　Profile</a><a>♧　Skill Repository</a><a>▣　Learnings</a><a>▤　Jobs</a><div className="nav-submenu"><a>Offers</a><a>Applied</a></div><a>◈　Tools</a><div className="nav-submenu"><a>YouTube to Course</a><a>One Click Resume</a><a>AI Assessment</a></div></nav><div className="dashboard-footer">◉　Support<br />⌁　Feedback<br /><br /><small>Privacy Policy | Terms &amp; Conditions<br />© 2026 Record Innovation and<br />Enterprise Pvt. Ltd.</small></div></aside><section className="dashboard-main"><header className="dashboard-topbar"><button className="collapse-button" aria-label="Collapse sidebar" onClick={() => setCollapsed(!collapsed)}>▣</button><span>Dashboard</span><div className="top-actions"><button>⚡ Upgrade</button><b>＋</b><span>♧</span>{photo ? <img src={photo} alt={name} /> : <i>{name.charAt(0).toUpperCase()}</i>}</div></header><div className="dashboard-content"><p className="welcome-banner">Welcome {name}</p><p className="success-banner">You have successfully completed the onboarding form!</p><div className="dashboard-columns"><div className="dashboard-primary"><div className="dashboard-hero"><div><img className="youtube-mark" src={youtubeLogo} alt="Powered by YouTube" /><h2>Claim Skill badges from<br />YouTube Contents</h2><button>Try the tool　→</button></div><img className="hero-preview" src={youtubeHero} alt="Web Development Masterclass" /></div><div className="dashboard-section-title"><h3>Learning In progress</h3><button>View More　→</button></div><div className="learning-grid">{courses.map((course) => <article className="learning-card" key={course.title}>{course.videoUrl ? <a className="course-link" href={course.videoUrl} target="_blank" rel="noreferrer"><div className={"course-image " + course.tone}><img src={course.thumbnail} alt="" /><span>{course.title}</span></div></a> : <div className={"course-image " + course.tone}><img src={course.thumbnail} alt="" /><span>{course.title}</span></div>}<strong>{course.title}</strong><small>Progress <span>{course.progress}%</span></small><span className="course-progress"><i style={{ "--progress": course.progress + "%" } as CSSProperties} /></span><small>Powered by YouTube</small></article>)}</div><div className="dashboard-section-title"><h3>Showcase in one profile</h3><button>View More　→</button></div><div className="showcase-grid">{integrations.map((integration) => <article className="showcase-card" key={integration.name}><img className={"integration-logo integration-" + integration.name.toLowerCase()} src={integration.logo} alt="" /><strong>{integration.name}</strong><button>Connect</button><p>{integration.description}</p></article>)}</div></div><aside className="dashboard-rail"><h3>Skill Badges</h3><div className="badge-grid"><div><strong>◉ {42 + (step4.skills?.length ?? 0)}</strong><small>Role Based</small></div><div><strong>◉ {Math.max(2, Math.ceil((step4.skills?.length ?? 0) / 2))}</strong><small>Super Skills</small></div></div><section className="activity-card"><header><strong>Learning Activities</strong><span>ⓘ　Jan⌄</span></header><div className="week-labels">Su　 Mo　 Tu　 We　 Th　 Fr　 Sa</div><div className="activity-grid">{activities.map((active, index) => <i key={index} className={active ? "filled" : ""} />)}</div><footer>Less　<span>▪▪▪▪</span> More</footer></section></aside></div></div></section></main>;
}

function Protected({ children }: { children: JSX.Element }) {
  return localStorage.getItem("user") ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const user = useSession();
  return <Routes><Route path="/signup" element={<AuthCard mode="signup" />} /><Route path="/login" element={<AuthCard mode="login" />} /><Route path="/form/:step" element={<Protected><FormShell /></Protected>} /><Route path="/dashboard" element={<Protected><Dashboard /></Protected>} /><Route path="*" element={<Navigate to={user ? "/form/1" : "/signup"} replace />} /></Routes>;
}
