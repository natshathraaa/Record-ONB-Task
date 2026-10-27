import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose, { Schema } from "mongoose";

const app = express();
const configuredClientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";
const isProduction = process.env.NODE_ENV === "production";
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    try {
      const requestUrl = new URL(origin);
      const configuredUrl = new URL(configuredClientUrl);
      const isLocalClient = ["localhost", "127.0.0.1", "::1"].includes(requestUrl.hostname)
        && requestUrl.port === configuredUrl.port;
      if (origin === configuredClientUrl || isLocalClient) return callback(null, true);
    } catch {
      return callback(new Error("Invalid client origin."));
    }
    return callback(new Error("Origin is not allowed."));
  },
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof SyntaxError && "body" in error) return res.status(400).json({ message: "The submitted form data is invalid." });
  next(error);
});

const userSchema = new Schema({ name: { type: String, required: true }, email: { type: String, unique: true, required: true, lowercase: true }, passwordHash: { type: String, required: true } }, { timestamps: true });
const formSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: "User", unique: true, required: true }, currentStep: { type: Number, default: 1 }, completed: { type: Boolean, default: false }, step1: Schema.Types.Mixed, step2: Schema.Types.Mixed, step3: Schema.Types.Mixed, step4: Schema.Types.Mixed, step5: Schema.Types.Mixed, step6: Schema.Types.Mixed }, { timestamps: true });
const User = mongoose.model("User", userSchema);
const FormResponse = mongoose.model("FormResponse", formSchema);

function tokenFor(id: string) { return jwt.sign({ id }, process.env.JWT_SECRET ?? "development-secret", { expiresIn: "7d" }); }
function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Please log in to continue." });
  try { res.locals.userId = (jwt.verify(token, process.env.JWT_SECRET ?? "development-secret") as { id: string }).id; next(); }
  catch { return res.status(401).json({ message: "Your session has expired." }); }
}
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body as Record<string, string>;
    if (!name?.trim() || !email?.trim() || !password || password.length < 8) return res.status(400).json({ message: "Name, email and a password of at least 8 characters are required." });
    if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ message: "An account with this email already exists." });
    const user = await User.create({ name: name.trim(), email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error: unknown) {
    if (error instanceof mongoose.Error.ValidationError) return res.status(400).json({ message: "Please provide a valid name, email and password." });
    if ((error as { code?: number }).code === 11000) return res.status(409).json({ message: "An account with this email already exists. Please log in instead." });
    console.error("Registration failed:", error);
    res.status(500).json({ message: "Unable to create the account. Please try again." });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body as Record<string, string>;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || !(await bcrypt.compare(password ?? "", user.passwordHash))) return res.status(401).json({ message: "Email or password is incorrect." });
    res.cookie("token", tokenFor(user.id), { httpOnly: true, sameSite: isProduction ? "none" : "lax", secure: isProduction, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch { res.status(500).json({ message: "Unable to log in." }); }
});
app.get("/api/auth/me", auth, async (_req, res) => { const user = await User.findById(res.locals.userId).select("name email"); if (!user) return res.status(401).json({ message: "User not found." }); res.json({ user: { id: user.id, name: user.name, email: user.email } }); });
app.get("/api/form", auth, async (_req, res) => { res.json({ form: await FormResponse.findOne({ userId: res.locals.userId }).lean() }); });
app.put("/api/form/step/:step", auth, async (req, res) => { const step = Number(req.params.step); if (!Number.isInteger(step) || step < 1 || step > 6) return res.status(400).json({ message: "Invalid form step." }); const update: Record<string, unknown> = { [`step${step}`]: req.body, currentStep: Math.max(step + 1, 1) }; if (step === 6) update.completed = true; const form = await FormResponse.findOneAndUpdate({ userId: res.locals.userId }, { $set: update, $setOnInsert: { userId: res.locals.userId } }, { upsert: true, new: true }); res.json({ form }); });
app.post("/api/auth/logout", (_req, res) => { res.clearCookie("token"); res.status(204).end(); });
const port = Number(process.env.PORT ?? 5000);
mongoose.connect(process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/record-form").then(() => app.listen(port, () => console.log(`API listening on ${port}`))).catch((error) => { console.error("MongoDB connection failed:", error); process.exit(1); });
