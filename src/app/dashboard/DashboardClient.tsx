'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 860);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

type Lang = 'bg' | 'en';

const i18n = {
  bg: {
    newQuote: 'Нова оферта', history: 'История', clients: 'Клиенти', logout: 'Изход',
    material: 'Материал', weight: 'Тегло (kg)', matPrice: 'Цена материал (€/kg)',
    machTime: 'Машинно време (ч)', rate: 'Часова ставка (€/ч)', margin: 'Надценка / марж',
    partName: 'Наименование на детайла', qty: 'Брой', addPart: '+ Добави детайл',
    removePart: 'Премахни',
    company: 'Работилница', client: 'Клиент', newClient: '+ Нов клиент',
    leadTime: 'Срок на доставка', contact: 'Контакт',
    quoteTitle: 'ОФЕРТА', totalPrice: 'Обща цена', save: 'Запази',
    saved: 'Запазено ✓', copyText: 'Копирай', copyDone: 'Копирано ✓',
    downloadPdf: 'PDF',
    noHistory: 'Няма запазени оферти.', noClients: 'Няма запазени клиенти.',
    delete: 'Изтрий', load: 'Отвори', parts: 'детайли', total: 'Сума',
    clientName: 'Име на клиента', clientContact: 'Контакт', clientCountry: 'Държава',
    saveClient: 'Запази клиент', selectClient: 'Избери клиент',
    loading: 'Зареждане...',
    isNewPart: 'Нов детайл?', newPartYes: 'Да, нов', newPartNo: 'Не, повторен',
    camHours: 'CAM програмиране (ч)', setupHours: 'Настройка (ч)', setupRate: 'Ставка настройка (€/ч)',
    toolWear: 'Износ на инструменти (%)',
    breakdown: 'Разбивка на цената', matCostL: 'Материал', machCostL: 'Обработка',
    setupCostL: 'Настройка + CAM', toolCostL: 'Инструменти', marginCostL: 'Марж',
    engineeringNote: 'Настройка и CAM се броят само за нови детайли — при повторна поръчка се пропускат.',
  },
  en: {
    newQuote: 'New Quote', history: 'History', clients: 'Clients', logout: 'Log out',
    material: 'Material', weight: 'Weight (kg)', matPrice: 'Material price (€/kg)',
    machTime: 'Machining time (h)', rate: 'Hourly rate (€/h)', margin: 'Markup / margin',
    partName: 'Part name', qty: 'Quantity', addPart: '+ Add part',
    removePart: 'Remove',
    company: 'Workshop', client: 'Client', newClient: '+ New client',
    leadTime: 'Lead time', contact: 'Contact',
    quoteTitle: 'QUOTATION', totalPrice: 'Total Price', save: 'Save',
    saved: 'Saved ✓', copyText: 'Copy', copyDone: 'Copied ✓',
    downloadPdf: 'PDF',
    noHistory: 'No saved quotes yet.', noClients: 'No saved clients yet.',
    delete: 'Delete', load: 'Open', parts: 'parts', total: 'Total',
    clientName: 'Client name', clientContact: 'Contact', clientCountry: 'Country',
    saveClient: 'Save client', selectClient: 'Select client',
    loading: 'Loading...',
    isNewPart: 'New part?', newPartYes: 'Yes, new', newPartNo: 'No, repeat',
    camHours: 'CAM programming (h)', setupHours: 'Setup time (h)', setupRate: 'Setup rate (€/h)',
    toolWear: 'Tool wear (%)',
    breakdown: 'Price breakdown', matCostL: 'Material', machCostL: 'Machining',
    setupCostL: 'Setup + CAM', toolCostL: 'Tooling', marginCostL: 'Margin',
    engineeringNote: 'Setup and CAM only apply to new parts — skipped for repeat orders.',
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
  isNew: boolean;
  camHours: string;
  setupHours: string;
  setupRate: string;
  toolWear: number;
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
    isNew: true, camHours: '1', setupHours: '0.5', setupRate: '40', toolWear: 10,
  };
}

