const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const Stripe = require("stripe");
const crypto = require("crypto");
const dayjs = require("dayjs");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

function toOrigin(value) {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
}

const PORT = Number(process.env.PORT || 4000);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const FRONTEND_URLS = (process.env.FRONTEND_URLS || FRONTEND_URL)
  .split(",")
  .map((value) => toOrigin(value))
  .filter(Boolean);
const PRIMARY_FRONTEND_URL = FRONTEND_URLS[0] || "http://localhost:3000";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PAYMENT_BUCKET = process.env.PAYMENT_BUCKET || "payment-screenshots";
const HABIT_IMAGE_BUCKET = process.env.HABIT_IMAGE_BUCKET || "habit-images";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "riazhussain";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Allah$343";
const ADMIN_SESSION_HOURS = Number(process.env.ADMIN_SESSION_HOURS || 24);
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_SESSION_MS = 1000 * 60 * 60 * Math.max(1, ADMIN_SESSION_HOURS);
let adminPasswordValue = ADMIN_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  // Fail fast: backend must have valid Supabase credentials.
  throw new Error("Missing Supabase environment variables.");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

function createUserClient(token) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

app.use(cors({
  origin(origin, callback) {
    // Allow server-to-server requests and tools that do not send an Origin header.
    if (!origin) return callback(null, true);
    const normalizedOrigin = toOrigin(origin);
    if (FRONTEND_URLS.includes(normalizedOrigin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: "8mb" }));

function isMissingTableError(error) {
  return error?.code === "42P01" || /relation .* does not exist/i.test(error?.message || "");
}

function isRlsError(error) {
  const message = error?.message || "";
  return error?.code === "42501" || /row-level security policy/i.test(message);
}

function isMissingBucketError(error) {
  const message = error?.message || "";
  return error?.statusCode === 404 || /bucket .* not found|bucket not found|No such bucket/i.test(message);
}

async function ensurePublicBucket(bucketName) {
  const { data: bucket, error: getBucketError } = await supabaseAdmin.storage.getBucket(bucketName);

  if (bucket) {
    if (bucket.public === false) {
      const { error: updateError } = await supabaseAdmin.storage.updateBucket(bucketName, { public: true });
      if (updateError) throw updateError;
    }
    return;
  }

  if (getBucketError && !isMissingBucketError(getBucketError)) {
    throw getBucketError;
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, { public: true });
  if (createError && !/already exists/i.test(createError.message || "")) {
    throw createError;
  }

  const { data: repairedBucket, error: repairedGetError } = await supabaseAdmin.storage.getBucket(bucketName);
  if (repairedGetError) throw repairedGetError;
  if (repairedBucket?.public === false) {
    const { error: updateError } = await supabaseAdmin.storage.updateBucket(bucketName, { public: true });
    if (updateError) throw updateError;
  }
}

async function ensurePaymentBucket() {
  await ensurePublicBucket(PAYMENT_BUCKET);
}

async function uploadHabitImage(file, userId) {
  if (!file?.mimetype?.startsWith("image/")) {
    throw new Error("Habit picture must be an image file.");
  }

  await ensurePublicBucket(HABIT_IMAGE_BUCKET);

  const safeName = (file.originalname || "habit-image").replace(/\s+/g, "-");
  const filename = `${userId}/${Date.now()}-${safeName}`;

  let { error: uploadError } = await supabaseAdmin.storage
    .from(HABIT_IMAGE_BUCKET)
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError && isMissingBucketError(uploadError)) {
    await ensurePublicBucket(HABIT_IMAGE_BUCKET);
    ({ error: uploadError } = await supabaseAdmin.storage
      .from(HABIT_IMAGE_BUCKET)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      }));
  }

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabaseAdmin.storage.from(HABIT_IMAGE_BUCKET).getPublicUrl(filename);
  return publicUrlData?.publicUrl || "";
}

function toSafeArray(value) {
  return Array.isArray(value) ? value : [];
}

