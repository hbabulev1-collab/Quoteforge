'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Lang = 'bg' | 'en';

const i18n = {
  bg: {
    newQuote: 'Нова оферта', history: 'История', clients: 'Клиенти', logout: 'Изход',
    material: 'Материал', weight: 'Тегло на детайла', matPrice: 'Цена материал',
    machTime: 'Машинно време', rate: 'Часова ставка', margin: 'Надценка / марж',
    partName: 'Наименование на детайла', qty: 'Брой', addPart: '+ Добави детайл',
    removePart: 'Премахни',
    company: 'Име на работилницата', client: 'Клиент', newClient: '+ Нов клиент',
    leadTime: 'Срок на доставка', contact: 'Контакт за връзка',
    quoteTitle: 'ОФЕРТА', totalPrice: 'Обща цена', save: 'Запази в история',
    saved: 'Запазено ✓', copyText: 'Копирай като текст', copyDone: 'Копирано ✓',
    downloadTxt: 'Изтегли PDF',
    noHistory: 'Все още няма запазени оферти.', noClients: 'Все още няма запазени клиенти.',
    delete: 'Изтрий', load: 'Отвори', parts: 'детайли', total: 'Сума',
    clientName: 'Име на клиента', clientContact: 'Контакт', clientCountry: 'Държава',
    saveClient: 'Запази клиент', selectClient: 'Избери клиент',
    loading: 'Зареждане...',
  },
  en: {
    newQuote: 'New Quote', history: 'History', clients: 'Clients', logout: 'Log out',
    material: 'Material', weight: 'Part weight', matPrice: 'Material price',
    machTime: 'Machining time', rate: 'Hourly rate', margin: 'Markup / margin',
    partName: 'Part name', qty: 'Quantity', addPart: '+ Add part',
    removePart: 'Remove',
    company: 'Workshop name', client: 'Client', newClient: '+ New client',
    leadTime: 'Lead time', contact: 'Contact',
    quoteTitle: 'QUOTATION', totalPrice: 'Total Price', save: 'Save to history',
    saved: 'Saved ✓', copyText: 'Copy as text', copyDone: 'Copied ✓',
    downloadTxt: 'Download PDF',
    noHistory: 'No saved quotes yet.', noClients: 'No saved clients yet.',
    delete: 'Delete', load: 'Open', parts: 'parts', total: 'Total',
    clientName: 'Client name', clientContact: 'Contact', clientCountry: 'Country',
    saveClient: 'Save client', selectClient: 'Select client',
    loading: 'Loading...',
  },
};

const MATERIALS = [
  { id: 'steel', price: 0.90, nameBg: 'Стомана S235', nameEn: 'S235 Steel' },
  { id: 'stainless', price: 2.60, nameBg: 'Неръждаема стомана', nameEn: 'Stainless Steel' },
  { id: 'aluminium', price: 2.40, nameBg: 'Алуминий', nameEn: 'Aluminium' },
  { id: 'brass', price: 7.80, nameBg: 'Месинг', nameEn: 'Brass' },
];

interface Part {
  id: string;
  materialId: string;
  weight: string;
  matPrice: string;
  machTime: string;
  rate: string;
  margin: number;
  partName: string;
  qty: string;
}

interface Client {
  id: string;
  name: string;
  contact: string | null;
  country: string | null;
}