export default function DashboardClient({ userEmail }: { userEmail: string }) {
  const [lang, setLang] = useState<Lang>('bg');
  const [view, setView] = useState<'new' | 'history' | 'clients'>('new');
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');

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
  const [expandedBreakdown, setExpandedBreakdown] = useState<string | null>(null);

  const router = useRouter();
  const t = i18n[lang];

  const loadAll = useCallback(async () => {
    try {
      const [profileRes, clientsRes, quotesRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/clients'),
        fetch('/api/quotes'),
      ]);
      if (profileRes.ok) { const { profile } = await profileRes.json(); setCompany(profile?.company_name || ''); }
      if (clientsRes.ok) { const { clients } = await clientsRes.json(); setClients(clients || []); }
      if (quotesRes.ok) { const { quotes } = await quotesRes.json(); setHistory(quotes || []); }
    } catch (e) { console.error('Failed to load data', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

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

  function updatePart(id: string, field: keyof Part, value: string | number | boolean) {
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

  function addPart() { setParts(prev => [...prev, emptyPart()]); }
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
    const camHours = parseFloat(p.camHours) || 0;
    const setupHours = parseFloat(p.setupHours) || 0;
    const setupRate = parseFloat(p.setupRate) || 0;
    const toolWearPct = Number(p.toolWear) || 0;

    const matCost = weight * matPrice;
    const machCost = machTime * rate;
    const toolCost = machCost * (toolWearPct / 100);

    const engineeringCost = p.isNew ? (setupHours * setupRate + camHours * 60) : 0;
    const engineeringCostPerUnit = engineeringCost / qty;

    const perUnitCost = matCost + machCost + toolCost + engineeringCostPerUnit;
    const subtotal = perUnitCost * qty;
    const total = subtotal * (1 + margin / 100);

    return {
      matCost: matCost * qty,
      machCost: machCost * qty,
      toolCost: toolCost * qty,
      engineeringCost,
      marginAmount: total - subtotal,
      total,
    };
  }

  const partTotals = parts.map(calcPartCost);
  const grandTotal = partTotals.reduce((sum, pt) => sum + pt.total, 0);

  function fmt(n: number) {
    return '€' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getMaterialName(materialId: string) {
    const mat = MATERIALS.find(m => m.id === materialId);
    return mat ? (lang === 'bg' ? mat.nameBg : mat.nameEn) : '—';
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
          lead_time: leadTime, contact,
          parts: parts.map((p, i) => ({ ...p, total: partTotals[i].total, materialName: getMaterialName(p.materialId) })),
          grand_total: grandTotal,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      const { quote } = await res.json();
      setHistory(prev => [quote, ...prev]);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1800);
    } catch { setSaveStatus('error'); setTimeout(() => setSaveStatus('idle'), 1800); }
  }

  async function deleteQuote(id: string) {
    setHistory(prev => prev.filter(q => q.id !== id));
    await fetch(`/api/quotes/${id}`, { method: 'DELETE' }).catch(() => {});
  }

  function loadQuote(quote: Quote) {
    setClientId(quote.client_id || '');
    setLeadTime(quote.lead_time || '');
    setContact(quote.contact || '');
    setParts(quote.parts.map(p => ({
      ...emptyPart(),
      ...p,
      id: uid(),
    })));
    setView('new');
    setMobileTab('form');
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
    } catch (e) { console.error(e); }
  }

  async function deleteClient(id: string) {
    setClients(prev => prev.filter(c => c.id !== id));
    if (clientId === id) setClientId('');
    await fetch(`/api/clients/${id}`, { method: 'DELETE' }).catch(() => {});
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

  async function copyAsText() {
    await navigator.clipboard.writeText(buildQuoteText());
    setCopyStatus('done');
    setTimeout(() => setCopyStatus('idle'), 1800);
  }

  async function downloadAsPDF() {
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company, clientName: selectedClient?.name || null,
          leadTime, contact,
          parts: parts.map((p, i) => ({
            partName: p.partName, materialName: getMaterialName(p.materialId),
            qty: p.qty, total: partTotals[i].total,
          })),
          grandTotal, lang,
          date: new Date().toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
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

  const C = {
    metal: '#E8E6E1', graphite: '#1F2421', soft: '#5A5F5A',
    spark: '#FF6B1A', sparkDim: '#C9551A', paper: '#FAF8F4', ok: '#4A7A5C',
  };

  const inp: React.CSSProperties = {
    width: '100%', background: '#2A302C', border: '1px solid #3C433D',
    color: '#FAF8F4', padding: '10px 11px', fontSize: 14,
    fontFamily: 'monospace', borderRadius: 2, boxSizing: 'border-box',
  };

  const smallBtn: React.CSSProperties = {
    background: '#1F2421', color: '#FAF8F4', border: 'none',
    padding: '9px 13px', fontSize: 12, cursor: 'pointer',
    borderRadius: 2, fontFamily: 'monospace', whiteSpace: 'nowrap',
  };

  if (loading) {
    return (
      <div style={{ padding: 40, fontFamily: 'monospace', color: C.soft, background: C.metal, minHeight: '100vh' }}>
        {t.loading}
      </div>
    );
  }

  const QuotePreview = () => (
    <div style={{ background: C.paper, padding: isMobile ? '16px' : '32px 28px', minHeight: isMobile ? 'auto' : 500 }}>
      <div style={{ background: 'white', border: `1px solid #D6D2C8`, padding: isMobile ? '20px 16px' : '28px 24px', boxShadow: '0 4px 24px rgba(31,36,33,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${C.graphite}`, paddingBottom: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>{company || (lang === 'bg' ? 'Вашата работилница' : 'Your Workshop')}</div>
            <div style={{ fontSize: 11, color: C.soft }}>Bulgaria · Manufacturing</div>
            {selectedClient && <div style={{ fontSize: 11, color: C.soft, marginTop: 2 }}>{lang === 'bg' ? 'За' : 'For'}: {selectedClient.name}</div>}
          </div>
          <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 10, color: C.soft }}>
            <div style={{ fontWeight: 700, color: C.graphite, fontSize: 12 }}>{t.quoteTitle}</div>
            <div>{new Date().toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
        </div>

        {parts.map((p, idx) => (
          <div key={p.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #EFEDE8' }}>
            <div
              onClick={() => setExpandedBreakdown(expandedBreakdown === p.id ? null : p.id)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                {p.partName || `${t.partName} ${idx + 1}`}
                {p.isNew && <span style={{ color: C.spark, fontSize: 9, marginLeft: 6 }}>● {lang === 'bg' ? 'нов' : 'new'}</span>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.soft, marginBottom: 2 }}>
                <span>{getMaterialName(p.materialId)} · {t.qty}: {p.qty || '1'}</span>
                <span style={{ fontFamily: 'monospace', color: C.sparkDim, fontWeight: 700 }}>{fmt(partTotals[idx].total)}</span>
              </div>
            </div>
            {expandedBreakdown === p.id && (
              <div style={{ marginTop: 8, padding: 10, background: '#F5F4F1', fontSize: 10, fontFamily: 'monospace' }}>
                <div style={{ fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.breakdown}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: C.soft }}>{t.matCostL}</span><span>{fmt(partTotals[idx].matCost)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: C.soft }}>{t.machCostL}</span><span>{fmt(partTotals[idx].machCost)}</span>
                </div>
                {p.isNew && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ color: C.soft }}>{t.setupCostL}</span><span>{fmt(partTotals[idx].engineeringCost)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: C.soft }}>{t.toolCostL}</span><span>{fmt(partTotals[idx].toolCost)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: C.soft }}>{t.marginCostL}</span><span>{fmt(partTotals[idx].marginAmount)}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14, paddingTop: 12, borderTop: `2px solid ${C.graphite}` }}>
          <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 12 }}>{t.totalPrice}</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: isMobile ? 22 : 26, color: C.sparkDim }}>{fmt(grandTotal)}</span>
        </div>

        {(leadTime || contact) && (
          <div style={{ marginTop: 12, fontSize: 10, color: C.soft, fontStyle: 'italic' }}>
            {leadTime && <span>{t.leadTime}: {leadTime}</span>}
            {leadTime && contact && <span> · </span>}
            {contact && <span>{t.contact}: {contact}</span>}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button onClick={saveQuote} disabled={saveStatus === 'saving'} style={{
          flex: 1, background: saveStatus === 'saved' ? C.ok : C.graphite,
          color: C.paper, border: 'none', padding: '12px 10px', fontSize: 12,
          textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'monospace', minWidth: 80,
        }}>
          {saveStatus === 'saved' ? t.saved : t.save}
        </button>
        <button onClick={copyAsText} style={{
          flex: 1, background: copyStatus === 'done' ? C.ok : C.graphite,
          color: C.paper, border: 'none', padding: '12px 10px', fontSize: 12,
          textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'monospace', minWidth: 80,
        }}>
          {copyStatus === 'done' ? t.copyDone : t.copyText}
        </button>
        <button onClick={downloadAsPDF} style={{
          flex: 1, background: C.sparkDim, color: C.paper, border: 'none',
          padding: '12px 10px', fontSize: 12, textTransform: 'uppercase',
          cursor: 'pointer', fontFamily: 'monospace', minWidth: 60,
        }}>
          {t.downloadPdf}
        </button>
      </div>
    </div>
  );

  const FormPanel = () => (
    <div style={{ background: C.graphite, color: C.paper, padding: isMobile ? '20px 16px' : '32px 28px' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', color: C.spark, marginBottom: 14, fontFamily: 'monospace' }}>
        01 — {lang === 'bg' ? 'ОФЕРТА' : 'QUOTE'}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 11, color: '#B8BDB6', marginBottom: 5 }}>{t.company}</label>
        <input value={company} onChange={e => setCompany(e.target.value)}
          placeholder={lang === 'bg' ? 'напр. Металпро ЕООД' : 'e.g. MetalPro Ltd.'} style={inp} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 11, color: '#B8BDB6', marginBottom: 5 }}>{t.client}</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={clientId} onChange={e => setClientId(e.target.value)} style={{ ...inp, flex: 1 }}>
            <option value="">{t.selectClient}</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => setShowNewClient(!showNewClient)} style={smallBtn}>{t.newClient}</button>
        </div>
        {showNewClient && (
          <div style={{ marginTop: 10, padding: 12, background: '#2A302C', borderRadius: 2 }}>
            <input value={newClientForm.name} onChange={e => setNewClientForm({ ...newClientForm, name: e.target.value })}
              placeholder={t.clientName} style={{ ...inp, marginBottom: 8 }} />
            <input value={newClientForm.contact} onChange={e => setNewClientForm({ ...newClientForm, contact: e.target.value })}
              placeholder={t.clientContact} style={{ ...inp, marginBottom: 8 }} />
            <input value={newClientForm.country} onChange={e => setNewClientForm({ ...newClientForm, country: e.target.value })}
              placeholder={t.clientCountry} style={{ ...inp, marginBottom: 8 }} />
            <button onClick={saveNewClient} style={{ ...smallBtn, width: '100%', background: C.spark }}>{t.saveClient}</button>
          </div>
        )}
      </div>

      <div style={{ borderTop: `1px dashed #3C433D`, margin: '18px 0' }} />
      <div style={{ fontSize: 10, letterSpacing: '0.1em', color: C.spark, marginBottom: 14, fontFamily: 'monospace' }}>
        02 — {t.parts.toUpperCase()}
      </div>

      {parts.map((p, idx) => (
        <div key={p.id} style={{ marginBottom: 16, padding: 12, background: '#262C28', borderRadius: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: C.spark, fontWeight: 700, fontFamily: 'monospace' }}>
              {t.partName} {idx + 1}
            </span>
            {parts.length > 1 && (
              <button onClick={() => removePart(p.id)} style={{ background: 'none', border: 'none', color: '#8B9088', cursor: 'pointer', fontSize: 11 }}>
                {t.removePart} ✕
              </button>
            )}
          </div>

          <input value={p.partName} onChange={e => updatePart(p.id, 'partName', e.target.value)}
            placeholder={lang === 'bg' ? 'напр. Фланец' : 'e.g. Flange'} style={{ ...inp, marginBottom: 10 }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <select value={p.materialId} onChange={e => updatePart(p.id, 'materialId', e.target.value)} style={inp}>
              {MATERIALS.map(m => (
                <option key={m.id} value={m.id}>{lang === 'bg' ? m.nameBg : m.nameEn}</option>
              ))}
            </select>
            <input type="number" value={p.qty} onChange={e => updatePart(p.id, 'qty', e.target.value)}
              placeholder={t.qty} style={inp} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input type="number" value={p.weight} onChange={e => updatePart(p.id, 'weight', e.target.value)}
              placeholder={t.weight} style={inp} />
            <input type="number" value={p.matPrice} onChange={e => updatePart(p.id, 'matPrice', e.target.value)}
              placeholder={t.matPrice} style={inp} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <input type="number" value={p.machTime} onChange={e => updatePart(p.id, 'machTime', e.target.value)}
              placeholder={t.machTime} style={inp} />
            <input type="number" value={p.rate} onChange={e => updatePart(p.id, 'rate', e.target.value)}
              placeholder={t.rate} style={inp} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#B8BDB6', marginBottom: 6 }}>
              <span>{t.toolWear}</span>
              <span style={{ color: C.spark, fontFamily: 'monospace' }}>{p.toolWear}%</span>
            </div>
            <input type="range" min="0" max="25" value={p.toolWear}
              onChange={e => updatePart(p.id, 'toolWear', Number(e.target.value))} style={{ width: '100%' }} />
          </div>

          <div style={{ marginBottom: 10, padding: 10, background: '#1A1E1B', borderRadius: 2, border: `1px solid ${p.isNew ? C.spark + '55' : '#3C433D'}` }}>
            <div style={{ fontSize: 11, color: '#B8BDB6', marginBottom: 8 }}>{t.isNewPart}</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: p.isNew ? 10 : 0 }}>
              <button onClick={() => updatePart(p.id, 'isNew', true)} style={{
                flex: 1, padding: '8px', fontSize: 11, border: 'none', borderRadius: 2, cursor: 'pointer',
                fontFamily: 'monospace', background: p.isNew ? C.spark : '#2A302C',
                color: p.isNew ? C.graphite : '#8B9088', fontWeight: p.isNew ? 700 : 400,
              }}>{t.newPartYes}</button>
              <button onClick={() => updatePart(p.id, 'isNew', false)} style={{
                flex: 1, padding: '8px', fontSize: 11, border: 'none', borderRadius: 2, cursor: 'pointer',
                fontFamily: 'monospace', background: !p.isNew ? C.ok : '#2A302C',
                color: !p.isNew ? C.paper : '#8B9088', fontWeight: !p.isNew ? 700 : 400,
              }}>{t.newPartNo}</button>
            </div>

            {p.isNew && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, color: '#8B9088', marginBottom: 4 }}>{t.camHours}</label>
                    <input type="number" step="0.1" value={p.camHours} onChange={e => updatePart(p.id, 'camHours', e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, color: '#8B9088', marginBottom: 4 }}>{t.setupHours}</label>
                    <input type="number" step="0.1" value={p.setupHours} onChange={e => updatePart(p.id, 'setupHours', e.target.value)} style={inp} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: '#8B9088', marginBottom: 4 }}>{t.setupRate}</label>
                  <input type="number" value={p.setupRate} onChange={e => updatePart(p.id, 'setupRate', e.target.value)} style={inp} />
                </div>
                <div style={{ fontSize: 9.5, color: '#6B716A', marginTop: 8, fontStyle: 'italic' }}>{t.engineeringNote}</div>
              </div>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#B8BDB6', marginBottom: 6 }}>
              <span>{t.margin}</span>
              <span style={{ color: C.spark, fontFamily: 'monospace' }}>{p.margin}%</span>
            </div>
            <input type="range" min="0" max="60" value={p.margin}
              onChange={e => updatePart(p.id, 'margin', Number(e.target.value))} style={{ width: '100%' }} />
          </div>

          <div style={{ marginTop: 10, textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: C.spark }}>
            {fmt(partTotals[idx].total)}
          </div>
        </div>
      ))}

      <button onClick={addPart} style={{ ...smallBtn, width: '100%', marginBottom: 18 }}>{t.addPart}</button>

      <div style={{ borderTop: `1px dashed #3C433D`, margin: '18px 0' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#B8BDB6', marginBottom: 5 }}>{t.leadTime}</label>
          <input value={leadTime} onChange={e => setLeadTime(e.target.value)}
            placeholder={lang === 'bg' ? 'напр. 10 дни' : 'e.g. 10 days'} style={inp} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#B8BDB6', marginBottom: 5 }}>{t.contact}</label>
          <input value={contact} onChange={e => setContact(e.target.value)}
            placeholder={lang === 'bg' ? 'email или тел.' : 'email or phone'} style={inp} />
        </div>
      </div>

      {isMobile && (
        <button onClick={() => setMobileTab('preview')} style={{
          width: '100%', marginTop: 18, background: C.spark, color: C.graphite,
          border: 'none', padding: '14px', fontWeight: 700, fontSize: 14,
          borderRadius: 2, cursor: 'pointer', fontFamily: 'monospace',
        }}>
          {lang === 'bg' ? 'Виж офертата →' : 'Preview quote →'}
        </button>
      )}
    </div>
  );

  return (
    <div style={{ background: C.metal, minHeight: '100vh', fontFamily: 'sans-serif', color: C.graphite }}>
      <div style={{ height: 5, background: `repeating-linear-gradient(135deg, ${C.spark} 0 10px, ${C.graphite} 10px 20px)` }} />

      <div style={{ maxWidth: isMobile ? '100%' : 1100, margin: '0 auto', padding: isMobile ? '0' : '0 24px' }}>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: isMobile ? '14px 16px' : '24px 0 18px', flexWrap: 'wrap', gap: 10,
          background: isMobile ? C.graphite : 'transparent',
        }}>
          <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 800, color: isMobile ? C.paper : C.graphite }}>
            QUOTE<span style={{ color: C.spark }}>FORGE</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', border: `1px solid ${isMobile ? '#3C433D' : C.graphite}`, borderRadius: 2, overflow: 'hidden' }}>
              {(['bg', 'en'] as Lang[]).map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  background: lang === l ? (isMobile ? C.spark : C.graphite) : 'transparent',
                  color: lang === l ? (isMobile ? C.graphite : C.paper) : (isMobile ? '#B8BDB6' : C.soft),
                  border: 'none', padding: '7px 12px', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'monospace',
                }}>{l.toUpperCase()}</button>
              ))}
            </div>
            <button onClick={handleLogout} style={{
              background: 'none', border: `1px solid ${isMobile ? '#3C433D' : C.soft + '66'}`,
              color: isMobile ? '#B8BDB6' : C.soft,
              padding: '7px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 2, fontFamily: 'monospace',
            }}>{t.logout}</button>
          </div>
        </div>

        <div style={{
          display: 'flex', borderBottom: `1px solid ${C.soft}33`,
          background: isMobile ? '#262C28' : 'transparent',
          overflowX: 'auto',
        }}>
          {([
            ['new', t.newQuote],
            ['history', `${t.history} (${history.length})`],
            ['clients', `${t.clients} (${clients.length})`],
          ] as const).map(([key, label]) => (
            <button key={key} onClick={() => { setView(key); setMobileTab('form'); }} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: isMobile ? '12px 14px' : '10px 18px',
              fontSize: isMobile ? 13 : 14, fontWeight: 600,
              color: view === key ? C.spark : (isMobile ? '#B8BDB6' : C.soft),
              borderBottom: view === key ? `2px solid ${C.spark}` : '2px solid transparent',
              fontFamily: 'monospace', whiteSpace: 'nowrap',
            }}>{label}</button>
          ))}
        </div>

        {view === 'new' && isMobile && (
          <div style={{ display: 'flex', background: '#1A1E1B' }}>
            {(['form', 'preview'] as const).map(tab => (
              <button key={tab} onClick={() => setMobileTab(tab)} style={{
                flex: 1, background: mobileTab === tab ? C.graphite : 'transparent',
                color: mobileTab === tab ? C.paper : '#8B9088',
                border: 'none', padding: '10px', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'monospace',
                borderBottom: mobileTab === tab ? `2px solid ${C.spark}` : '2px solid transparent',
              }}>
                {tab === 'form' ? (lang === 'bg' ? '📝 Форма' : '📝 Form') : (lang === 'bg' ? '📄 Оферта' : '📄 Quote')}
              </button>
            ))}
          </div>
        )}

        {view === 'new' && (
          isMobile ? (
            mobileTab === 'form' ? <FormPanel /> : <QuotePreview />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 0, alignItems: 'start' }}>
              <FormPanel />
              <QuotePreview />
            </div>
          )
        )}

        {view === 'history' && (
          <div style={{ padding: isMobile ? '16px' : '20px 0 60px' }}>
            {history.length === 0 ? (
              <div style={{ color: C.soft, fontFamily: 'monospace', fontSize: 13 }}>{t.noHistory}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history.map(q => (
                  <div key={q.id} style={{
                    background: 'white', border: '1px solid #D6D2C8', padding: isMobile ? '12px' : '16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {company || '—'} {q.client_name_snapshot ? `→ ${q.client_name_snapshot}` : ''}
                      </div>
                      <div style={{ fontSize: 12, color: C.soft, fontFamily: 'monospace' }}>
                        {new Date(q.created_at).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB')} · {q.parts.length} {t.parts} · {fmt(q.grand_total)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => loadQuote(q)} style={smallBtn}>{t.load}</button>
                      <button onClick={() => deleteQuote(q.id)} style={{ ...smallBtn, background: '#B33A3A' }}>{t.delete}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'clients' && (
          <div style={{ padding: isMobile ? '16px' : '20px 0 60px' }}>
            {clients.length === 0 ? (
              <div style={{ color: C.soft, fontFamily: 'monospace', fontSize: 13 }}>{t.noClients}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {clients.map(c => (
                  <div key={c.id} style={{
                    background: 'white', border: '1px solid #D6D2C8', padding: isMobile ? '12px' : '16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: C.soft }}>{c.contact} {c.country ? `· ${c.country}` : ''}</div>
                    </div>
                    <button onClick={() => deleteClient(c.id)} style={{ ...smallBtn, background: '#B33A3A' }}>{t.delete}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isMobile && (
          <div style={{ textAlign: 'center', padding: '20px 0 40px', fontSize: 11, color: C.soft, fontFamily: 'monospace' }}>
            QUOTEFORGE — {lang === 'bg' ? 'ИНСТРУМЕНТ ЗА БЪЛГАРСКИ РАБОТИЛНИЦИ' : 'A TOOL FOR BULGARIAN WORKSHOPS'}
          </div>
        )}
      </div>
    </div>
  );
}