async function generateGeminiJson(prompt, fallback) {
  if (!GEMINI_API_KEY) return fallback;

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!geminiResponse.ok) return fallback;

    const raw = await geminiResponse.json();
    const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(text);
    return parsed || fallback;
  } catch {
    return fallback;
  }
}

function getBearerToken(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.replace("Bearer ", "").trim();
}

async function upsertUserRow(user) {
  const userId = user?.id;
  const email = (user?.email || "").trim().toLowerCase();
  if (!userId || !email) return;

  const { error } = await supabaseAdmin
    .from("users")
    .upsert({ id: userId, email }, { onConflict: "id" });

  if (error && !isMissingTableError(error)) {
    throw error;
  }
}

async function findUserByEmail(email) {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return null;

  const { data: userRow, error: userError } = await supabaseAdmin
    .from("users")
    .select("id,email")
    .eq("email", normalized)
    .maybeSingle();

  if (userError && !isMissingTableError(userError)) {
    throw userError;
  }

  if (userRow?.id) return userRow;

  // Fallback for users that exist in Supabase Auth but were never synced to the users table.
  const perPage = 200;
  for (let page = 1; page <= 10; page += 1) {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (authError) throw authError;

    const users = authData?.users || [];
    if (!users.length) break;

    const matched = users.find((item) => (item?.email || "").toLowerCase() === normalized);
    if (matched?.id) {
      await upsertUserRow({ id: matched.id, email: matched.email });
      return { id: matched.id, email: (matched.email || normalized).toLowerCase() };
    }
  }

  return null;
}

async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Missing auth token" });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid auth token" });
    }

    try {
      await upsertUserRow(data.user);
    } catch (syncError) {
      console.warn("Failed to sync user row:", syncError.message);
    }

    req.user = data.user;
    req.token = token;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Auth middleware failed", details: error.message });
  }
}

async function requireAdmin(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from("admins")
      .select("role")
      .eq("email", req.user.email)
      .single();

    if (error || !data) {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.admin = data;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Admin verification failed", details: error.message });
  }
}

function signAdminSessionPayload(payloadBase64Url) {
  return crypto
    .createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(payloadBase64Url)
    .digest("base64url");
}

function signaturesMatch(actual, expected) {
  const a = Buffer.from(actual || "", "utf8");
  const b = Buffer.from(expected || "", "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function createAdminSession(username) {
  const expiresAt = Date.now() + ADMIN_SESSION_MS;
  const payload = Buffer.from(JSON.stringify({ username, expiresAt })).toString("base64url");
  const signature = signAdminSessionPayload(payload);
  const token = `${payload}.${signature}`;
  return { token, expiresAt };
}

function getAdminToken(req) {
  const raw = req.headers["x-admin-token"];
  if (!raw || typeof raw !== "string") return null;
  return raw.trim();
}

function resolveAdminSession(token) {
  try {
    const [payload, signature] = (token || "").split(".");
    if (!payload || !signature) return null;

    const expected = signAdminSessionPayload(payload);
    if (!signaturesMatch(signature, expected)) return null;

    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed?.username || !parsed?.expiresAt) return null;
    if (Number(parsed.expiresAt) <= Date.now()) return null;

    return { username: parsed.username, expiresAt: Number(parsed.expiresAt) };
  } catch {
    return null;
  }
}

async function requireAdminAccess(req, res, next) {
  try {
    const adminToken = getAdminToken(req);
    if (adminToken) {
      const adminSession = resolveAdminSession(adminToken);
      if (!adminSession) {
        return res.status(401).json({ error: "Admin session expired. Please login again." });
      }

      req.adminSession = adminSession;
      return next();
    }

    return requireAuth(req, res, () => requireAdmin(req, res, next));
  } catch (error) {
    return res.status(500).json({ error: "Admin access check failed", details: error.message });
  }
}

