import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { MongoClient, ObjectId } from 'mongodb';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const app = express();
const port = Number(process.env.PORT || 4000);
const SESSION_COOKIE = 'ds_admin_session';
const SESSION_TTL_SECONDS = 8 * 60 * 60;
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(v => v.trim()).filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '20kb' }));
app.use('/api/public/leads', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api/admin/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false }));

const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(32).regex(/^[+0-9() .-]+$/),
  service: z.enum(['documents', 'visa', 'identity', 'renewals']),
  message: z.string().trim().max(1500).optional().default(''),
  locale: z.enum(['en', 'ar']).default('en'),
  source: z.literal('website').default('website')
});
const loginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(256) });
const statusSchema = z.object({ status: z.enum(['new', 'contacted', 'in_progress', 'closed']) });

let client: MongoClient | undefined;
let database: ReturnType<MongoClient['db']> | undefined;

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
function sessionSecret(): string | undefined {
  const secret = process.env.SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : undefined;
}
function signExpiry(expiry: string): string {
  return createHmac('sha256', sessionSecret() || '').update(expiry).digest('base64url');
}
function sessionToken(): string {
  const expiry = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  return expiry + '.' + signExpiry(expiry);
}
function validSession(req: Request): boolean {
  const raw = req.headers.cookie || '';
  const item = raw.split(';').map(v => v.trim()).find(v => v.startsWith(SESSION_COOKIE + '='));
  if (!item || !sessionSecret()) return false;
  const token = decodeURIComponent(item.slice(SESSION_COOKIE.length + 1));
  const parts = token.split('.');
  if (parts.length !== 2 || !/^\d+$/.test(parts[0]) || Number(parts[0]) <= Math.floor(Date.now() / 1000)) return false;
  return safeEqual(parts[1], signExpiry(parts[0]));
}
function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && sessionSecret());
}
function cookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/api/admin', maxAge: SESSION_TTL_SECONDS * 1000 };
}
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!adminConfigured()) return res.status(503).json({ error: 'Admin access is not configured on the server.' });
  if (!validSession(req)) return res.status(401).json({ error: 'Please sign in to continue.' });
  next();
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'dar-al-shams-marketing-api' }));

app.post('/api/public/leads', async (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Please check the enquiry details and try again.' });
  if (!database) return res.status(503).json({ error: 'Enquiry service is not configured yet.' });
  try {
    const now = new Date();
    const doc = { ...parsed.data, status: 'new', createdAt: now, updatedAt: now, consentPurpose: 'respond-to-enquiry' };
    const result = await database.collection('leads').insertOne(doc);
    return res.status(201).json({ id: result.insertedId.toString(), status: 'received' });
  } catch (error) {
    console.error('Lead persistence failed:', error instanceof Error ? error.message : 'unknown error');
    return res.status(500).json({ error: 'Unable to save enquiry right now.' });
  }
});

app.post('/api/admin/login', (req, res) => {
  if (!adminConfigured()) return res.status(503).json({ error: 'Admin access is not configured on the server.' });
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email and password.' });
  const emailMatches = safeEqual(parsed.data.email.toLowerCase(), (process.env.ADMIN_EMAIL || '').trim().toLowerCase());
  const passwordMatches = safeEqual(parsed.data.password, process.env.ADMIN_PASSWORD || '');
  if (!emailMatches || !passwordMatches) return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.cookie(SESSION_COOKIE, sessionToken(), cookieOptions());
  return res.json({ status: 'authenticated' });
});
app.get('/api/admin/session', requireAdmin, (_req, res) => res.json({ status: 'authenticated' }));
app.post('/api/admin/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/admin' });
  return res.json({ status: 'signed_out' });
});
app.get('/api/admin/leads', requireAdmin, async (req, res) => {
  if (!database) return res.status(503).json({ error: 'Lead database is not configured yet.' });
  const status = typeof req.query.status === 'string' ? req.query.status : 'all';
  if (status !== 'all' && !statusSchema.shape.status.safeParse(status).success) return res.status(400).json({ error: 'Invalid status filter.' });
  try {
    const filter = status === 'all' ? {} : { status };
    const rows = await database.collection('leads').find(filter).sort({ createdAt: -1 }).limit(100).toArray();
    return res.json({ leads: rows.map(row => ({ ...row, _id: row._id.toString() })) });
  } catch (error) {
    console.error('Admin lead listing failed:', error instanceof Error ? error.message : 'unknown error');
    return res.status(500).json({ error: 'Unable to load enquiries right now.' });
  }
});
app.patch('/api/admin/leads/:id', requireAdmin, async (req, res) => {
  if (!database) return res.status(503).json({ error: 'Lead database is not configured yet.' });
  const leadId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!ObjectId.isValid(leadId)) return res.status(400).json({ error: 'Invalid enquiry ID.' });
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid enquiry status.' });
  try {
    const result = await database.collection('leads').updateOne(
      { _id: new ObjectId(leadId) },
      { $set: { status: parsed.data.status, updatedAt: new Date() } }
    );
    if (!result.matchedCount) return res.status(404).json({ error: 'Enquiry not found.' });
    return res.json({ status: 'updated' });
  } catch (error) {
    console.error('Admin lead update failed:', error instanceof Error ? error.message : 'unknown error');
    return res.status(500).json({ error: 'Unable to update enquiry right now.' });
  }
});

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

async function start() {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    client = new MongoClient(uri);
    await client.connect();
    database = client.db(process.env.MONGODB_DB || 'dar_al_shams_marketing');
    await database.collection('leads').createIndex({ createdAt: -1 });
    await database.collection('leads').createIndex({ status: 1, createdAt: -1 });
  } else {
    console.warn('MONGODB_URI missing: public enquiry submissions and admin lead listing will return 503 until configured.');
  }
  if (!adminConfigured()) console.warn('Admin dashboard locked: configure ADMIN_EMAIL, ADMIN_PASSWORD and SESSION_SECRET (32+ characters).');
  app.listen(port, () => console.log('Marketing API listening on port ' + port));
}
start().catch(error => {
  console.error('API startup failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
process.on('SIGTERM', async () => { await client?.close(); process.exit(0); });