interface Quote {
  id: string;
  client_id: string | null;
  client_name_snapshot: string | null;
  lead_time: string | null;
  contact: string | null;
  parts: Part[];
  grand_total: number;
  created_at: string;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function emptyPart(): Part {
  return {
    id: uid(), materialId: 'steel', weight: '', matPrice: '0.90',
    machTime: '', rate: '35', margin: 25, partName: '', qty: '1',
  };
}

export default function DashboardClient({ userEmail }: { userEmail: string }) {
  const [lang, setLang] = useState<Lang>('bg');
  const [view, setView] = useState<'new' | 'history' | 'clients'>('new');
  const [parts, setParts] = useState<Part[]>([emptyPart()]);
  const [company, setCompany] = useState('');
  const [clientId, setClientId] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [contact, setContact] = useState('');
  const [history, setHistory] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'done'>('idle');
  const [newClientForm, setNewClientForm] = useState({ name: '', contact: '', country: '' });
  const [showNewClient, setShowNewClient] = useState(false);

  const router = useRouter();
  const t = i18n[lang];

  const loadAll = useCallback(async () => {
    try {
      const [profileRes, clientsRes, quotesRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/clients'),
        fetch('/api/quotes'),
      ]);

      if (profileRes.ok) {
        const { profile } = await profileRes.json();
        setCompany(profile?.company_name || '');
      }
      if (clientsRes.ok) {
        const { clients } = await clientsRes.json();
        setClients(clients || []);
      }
      if (quotesRes.ok) {
        const { quotes } = await quotesRes.json();
        setHistory(quotes || []);
      }
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Persist company name on change (debounced)
  useEffect(() => {
    if (loading) return;
    const timeout = setTimeout(() => {
      fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: company }),
      }).catch(() => {});
    }, 700);
    return () => clearTimeout(timeout);
  }, [company, loading]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function updatePart(id: string, field: keyof Part, value: string | number) {
    setParts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value } as Part;
      if (field === 'materialId') {
        const mat = MATERIALS.find(m => m.id === value);
        if (mat) updated.matPrice = String(mat.price);
      }
      return updated;
    }));
  }

  function addPart() {
    setParts(prev => [...prev, emptyPart()]);
  }

  function removePart(id: string) {
    setParts(prev => prev.length > 1 ? prev.filter(p => p.id !== id) : prev);
  }

  function calcPartCost(p: Part) {
    const weight = parseFloat(p.weight) || 0;
    const matPrice = parseFloat(p.matPrice) || 0;
    const machTime = parseFloat(p.machTime) || 0;
    const rate = parseFloat(p.rate) || 0;
    const margin = Number(p.margin) || 0;
    const qty = parseInt(p.qty) || 1;
    const matCost = weight * matPrice;
    const machCost = machTime * rate;
    const subtotal = (matCost + machCost) * qty;
    const total = subtotal * (1 + margin / 100);
    return { matCost: matCost * qty, machCost: machCost * qty, total };
  }

  const partTotals = parts.map(calcPartCost);
  const grandTotal = partTotals.reduce((sum, pt) => sum + pt.total, 0);

  function fmt(n: number) {
    return '€' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getMaterialName(materialId: string) {
    const mat = MATERIALS.find(m => m.id === materialId);
    if (!mat) return '—';
    return lang === 'bg' ? mat.nameBg : mat.nameEn;
  }

  const selectedClient = clients.find(c => c.id === clientId);

  async function saveQuote() {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId || null,
          client_name_snapshot: selectedClient?.name || null,
          lead_time: leadTime,
          contact,
          parts: parts.map((p, i) => ({ ...p, total: partTotals[i].total, materialName: getMaterialName(p.materialId) })),
          grand_total: grandTotal,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      const { quote } = await res.json();
      setHistory(prev => [quote, ...prev]);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1800);
    } catch (e) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 1800);
    }
  }

  async function deleteQuote(id: string) {
    setHistory(prev => prev.filter(q => q.id !== id));
    try {
      await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
    } catch (e) { /* ignore, already removed from UI */ }
  }

  function loadQuote(quote: Quote) {
    setClientId(quote.client_id || '');
    setLeadTime(quote.lead_time || '');
    setContact(quote.contact || '');
    setParts(quote.parts.map(p => ({ ...p, id: uid() })));
    setView('new');
  }

  async function saveNewClient() {
    if (!newClientForm.name.trim()) return;
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClientForm),
      });
      if (!res.ok) throw new Error('Failed');
      const { client } = await res.json();
      setClients(prev => [client, ...prev]);
      setClientId(client.id);
      setShowNewClient(false);
      setNewClientForm({ name: '', contact: '', country: '' });
    } catch (e) {
      console.error('Failed to save client', e);
    }
  }

  async function deleteClient(id: string) {
    setClients(prev => prev.filter(c => c.id !== id));
    if (clientId === id) setClientId('');
    try {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    } catch (e) { /* ignore */ }
  }

  function buildQuoteText() {
    const lines = [
      t.quoteTitle, '',
      (lang === 'bg' ? 'От' : 'From') + ': ' + (company || (lang === 'bg' ? 'Вашата работилница' : 'Your Workshop')),
      (lang === 'bg' ? 'Дата' : 'Date') + ': ' + new Date().toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB'),
    ];
    if (selectedClient) lines.push((lang === 'bg' ? 'Клиент' : 'Client') + ': ' + selectedClient.name);
    lines.push('');
    parts.forEach((p, i) => {
      lines.push(`${t.partName} ${i + 1}: ${p.partName || '-'}`);
      lines.push(`  ${t.material}: ${getMaterialName(p.materialId)}`);
      lines.push(`  ${t.qty}: ${p.qty || '1'}`);
      lines.push(`  ${t.total}: ${fmt(partTotals[i].total)}`);
      lines.push('');
    });
    lines.push(`${t.leadTime}: ${leadTime || '-'}`);
    lines.push('');
    lines.push(`${t.totalPrice.toUpperCase()}: ${fmt(grandTotal)}`);
    lines.push('');
    lines.push(`${t.contact}: ${contact || '-'}`);
    return lines.join('\n');
  }

  function copyAsText() {
    navigator.clipboard.writeText(buildQuoteText()).then(() => {
      setCopyStatus('done');
      setTimeout(() => setCopyStatus('idle'), 1800);
    });
  }

  async function downloadAsPDF() {
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          clientName: selectedClient?.name || null,
          leadTime,
          contact,
          parts: parts.map((p, i) => ({
            partName: p.partName,
            materialName: getMaterialName(p.materialId),
            qty: p.qty,
            total: partTotals[i].total,
          })),
          grandTotal,
          lang,
          date: new Date().toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB', {
            day: '2-digit', month: 'long', year: 'numeric',
          }),
        }),
      });

      if (!res.ok) throw new Error('PDF failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote_${(company || 'quote').replace(/[^a-zA-Z0-9]/g, '_')}_${lang}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF error:', e);
      alert(lang === 'bg' ? 'Грешка при генериране на PDF' : 'PDF generation failed');
    }
  }

  const colors = {
    metal: '#E8E6E1', graphite: '#1F2421', graphiteSoft: '#5A5F5A',
    spark: '#FF6B1A', sparkDim: '#C9551A', paper: '#FAF8F4', ok: '#4A7A5C',
  };

  if (loading) {
    return (
      <div style={{ padding: 40, fontFamily: 'monospace', color: colors.graphiteSoft, background: colors.metal, minHeight: '100vh' }}>
        {t.loading}
      </div>
    );
  }

  return (
    <div style={{ background: colors.metal, minHeight: '100vh', fontFamily: 'sans-serif', color: colors.graphite }}>
      <div style={{
        height: 6,
        background: `repeating-linear-gradient(135deg, ${colors.spark} 0 10px, ${colors.graphite} 10px 20px)`,
      }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 0 20px', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
            QUOTE<span style={{ color: colors.spark }}>FORGE</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: colors.graphiteSoft, fontFamily: 'monospace' }}>{userEmail}</span>
            <div style={{ display: 'flex', border: `1px solid ${colors.graphite}`, borderRadius: 2, overflow: 'hidden' }}>
              {(['bg', 'en'] as Lang[]).map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  background: lang === l ? colors.graphite : 'transparent',
                  color: lang === l ? colors.paper : colors.graphiteSoft,
                  border: 'none', padding: '7px 13px', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'monospace',
                }}>{l.toUpperCase()}</button>
              ))}
            </div>
            <button onClick={handleLogout} style={{
              background: 'none', border: `1px solid ${colors.graphiteSoft}66`, color: colors.graphiteSoft,
              padding: '7px 13px', fontSize: 12, cursor: 'pointer', borderRadius: 2, fontFamily: 'monospace',
            }}>{t.logout}</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: `1px solid ${colors.graphiteSoft}33` }}>
          {([
            ['new', t.newQuote],
            ['history', `${t.history} (${history.length})`],
            ['clients', `${t.clients} (${clients.length})`],
          ] as const).map(([key, label]) => (
            <button key={key} onClick={() => setView(key)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 18px', fontSize: 14, fontWeight: 600,
              color: view === key ? colors.spark : colors.graphiteSoft,
              borderBottom: view === key ? `2px solid ${colors.spark}` : '2px solid transparent',
              fontFamily: 'monospace',
            }}>{label}</button>
          ))}
        </div>

        {view === 'new' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 0, alignItems: 'start' }}>
            <div style={{ background: colors.graphite, color: colors.paper, padding: '32px 28px', minHeight: 500 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.1em', color: colors.spark, marginBottom: 16, fontFamily: 'monospace' }}>
                01 — {lang === 'bg' ? 'ОФЕРТА' : 'QUOTE'}
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#B8BDB6', marginBottom: 6 }}>{t.company}</label>
                <input value={company} onChange={e => setCompany(e.target.value)}
                  placeholder={lang === 'bg' ? 'напр. Металпро ЕООД' : 'e.g. MetalPro Ltd.'}
                  style={inputStyle()} />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#B8BDB6', marginBottom: 6 }}>{t.client}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={clientId} onChange={e => setClientId(e.target.value)} style={{ ...inputStyle(), flex: 1 }}>
                    <option value="">{t.selectClient}</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button onClick={() => setShowNewClient(!showNewClient)} style={smallBtnStyle()}>
                    {t.newClient}
                  </button>
                </div>
                {showNewClient && (
                  <div style={{ marginTop: 10, padding: 12, background: '#2A302C', borderRadius: 2 }}>
                    <input value={newClientForm.name} onChange={e => setNewClientForm({ ...newClientForm, name: e.target.value })}
                      placeholder={t.clientName} style={{ ...inputStyle(), marginBottom: 8 }} />
                    <input value={newClientForm.contact} onChange={e => setNewClientForm({ ...newClientForm, contact: e.target.value })}
                      placeholder={t.clientContact} style={{ ...inputStyle(), marginBottom: 8 }} />
                    <input value={newClientForm.country} onChange={e => setNewClientForm({ ...newClientForm, country: e.target.value })}
                      placeholder={t.clientCountry} style={{ ...inputStyle(), marginBottom: 8 }} />
                    <button onClick={saveNewClient} style={{ ...smallBtnStyle(), width: '100%', background: colors.spark }}>
                      {t.saveClient}
                    </button>
                  </div>
                )}
              </div>

              <div style={{ borderTop: `1px dashed #3C433D`, margin: '20px 0' }} />

              <div style={{ fontSize: 11, letterSpacing: '0.1em', color: colors.spark, marginBottom: 16, fontFamily: 'monospace' }}>
                02 — {t.parts}
              </div>

              {parts.map((p, idx) => (
                <div key={p.id} style={{ marginBottom: 20, padding: 14, background: '#262C28', borderRadius: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: colors.spark, fontWeight: 700, fontFamily: 'monospace' }}>
                      {t.partName} {idx + 1}
                    </span>
                    {parts.length > 1 && (
                      <button onClick={() => removePart(p.id)} style={{
                        background: 'none', border: 'none', color: '#8B9088', cursor: 'pointer', fontSize: 11,
                      }}>{t.removePart} ✕</button>
                    )}
                  </div>

                  <input value={p.partName} onChange={e => updatePart(p.id, 'partName', e.target.value)}
                    placeholder={lang === 'bg' ? 'напр. Flange Bracket' : 'e.g. Flange Bracket'}
                    style={{ ...inputStyle(), marginBottom: 10 }} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <select value={p.materialId} onChange={e => updatePart(p.id, 'materialId', e.target.value)} style={inputStyle()}>
                      {MATERIALS.map(m => (
                        <option key={m.id} value={m.id}>{lang === 'bg' ? m.nameBg : m.nameEn} (~€{m.price}/kg)</option>
                      ))}
                    </select>
                    <input type="number" value={p.qty} onChange={e => updatePart(p.id, 'qty', e.target.value)}
                      placeholder={t.qty} style={inputStyle()} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <input type="number" value={p.weight} onChange={e => updatePart(p.id, 'weight', e.target.value)}
                      placeholder={t.weight + ' (kg)'} style={inputStyle()} />
                    <input type="number" value={p.matPrice} onChange={e => updatePart(p.id, 'matPrice', e.target.value)}
                      placeholder={t.matPrice + ' (€/kg)'} style={inputStyle()} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <input type="number" value={p.machTime} onChange={e => updatePart(p.id, 'machTime', e.target.value)}
                      placeholder={t.machTime + ' (h)'} style={inputStyle()} />
                    <input type="number" value={p.rate} onChange={e => updatePart(p.id, 'rate', e.target.value)}
                      placeholder={t.rate + ' (€/h)'} style={inputStyle()} />
                  </div>

                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#B8BDB6', marginBottom: 6 }}>
                      <span>{t.margin}</span>
                      <span style={{ color: colors.spark, fontFamily: 'monospace' }}>{p.margin}%</span>
                    </label>
                    <input type="range" min="0" max="60" value={p.margin}
                      onChange={e => updatePart(p.id, 'margin', Number(e.target.value))} style={{ width: '100%' }} />
                  </div>

                  <div style={{ marginTop: 10, textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: colors.spark }}>
                    {fmt(partTotals[idx].total)}
                  </div>
                </div>
              ))}

              <button onClick={addPart} style={{ ...smallBtnStyle(), width: '100%', marginBottom: 20 }}>
                {t.addPart}
              </button>

              <div style={{ borderTop: `1px dashed #3C433D`, margin: '20px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#B8BDB6', marginBottom: 6 }}>{t.leadTime}</label>
                  <input value={leadTime} onChange={e => setLeadTime(e.target.value)}
                    placeholder={lang === 'bg' ? 'напр. 10 раб. дни' : 'e.g. 10 working days'} style={inputStyle()} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#B8BDB6', marginBottom: 6 }}>{t.contact}</label>
                  <input value={contact} onChange={e => setContact(e.target.value)}
                    placeholder={lang === 'bg' ? 'email или тел.' : 'email or phone'} style={inputStyle()} />
                </div>
              </div>
            </div>

            <div style={{ background: colors.paper, padding: '32px 28px', minHeight: 500 }}>
              <div style={{
                background: 'white', border: `1px solid #D6D2C8`, padding: '28px 24px',
                boxShadow: '0 4px 24px rgba(31,36,33,0.08)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${colors.graphite}`, paddingBottom: 14, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{company || (lang === 'bg' ? 'Вашата работилница' : 'Your Workshop')}</div>
                    <div style={{ fontSize: 12, color: colors.graphiteSoft }}>Bulgaria · Manufacturing</div>
                    {selectedClient && (
                      <div style={{ fontSize: 12, color: colors.graphiteSoft, marginTop: 4 }}>
                        {lang === 'bg' ? 'За' : 'For'}: {selectedClient.name}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 11, color: colors.graphiteSoft }}>
                    <div style={{ fontWeight: 700, color: colors.graphite, fontSize: 13 }}>{t.quoteTitle}</div>
                    <div>{new Date().toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  </div>
                </div>

                {parts.map((p, idx) => (
                  <div key={p.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #EFEDE8' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{p.partName || `${t.partName} ${idx + 1}`}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.graphiteSoft, marginBottom: 3 }}>
                      <span>{t.material}</span><span style={{ fontFamily: 'monospace' }}>{getMaterialName(p.materialId)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.graphiteSoft, marginBottom: 3 }}>
                      <span>{t.qty}</span><span style={{ fontFamily: 'monospace' }}>{p.qty || '1'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginTop: 6 }}>
                      <span>{t.total}</span><span style={{ fontFamily: 'monospace', color: colors.sparkDim }}>{fmt(partTotals[idx].total)}</span>
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16, paddingTop: 14, borderTop: `2px solid ${colors.graphite}` }}>
                  <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 13 }}>{t.totalPrice}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 26, color: colors.sparkDim }}>{fmt(grandTotal)}</span>
                </div>

                <div style={{ marginTop: 16, fontSize: 11, color: colors.graphiteSoft, fontStyle: 'italic' }}>
                  {t.leadTime}: {leadTime || '—'} · {t.contact}: {contact || '—'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                <button onClick={saveQuote} disabled={saveStatus === 'saving'} style={{ ...actionBtnStyle(colors), background: saveStatus === 'saved' ? colors.ok : colors.graphite }}>
                  {saveStatus === 'saved' ? t.saved : t.save}
                </button>
                <button onClick={copyAsText} style={{ ...actionBtnStyle(colors), background: copyStatus === 'done' ? colors.ok : colors.graphite }}>
                  {copyStatus === 'done' ? t.copyDone : t.copyText}
                </button>
                <button onClick={downloadAsPDF} style={{ ...actionBtnStyle(colors), background: colors.sparkDim }}>
                  {t.downloadTxt}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'history' && (
          <div style={{ padding: '20px 0 60px' }}>
            {history.length === 0 ? (
              <div style={{ color: colors.graphiteSoft, fontFamily: 'monospace', fontSize: 13 }}>{t.noHistory}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history.map(q => (
                  <div key={q.id} style={{
                    background: 'white', border: '1px solid #D6D2C8', padding: 16,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {company || '—'} {q.client_name_snapshot ? `→ ${q.client_name_snapshot}` : ''}
                      </div>
                      <div style={{ fontSize: 12, color: colors.graphiteSoft, fontFamily: 'monospace' }}>
                        {new Date(q.created_at).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB')} · {q.parts.length} {t.parts} · {fmt(q.grand_total)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => loadQuote(q)} style={smallBtnStyle()}>{t.load}</button>
                      <button onClick={() => deleteQuote(q.id)} style={{ ...smallBtnStyle(), background: '#B33A3A' }}>{t.delete}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'clients' && (
          <div style={{ padding: '20px 0 60px' }}>
            {clients.length === 0 ? (
              <div style={{ color: colors.graphiteSoft, fontFamily: 'monospace', fontSize: 13 }}>{t.noClients}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {clients.map(c => (
                  <div key={c.id} style={{
                    background: 'white', border: '1px solid #D6D2C8', padding: 16,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: colors.graphiteSoft }}>{c.contact} {c.country ? `· ${c.country}` : ''}</div>
                    </div>
                    <button onClick={() => deleteClient(c.id)} style={{ ...smallBtnStyle(), background: '#B33A3A' }}>{t.delete}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '20px 0 40px', fontSize: 11, color: colors.graphiteSoft, fontFamily: 'monospace' }}>
          QUOTEFORGE — {lang === 'bg' ? 'ИНСТРУМЕНТ ЗА БЪЛГАРСКИ РАБОТИЛНИЦИ' : 'A TOOL FOR BULGARIAN WORKSHOPS'}
        </div>
      </div>
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%', background: '#2A302C', border: '1px solid #3C433D', color: '#FAF8F4',
    padding: '9px 10px', fontSize: 13, fontFamily: 'monospace', borderRadius: 2, boxSizing: 'border-box',
  };
}

function smallBtnStyle(): React.CSSProperties {
  return {
    background: '#1F2421', color: '#FAF8F4', border: 'none', padding: '8px 12px',
    fontSize: 12, cursor: 'pointer', borderRadius: 2, fontFamily: 'monospace', whiteSpace: 'nowrap',
  };
}

function actionBtnStyle(colors: { paper: string }): React.CSSProperties {
  return {
    flex: 1, color: colors.paper, border: 'none', padding: '12px 16px',
    fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', fontFamily: 'monospace',
  };
}