async function getSubscriptionForUser(userId) {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && isMissingTableError(error)) {
    return {
      user_id: userId,
      plan: "free",
      billing_cycle: "monthly",
      status: "active",
      start_date: new Date().toISOString(),
      end_date: dayjs().add(7, "day").toISOString(),
      approved_by_admin: false,
    };
  }

  if (error) throw error;

  if (data) return data;

  const trialEnd = dayjs().add(7, "day").toISOString();
  const { data: created, error: createError } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      user_id: userId,
      plan: "free",
      billing_cycle: "monthly",
      status: "active",
      start_date: new Date().toISOString(),
      end_date: trialEnd,
      approved_by_admin: false,
    })
    .select("*")
    .single();

  if (createError) throw createError;
  return created;
}

function computeStreaks(logRows = []) {
  const completedDates = logRows
    .filter((x) => x.status === "completed")
    .map((x) => x.date)
    .sort();

  if (!completedDates.length) {
    return { currentStreak: 0, longestStreak: 0, completionRate: 0 };
  }

  let longest = 1;
  let current = 1;

  for (let i = 1; i < completedDates.length; i += 1) {
    const prev = dayjs(completedDates[i - 1]);
    const next = dayjs(completedDates[i]);
    const diff = next.diff(prev, "day");

    if (diff === 1) {
      current += 1;
    } else if (diff > 1) {
      current = 1;
    }

    longest = Math.max(longest, current);
  }

  const today = dayjs().startOf("day");
  let streakTail = 0;

  for (let i = completedDates.length - 1; i >= 0; i -= 1) {
    const target = dayjs(completedDates[i]).startOf("day");
    const expected = today.subtract(streakTail, "day");
    if (target.isSame(expected, "day")) {
      streakTail += 1;
    } else if (target.isBefore(expected, "day")) {
      break;
    }
  }

  return {
    currentStreak: streakTail,
    longestStreak: longest,
    completionRate: Math.round((completedDates.length / logRows.length) * 100),
  };
}

app.get("/api/health", (_, res) => {
  res.json({ ok: true, service: "habit-tracker-backend" });
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required." });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser?.id) {
      return res.status(409).json({ error: "This account already exists. Please login instead." });
    }

    const emailRedirectTo = `${PRIMARY_FRONTEND_URL}/login`;
    const { data, error } = await supabasePublic.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    if (error) {
      const rawMessage = String(error.message || "").toLowerCase();
      if (rawMessage.includes("already registered") || rawMessage.includes("already exists") || rawMessage.includes("duplicate")) {
        return res.status(409).json({ error: "This account already exists. Please login instead." });
      }
      return res.status(400).json({ error: "Unable to create account. Please check your details and try again." });
    }
    if (data?.user) {
      try {
        await upsertUserRow(data.user);
      } catch (syncError) {
        console.warn("Failed to sync user row after signup:", syncError.message);
      }
    }
    return res.json({ user: data.user, session: data.session });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password });
    if (error) {
      const rawMessage = String(error.message || "").toLowerCase();
      if (rawMessage.includes("invalid login credentials") || rawMessage.includes("invalid") || rawMessage.includes("password")) {
        return res.status(401).json({ error: "Email or password is incorrect." });
      }
      return res.status(400).json({ error: "Unable to login right now. Please try again." });
    }
    if (data?.user) {
      try {
        await upsertUserRow(data.user);
      } catch (syncError) {
        console.warn("Failed to sync user row after login:", syncError.message);
      }
    }
    return res.json({ user: data.user, session: data.session });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/logout", requireAuth, async (req, res) => {
  try {
    const { error } = await supabasePublic.auth.signOut();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/habits", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("habits")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error && isMissingTableError(error)) return res.json({ habits: [] });
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ habits: data });
});

