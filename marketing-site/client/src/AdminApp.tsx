import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { LogOut, RefreshCw, ShieldCheck } from 'lucide-react';

const API = (import.meta as any).env?.VITE_API_BASE_URL || '';
type Lead = { _id: string; name: string; phone: string; service: string; message?: string; locale: string; source: string; status: string; createdAt: string };

export default function AdminApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    const response = await fetch(API + path, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Request failed');
    return body;
  }, []);
  const loadLeads = useCallback(async () => {
    setBusy(true); setMessage('');
    try {
      const body = await request('/api/admin/leads' + (filter !== 'all' ? '?status=' + encodeURIComponent(filter) : ''));
      setLeads(body.leads || []); setAuthenticated(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load enquiries');
      if (error instanceof Error && /sign in|unauthorized/i.test(error.message)) setAuthenticated(false);
    } finally { setBusy(false); }
  }, [filter, request]);
  useEffect(() => {
    request('/api/admin/session').then(() => setAuthenticated(true)).catch(() => setAuthenticated(false));
  }, [request]);
  useEffect(() => { if (authenticated) void loadLeads(); }, [authenticated, loadLeads]);
  async function signIn(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      await request('/api/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setPassword(''); setAuthenticated(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Sign in failed'); }
    finally { setBusy(false); }
  }
  async function changeStatus(id: string, status: string) {
    try { await request('/api/admin/leads/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify({ status }) }); await loadLeads(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not update enquiry'); }
  }
  async function signOut() {
    try { await request('/api/admin/logout', { method: 'POST', body: '{}' }); } catch { /* clear local view even if network fails */ }
    setAuthenticated(false); setLeads([]); setEmail(''); setPassword('');
  }
  if (!authenticated) return <main className="admin-shell"><section className="admin-login"><div className="admin-mark"><ShieldCheck size={25} /></div><p className="admin-kicker">DAR AL SHAMS</p><h1>Admin sign in</h1><p className="admin-muted">Private access for authorised team members only.</p><form onSubmit={signIn}><label>Email address<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label><button className="admin-primary" disabled={busy}>{busy ? 'Please wait…' : 'Sign in securely'}</button>{message && <p role="alert" className="admin-message">{message}</p>}</form><a className="admin-back" href="/">← Back to public website</a></section></main>;
  return <main className="admin-shell"><section className="admin-dashboard"><header className="admin-head"><div><p className="admin-kicker">DAR AL SHAMS · PRIVATE</p><h1>Enquiry dashboard</h1><p className="admin-muted">Contact details are confidential. Use them only to respond to enquiries.</p></div><div className="admin-actions"><button className="admin-secondary" onClick={() => void loadLeads()} disabled={busy}><RefreshCw size={16} /> Refresh</button><button className="admin-secondary" onClick={() => void signOut()}><LogOut size={16} /> Sign out</button></div></header>{message && <p role="status" className="admin-message">{message}</p>}<div className="admin-toolbar"><strong>{leads.length} enquiries</strong><label>Filter by status<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All statuses</option><option value="new">New</option><option value="contacted">Contacted</option><option value="in_progress">In progress</option><option value="closed">Closed</option></select></label></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Received</th><th>Contact</th><th>Service</th><th>Enquiry</th><th>Status</th></tr></thead><tbody>{leads.map(lead => <tr key={lead._id}><td>{new Date(lead.createdAt).toLocaleString()}</td><td><strong>{lead.name}</strong><a href={'tel:' + lead.phone}>{lead.phone}</a><small>{lead.locale.toUpperCase()} · {lead.source}</small></td><td>{lead.service}</td><td>{lead.message || '—'}</td><td><select aria-label={'Status for ' + lead.name} value={lead.status} onChange={e => void changeStatus(lead._id, e.target.value)}><option value="new">New</option><option value="contacted">Contacted</option><option value="in_progress">In progress</option><option value="closed">Closed</option></select></td></tr>)}{!leads.length && <tr><td colSpan={5} className="admin-empty">{busy ? 'Loading enquiries…' : 'No enquiries found for this filter.'}</td></tr>}</tbody></table></div><p className="admin-footnote">Only authorised administrators should access this screen. Do not export or share customer details outside approved company processes.</p></section></main>;
}