app.post("/api/habits", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const title = (req.body?.title || "").trim();
    const description = (req.body?.description || "").trim();

    if (!title) {
      return res.status(400).json({ error: "Habit title is required." });
    }

    const sub = await getSubscriptionForUser(req.user.id);
    const { count, error: countError } = await supabaseAdmin
      .from("habits")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", req.user.id);

    if (countError && isMissingTableError(countError)) {
      return res.status(503).json({ error: "Habits table is not ready yet." });
    }
    if (countError) {
      return res.status(400).json({ error: countError.message });
    }

    const isPremium = sub.plan === "premium" && sub.status === "active";
    if (!isPremium && (count || 0) >= 3) {
      return res.status(403).json({ error: "Free plan allows maximum 3 habits. Please subscribe a plan to continue." });
    }

    let imageUrl = "";
    if (req.file) {
      imageUrl = await uploadHabitImage(req.file, req.user.id);
    }

    const payload = {
      user_id: req.user.id,
      title,
      description,
      frequency: req.body.frequency || "daily",
      image_url: imageUrl,
    };

    let { data, error } = await supabaseAdmin.from("habits").insert(payload).select("*").single();

    if (error && isRlsError(error) && req.token) {
      const userClient = createUserClient(req.token);
      ({ data, error } = await userClient.from("habits").insert(payload).select("*").single());
    }

    if (error && isMissingTableError(error)) {
      return res.status(503).json({ error: "Habits table is not ready yet." });
    }
    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({ habit: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/habits/description-assist", requireAuth, async (req, res) => {
  try {
    const title = (req.body?.title || "").trim();
    const description = (req.body?.description || "").trim();
    const mode = req.body?.mode === "rephrase" ? "rephrase" : "generate";

    if (mode === "rephrase" && !description) {
      return res.status(400).json({ error: "Description is required for rephrase." });
    }

    if (mode === "generate" && !title) {
      return res.status(400).json({ error: "Habit title is required for AI generation." });
    }

    const fallbackDescription = mode === "rephrase"
      ? description
      : `Build consistency in ${title} by starting with a small, repeatable daily step and tracking your progress.`;

    const prompt = mode === "rephrase"
      ? [
          "You improve habit descriptions for clarity and motivation.",
          `Habit title: ${title || "General habit"}`,
          `Original description: ${description}`,
          "Return JSON with one key only: description.",
          "Keep it concise, practical, and encouraging (1-2 lines).",
        ].join("\n")
      : [
          "You write concise and motivating habit descriptions.",
          `Habit title: ${title}`,
          "Return JSON with one key only: description.",
          "Write 1-2 lines, practical and easy to follow.",
        ].join("\n");

    const parsed = await generateGeminiJson(prompt, { description: fallbackDescription });
    const finalDescription = (parsed?.description || fallbackDescription).toString().trim();

    return res.json({ description: finalDescription || fallbackDescription });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.put("/api/habits/:id", requireAuth, upload.single("image"), async (req, res) => {
  const { id } = req.params;

  let imageUrl;
  if (req.file) {
    try {
      imageUrl = await uploadHabitImage(req.file, req.user.id);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  const updates = {
    title: req.body.title,
    description: req.body.description,
    frequency: req.body.frequency,
  };

  if (typeof imageUrl === "string" && imageUrl) {
    updates.image_url = imageUrl;
  }

  const { data, error } = await supabaseAdmin
    .from("habits")
    .update(updates)
    .eq("id", id)
    .eq("user_id", req.user.id)
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ habit: data });
});

app.delete("/api/habits/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin.from("habits").delete().eq("id", id).eq("user_id", req.user.id);
  if (error) return res.status(400).json({ error: error.message });

  return res.json({ success: true });
});

app.post("/api/habit-logs", requireAuth, async (req, res) => {
  const { habit_id, date, status } = req.body;

  const { data: ownedHabit } = await supabaseAdmin
    .from("habits")
    .select("id")
    .eq("id", habit_id)
    .eq("user_id", req.user.id)
    .single();

  if (!ownedHabit) {
    return res.status(403).json({ error: "Invalid habit." });
  }

  const { data, error } = await supabaseAdmin
    .from("habit_logs")
    .upsert({ habit_id, date, status }, { onConflict: "habit_id,date" })
    .select("*")
    .single();

  if (error && isMissingTableError(error)) {
    return res.status(503).json({ error: "Habit logs table is not ready yet." });
  }
  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json({ log: data });
});

app.get("/api/habit-logs", requireAuth, async (req, res) => {
  const { data: habits } = await supabaseAdmin
    .from("habits")
    .select("id")
    .eq("user_id", req.user.id);

  if (!habits) return res.json({ logs: [] });

  const habitIds = (habits || []).map((h) => h.id);
  if (!habitIds.length) return res.json({ logs: [] });

  const { data, error } = await supabaseAdmin
    .from("habit_logs")
    .select("*")
    .in("habit_id", habitIds)
    .order("date", { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ logs: data });
});

app.get("/api/analytics", requireAuth, async (req, res) => {
  const { data: habits } = await supabaseAdmin
    .from("habits")
    .select("id,title")
    .eq("user_id", req.user.id);

  if (!habits) {
    return res.json({
      overview: { currentStreak: 0, longestStreak: 0, completionRate: 0 },
      weekly: [],
      monthly: [],
    });
  }

  const habitIds = (habits || []).map((h) => h.id);
  if (!habitIds.length) {
    return res.json({
      overview: { currentStreak: 0, longestStreak: 0, completionRate: 0 },
      weekly: [],
      monthly: [],
    });
  }

  const { data: logs, error } = await supabaseAdmin
    .from("habit_logs")
    .select("*")
    .in("habit_id", habitIds)
    .order("date", { ascending: true });

  if (error) return res.status(400).json({ error: error.message });

  const overview = computeStreaks(logs || []);

  const dailyMap = {};
  const weeklyMap = {};
  const monthlyMap = {};
  for (const row of logs || []) {
    const dayKey = dayjs(row.date).format("YYYY-MM-DD");
    const weekKey = dayjs(row.date).startOf("week").format("YYYY-MM-DD");
    const monthKey = dayjs(row.date).startOf("month").format("YYYY-MM");

    if (!dailyMap[dayKey]) dailyMap[dayKey] = { period: dayKey, completed: 0, missed: 0, total: 0 };
    if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { period: weekKey, completed: 0, missed: 0, total: 0 };
    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { period: monthKey, completed: 0, missed: 0, total: 0 };

    dailyMap[dayKey].total += 1;
    weeklyMap[weekKey].total += 1;
    monthlyMap[monthKey].total += 1;
    if (row.status === "completed") {
      dailyMap[dayKey].completed += 1;
      weeklyMap[weekKey].completed += 1;
      monthlyMap[monthKey].completed += 1;
    } else {
      dailyMap[dayKey].missed += 1;
      weeklyMap[weekKey].missed += 1;
      monthlyMap[monthKey].missed += 1;
    }
  }

  return res.json({
    overview,
    daily: Object.values(dailyMap),
    weekly: Object.values(weeklyMap),
    monthly: Object.values(monthlyMap),
  });
});

app.post("/api/motivation", requireAuth, async (req, res) => {
  try {
    const { emotion = "neutral", missedHabit = false } = req.body;

    const prompt = [
      "You are a motivational coach for a daily habits app.",
      `User emotion: ${emotion}`,
      `Missed habit today: ${missedHabit}`,
      "Return JSON with keys: quote, habit_suggestion, insight.",
    ].join("\n");

    const fallback = {
      quote: missedHabit
        ? "Missing one task does not break momentum. Restart with the next action."
        : "Consistency compounds faster than motivation fades.",
      habit_suggestion: missedHabit
        ? "Pick the smallest version of the habit and complete it now."
        : "Keep your current habit stable and add one repeatable cue.",
      insight: emotion === "sad" || emotion === "lazy"
        ? "Lower the difficulty, shorten the session, and protect the streak."
        : "Small wins create durable routines when repeated daily.",
    };

    const parsed = await generateGeminiJson(prompt, fallback);

    const { error: aiError } = await supabaseAdmin.from("ai_insights").insert({
      user_id: req.user.id,
      emotion,
      prompt,
      response_json: parsed,
    });

    if (aiError && !isMissingTableError(aiError)) {
      return res.status(400).json({ error: aiError.message });
    }

    return res.json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/subscription/status", requireAuth, async (req, res) => {
  try {
    const sub = await getSubscriptionForUser(req.user.id);
    return res.json({ subscription: sub });
  } catch (error) {
    if (isMissingTableError(error)) {
      return res.json({
        subscription: {
          user_id: req.user.id,
          plan: "free",
          status: "active",
          start_date: new Date().toISOString(),
          end_date: dayjs().add(7, "day").toISOString(),
          approved_by_admin: false,
        },
      });
    }
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/subscription/stripe", requireAuth, async (req, res) => {
  if (!stripe) return res.status(400).json({ error: "Stripe not configured" });

  try {
    const billingCycle = req.body?.billing_cycle === "yearly" ? "yearly" : "monthly";
    const amount = billingCycle === "yearly" ? 7000 : 700;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: { name: `Habit Tracker Premium (${billingCycle})` },
          },
          quantity: 1,
        },
      ],
      success_url: `${PRIMARY_FRONTEND_URL}/dashboard?payment=success`,
      cancel_url: `${PRIMARY_FRONTEND_URL}/dashboard?payment=cancelled`,
      metadata: { user_id: req.user.id, billing_cycle: billingCycle },
    });

    return res.json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/subscription/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe) return res.status(400).json({ error: "Stripe not configured" });

  let event;
  try {
    if (STRIPE_WEBHOOK_SECRET) {
      const sig = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(req.body.toString("utf8"));
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session?.metadata?.user_id;
      if (userId) {
        await supabaseAdmin.from("subscriptions").insert({
          user_id: userId,
          plan: "premium",
          status: "active",
          start_date: new Date().toISOString(),
          end_date: dayjs().add(30, "day").toISOString(),
          approved_by_admin: true,
        });
      }
    }

    return res.json({ received: true });
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

app.post("/api/subscription/manual", requireAuth, upload.single("screenshot"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Screenshot is required." });
    const billingCycle = req.body?.billing_cycle === "yearly" ? "yearly" : "monthly";
    const paymentPhone = req.body?.payment_phone || "";

    const filename = `${req.user.id}/${Date.now()}-${req.file.originalname}`;
    await ensurePaymentBucket();
    let { error: uploadError } = await supabaseAdmin.storage
      .from(PAYMENT_BUCKET)
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError && isMissingBucketError(uploadError)) {
      await ensurePaymentBucket();
      ({ error: uploadError } = await supabaseAdmin.storage
        .from(PAYMENT_BUCKET)
        .upload(filename, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        }));
    }

    if (uploadError) return res.status(400).json({ error: uploadError.message });

    const { data: publicUrlData } = supabaseAdmin.storage.from(PAYMENT_BUCKET).getPublicUrl(filename);

    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        user_id: req.user.id,
        plan: "premium",
        billing_cycle: billingCycle,
        status: "pending",
        payment_phone: paymentPhone,
        screenshot_url: publicUrlData.publicUrl,
        start_date: new Date().toISOString(),
        end_date: dayjs().add(30, "day").toISOString(),
        approved_by_admin: false,
      })
      .select("*")
      .single();

    if (error && isMissingTableError(error)) {
      return res.status(503).json({ error: "Subscriptions table is not ready yet." });
    }
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ subscription: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/login", async (req, res) => {
  try {
    const username = (req.body?.username || "").trim();
    const password = req.body?.password || "";

    if (!username || !password) {
      return res.status(400).json({ error: "username and password are required" });
    }

    if (username !== ADMIN_USERNAME || password !== adminPasswordValue) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const { token, expiresAt } = createAdminSession(username);
    return res.json({ token, expiresAt, username });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/change-password", requireAdminAccess, async (req, res) => {
  try {
    const currentPassword = req.body?.current_password || "";
    const newPassword = req.body?.new_password || "";

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "current_password and new_password are required" });
    }

    if (currentPassword !== adminPasswordValue) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    adminPasswordValue = newPassword;
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/approve-payment", requireAdminAccess, async (req, res) => {
  const { subscription_id, action } = req.body;
  const rejectionReason = (req.body?.reason || "").trim();

  if (!subscription_id || !action) {
    return res.status(400).json({ error: "subscription_id and action are required" });
  }

  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ error: "action must be approve or reject" });
  }

  if (action === "reject" && !rejectionReason) {
    return res.status(400).json({ error: "Rejection reason is required" });
  }

  const { data: currentSubscription, error: currentError } = await supabaseAdmin
    .from("subscriptions")
    .select("id,status,plan,billing_cycle,user_id")
    .eq("id", subscription_id)
    .single();

  if (currentError) return res.status(400).json({ error: currentError.message });

  if (currentSubscription.status !== "pending") {
    return res.status(400).json({ error: "This request is already processed." });
  }

  const payload = {
    status: action === "approve" ? "active" : "expired",
    approved_by_admin: action === "approve",
  };

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update(payload)
    .eq("id", subscription_id)
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });

  const selectedPlan = `${(data.plan || "premium").toUpperCase()} ${(data.billing_cycle || "monthly").toUpperCase()}`.trim();
  const notificationMessage = action === "approve"
    ? `Subscription approved: Your ${selectedPlan} plan is now active. You can continue using premium features immediately.`
    : `Subscription rejected: Your ${selectedPlan} request could not be approved. Reason: ${rejectionReason}. Please update the payment proof and try again.`;

  await supabaseAdmin.from("notifications").insert({
    user_id: data.user_id,
    message: notificationMessage,
    read: false,
  });

  return res.json({ subscription: data });
});

app.get("/api/admin/users", requireAdminAccess, async (_, res) => {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id,user_id,plan,billing_cycle,status,start_date,end_date,screenshot_url,approved_by_admin")
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  const subscriptions = data || [];
  const userIds = [...new Set(subscriptions.map((item) => item.user_id).filter(Boolean))];

  let emailMap = {};
  if (userIds.length) {
    const { data: userRows, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id,email")
      .in("id", userIds);

    if (usersError && !isMissingTableError(usersError)) {
      return res.status(400).json({ error: usersError.message });
    }

    emailMap = (userRows || []).reduce((acc, row) => {
      if (row?.id && row?.email) acc[row.id] = row.email;
      return acc;
    }, {});
  }

  const merged = subscriptions.map((item) => ({
    ...item,
    user_email: emailMap[item.user_id] || null,
  }));

  return res.json({ subscriptions: merged });
});

app.post("/api/admin/notify-user", requireAdminAccess, async (req, res) => {
  const userEmail = (req.body?.user_email || "").trim().toLowerCase();
  const { message } = req.body;

  if (!userEmail || !message) {
    return res.status(400).json({ error: "user_email and message are required" });
  }

  let userRow;
  try {
    userRow = await findUserByEmail(userEmail);
  } catch (lookupError) {
    return res.status(400).json({ error: lookupError.message });
  }

  if (!userRow?.id) {
    return res.status(404).json({ error: "No user found with this email" });
  }

  const notificationMessage = `Admin notice: ${String(message || "").trim()}`;

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .insert({ user_id: userRow.id, message: notificationMessage, read: false })
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json({ notification: data });
});

app.get("/api/notifications", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  const unreadIds = (data || []).filter((item) => !item.read).map((item) => item.id);
  if (unreadIds.length) {
    const { error: updateError } = await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);

    if (updateError) return res.status(400).json({ error: updateError.message });
  }

  const readIds = new Set(unreadIds);
  const notifications = (data || []).map((item) => ({
    ...item,
    read: readIds.has(item.id) ? true : item.read,
  }));

  return res.json({ notifications });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
