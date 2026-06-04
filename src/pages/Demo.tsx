import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, RotateCcw, MessageCircle, Bot, MapPin, Headphones, BarChart3, Settings } from 'lucide-react';
import { MONEDAS, SECTORS, FLOWS, FALLBACKS } from '../data/demoData';
import type { Moneda, Sector, Tipo, DemoFlow, DemoMsg } from '../types/demo';
import Navbar from '../components/Navbar';

function fmtM(val: number, mon: Moneda) {
  return new Intl.NumberFormat(mon.locale, { style: 'currency', currency: mon.code, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val * mon.mult);
}

function renderMsgText(t: string) {
  return t.replace(/\*(.*?)\*/g, '<strong class="text-orange-300">$1</strong>').replace(/\n/g, '<br>');
}

function buildAudio(_aud: string, _isBot: boolean) {
  const heights = [4, 6, 10, 14, 18, 14, 20, 24, 18, 14, 10, 18, 14, 10, 16, 12, 8, 5];
  return `<div class="flex items-center gap-2 min-w-[160px] bg-[#1E293B] rounded-xl px-3 py-2">
    <div class="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
    </div>
    <div class="flex-1 h-6 flex items-center gap-0.5">
      ${heights.map((h, i) => `<div class="w-[3px] rounded-sm bg-gradient-to-b from-orange-500/80 to-orange-400/40 animate-pulse" style="height:${h}px;animation-delay:${i * 0.06}s"></div>`).join('')}
    </div>
    <span class="text-[10.5px] text-gray-400 font-semibold whitespace-nowrap">${_aud}</span>
  </div>`;
}

function buildPdf(pdf: NonNullable<DemoMsg['pdf']>) {
  return `<div class="flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-xl px-3 py-2.5 min-w-[170px] cursor-pointer">
    <div class="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-2 4h4v1h-4v-1zm0 2h6v1h-6v-1zm0-4h2v1h-2v-1z"/></svg>
    </div>
    <div><div class="text-xs font-bold text-gray-100">${pdf.nm}</div><div class="text-[10px] text-gray-500">${pdf.sz} · PDF${pdf.dc ? ' · ' + pdf.dc : ''}</div></div>
  </div>`;
}

function buildLoc(loc: NonNullable<DemoMsg['loc']>) {
  return `<div class="rounded-xl overflow-hidden w-[170px] cursor-pointer border border-[#334155]">
    <div class="h-20 bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 flex items-center justify-center text-2xl">${loc.em}</div>
    <div class="px-2 py-1.5 text-[11px] text-gray-400 font-semibold bg-[#0F172A]">${loc.addr}</div>
  </div>`;
}

function renderMsg(msg: DemoMsg, isBot: boolean, tm: string): string {
  const cls = isBot ? 'self-start bg-[#1E293B] rounded-2xl rounded-tl-sm' : 'self-end bg-emerald-900/40 border border-emerald-700/30 rounded-2xl rounded-tr-sm';
  let html = `<div class="max-w-[88%] ${cls} shadow-sm px-3 py-2.5">`;
  if (msg.t) {
    html += `<div class="text-[12.5px] text-gray-100 leading-relaxed">${renderMsgText(msg.t)}</div>`;
  }
  if (msg.list) {
    html += `<div class="flex flex-col gap-1 mt-1.5">${msg.list.map(item => `<div class="flex items-start gap-1.5 text-xs text-gray-200"><div class="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div><span>${renderMsgText(item)}</span></div>`).join('')}</div>`;
  }
  if (msg.audio) {
    html += buildAudio(msg.audio, isBot);
  }
  if (msg.img) {
    html += `<div class="rounded-xl overflow-hidden cursor-pointer mb-1 max-w-[190px]">
      ${msg.img.url
        ? `<img src="${msg.img.url}" loading="lazy" class="w-[190px] h-[120px] object-cover block rounded-xl" alt="">`
        : `<div class="w-[190px] h-[120px] flex items-center justify-center text-3xl rounded-xl" style="background:${msg.img.bg}">${msg.img.em || ''}</div>`}
      <div class="text-[11px] text-gray-400 mt-1 px-0.5">${msg.img.cap || ''}</div>
    </div>`;
  }
  if (msg.pdf) {
    html += buildPdf(msg.pdf);
  }
  if (msg.loc) {
    html += buildLoc(msg.loc);
  }
  if (msg.bt) {
    html += `<div class="flex flex-col gap-1 mt-1.5">${msg.bt.map(b => `<div class="bg-[#0F172A] border border-orange-500/20 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-orange-400 text-center cursor-default">${b}</div>`).join('')}</div>`;
  }
  html += `<div class="flex items-center gap-1 mt-1 ${isBot ? 'justify-start' : 'justify-end'}">
    <span class="text-[9px] text-gray-500">${tm}</span>
    ${!isBot ? '<span class="text-emerald-400 text-[10px]">✓✓</span>' : ''}
  </div>`;
  html += '</div>';
  return html;
}

const STATUS_BADGES: Record<string, string> = {
  sd: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  sg2: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  sn3: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  sp: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  sr: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function Demo() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<'setup' | 'demo'>('setup');
  const [moneda, setMoneda] = useState<Moneda>(MONEDAS[0]);
  const [sector, setSector] = useState<Sector | null>(null);
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [bizName, setBizName] = useState('');
  const [flow, setFlow] = useState<DemoFlow | null>(null);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<'panel' | 'dash'>('panel');
  const [messages, setMessages] = useState<string[]>([]);
  const [typingIdx, setTypingIdx] = useState<number | null>(null);
  const [finalized, setFinalized] = useState(false);
  const [feedItems, setFeedItems] = useState<string[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, typingIdx]);

  function handleSelectMoneda(m: Moneda) {
    setMoneda(m);
  }

  function handleSelectSector(s: Sector) {
    setSector(s);
    setTipo(null);
  }

  function handleSelectTipo(t: Tipo) {
    setTipo(t);
  }

  function handleLaunch() {
    if (!sector || !tipo) return;
    const biz = bizName.trim() || sector.nm;
    const key = sector.id + '-' + tipo.id;
    const fkey = FLOWS[key] ? key : (FALLBACKS[key] || 'comercio-ventas');
    const f = FLOWS[fkey](biz, moneda);
    setFlow(f);
    setMessages([]);
    setRunning(false);
    setFinalized(false);
    setFeedItems([]);
    setScreen('demo');
  }

  function handleReconfig() {
    clearTimers();
    setScreen('setup');
    setRunning(false);
    setMessages([]);
    setFinalized(false);
    setFeedItems([]);
  }

  function handleStart() {
    if (running || !flow) return;
    setRunning(true);
    setMessages([]);
    setFeedItems([]);
    setFinalized(false);

    const msgs = flow.msgs;
    const timers: ReturnType<typeof setTimeout>[] = [];

    msgs.forEach((msg, idx) => {
      const isBot = msg.f === 'i';
      if (isBot) {
        const t1 = setTimeout(() => {
          setTypingIdx(idx);
        }, msg.d);
        timers.push(t1);

        const t2 = setTimeout(() => {
          setTypingIdx(null);
          const now = new Date();
          const tm = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
          setMessages(prev => [...prev, renderMsg(msg, true, tm)]);
          if (idx === Math.floor(msgs.length / 2)) {
            setFeedItems(flow.feed);
          }
          if (idx === msgs.length - 1) {
            setFinalized(true);
          }
        }, msg.d + 1400);
        timers.push(t2);
      } else {
        const t = setTimeout(() => {
          const now = new Date();
          const tm = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
          const isOut = msg.isOut || (!msg.f || msg.f === 'o');
          setMessages(prev => [...prev, renderMsg(msg, false, tm)]);
        }, msg.d);
        timers.push(t);
      }
    });

    timersRef.current = timers;
  }

  function handleReset() {
    clearTimers();
    setRunning(false);
    setMessages([]);
    setFeedItems([]);
    setFinalized(false);
  }

  function getFlowKey(): string {
    if (!sector || !tipo) return '';
    return sector.id + '-' + tipo.id;
  }

  let opsHtml = '';
  let funnelData: number[] = [];
  if (flow && (feedItems.length > 0 || running)) {
    const ops = flow.ops(bizName.trim() || sector?.nm || '');
    opsHtml = ops.map(op => `
      <div class="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3.5 animate-fadeIn">
        <div class="flex items-center justify-between mb-2">
          <div class="font-bold text-[13px] text-gray-100 uppercase tracking-[.3px]">${op.t}</div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGES[op.st] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}">${op.lb}</span>
        </div>
        ${op.rows.map(r => `<div class="flex justify-between items-center text-[12.5px] text-gray-400 mb-1 gap-2"><span>${r[0]}</span><span class="font-semibold text-gray-200 text-right">${r[1]}</span></div>`).join('')}
        ${op.p ? `<div class="mt-2.5"><div class="flex justify-between text-[10.5px] text-gray-500 mb-1"><span>${op.p.l}</span><span>${op.p.pc}%</span></div><div class="h-1.5 bg-[#1E293B] rounded overflow-hidden"><div class="h-full rounded bg-gradient-to-r from-orange-500 to-emerald-500 transition-all duration-700" style="width:${op.p.pc}%"></div></div></div>` : ''}
      </div>
    `).join('');
    funnelData = [1, 1, 0, 0];
    if (finalized) {
      funnelData = [1, 1, 1, 1];
    }
  }

  const dashHtml = flow ? `
    <div class="bg-gradient-to-br from-[#0F172A] to-[#1a2332] border border-orange-500/20 rounded-xl p-4 flex items-center justify-between shadow-lg">
      <div><div class="font-black text-3xl text-white" id="khv">${finalized ? '1' : '0'}</div>
      <div class="font-bold text-[9.5px] uppercase tracking-[1.2px] text-gray-500 mt-1">${flow.hero.l}</div>
      <div class="text-[11px] ${finalized ? 'text-emerald-400 font-bold' : 'text-gray-600'} mt-1">${finalized ? 'AVA procesó en tiempo real ↑' : 'Esperando datos...'}</div></div>
      <div class="text-3xl">${flow.hero.ic}</div>
    </div>
    <div class="grid grid-cols-2 gap-2">
      ${flow.kpis.map(k => `<div class="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3"><div class="font-black text-2xl text-gray-100 ${k.c === 'bl' ? 'text-orange-400' : k.c === 'gr' ? 'text-emerald-400' : k.c === 'am' ? 'text-amber-400' : k.c === 'te' ? 'text-cyan-400' : ''}">${k.v}</div><div class="font-bold text-[9.5px] uppercase tracking-[1px] text-gray-500 mt-1">${k.l}</div><div class="text-[10.5px] text-gray-600 mt-0.5">${k.s}</div></div>`).join('')}
    </div>
    <div class="bg-[#0F172A] border border-[#1E293B] rounded-xl overflow-hidden">
      <div class="px-3.5 py-2 bg-[#111827] border-b border-[#1E293B] flex items-center justify-between">
        <div class="font-bold text-[11px] text-gray-100 uppercase tracking-[.3px]">Embudo · ${tipo?.nm || ''}</div>
        <div class="text-[10px] text-gray-500">AVA · CCG</div>
      </div>
      ${flow.fn.map((fi, i) => `<div class="flex items-center gap-2 px-3.5 py-2 border-b border-[#1E293B] last:border-b-0">
        <div class="text-[11.5px] text-gray-400 min-w-[88px] flex-shrink-0">${fi.l}</div>
        <div class="flex-1 h-1.5 bg-[#1E293B] rounded overflow-hidden"><div class="h-full rounded transition-all duration-700" style="width:${finalized ? '100' : funnelData[i] ? '65' : '0'}%;background:${fi.cl}"></div></div>
        <div class="font-extrabold text-sm text-gray-100 min-w-[18px] text-right">${finalized || funnelData[i] ? (funnelData[i] || '1') : '0'}</div>
      </div>`).join('')}
    </div>
  ` : '';

  const col3Content = finalized ? flow ? `
    <div class="bg-gradient-to-br from-[#0F172A] to-[#1a2332] border border-orange-500/20 rounded-xl p-4 flex items-center justify-between shadow-lg">
      <div><div class="font-black text-3xl text-white">${flow.hero.v}</div>
      <div class="font-bold text-[9.5px] uppercase tracking-[1.2px] text-gray-500 mt-1">${flow.hero.l}</div>
      <div class="text-[11px] text-emerald-400 font-bold mt-1">AVA procesó en tiempo real ↑</div></div>
      <div class="text-3xl">${flow.hero.ic}</div>
    </div>
    <div class="grid grid-cols-2 gap-2">
      ${flow.kpis.map(k => `<div class="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3"><div class="font-black text-2xl text-gray-100 ${k.c === 'bl' ? 'text-orange-400' : k.c === 'gr' ? 'text-emerald-400' : k.c === 'am' ? 'text-amber-400' : k.c === 'te' ? 'text-cyan-400' : ''}">${k.v}</div><div class="font-bold text-[9.5px] uppercase tracking-[1px] text-gray-500 mt-1">${k.l}</div><div class="text-[10.5px] text-gray-600 mt-0.5">${k.s}</div></div>`).join('')}
    </div>
    <div class="bg-[#0F172A] border border-[#1E293B] rounded-xl overflow-hidden">
      <div class="px-3.5 py-2 bg-[#111827] border-b border-[#1E293B] flex items-center justify-between">
        <div class="font-bold text-[11px] text-gray-100 uppercase tracking-[.3px]">Embudo · ${tipo?.nm || ''}</div>
        <div class="text-[10px] text-gray-500">AVA · CCG</div>
      </div>
      ${flow.fn.map((fi) => `<div class="flex items-center gap-2 px-3.5 py-2 border-b border-[#1E293B] last:border-b-0">
        <div class="text-[11.5px] text-gray-400 min-w-[88px] flex-shrink-0">${fi.l}</div>
        <div class="flex-1 h-1.5 bg-[#1E293B] rounded overflow-hidden"><div class="h-full rounded" style="width:100%;background:${fi.cl}"></div></div>
        <div class="font-extrabold text-sm text-gray-100 min-w-[18px] text-right">1</div>
      </div>`).join('')}
    </div>
    <div class="text-[10px] font-bold uppercase tracking-[1.2px] text-gray-500 mt-1">Actividad Reciente</div>
    <div class="flex flex-col gap-1.5">
      ${['Conversación completada — sin escalación', 'AVA resolvió el 100% de forma autónoma', 'Datos sincronizados en tiempo real · CRM', 'CSAT enviado al cliente via WhatsApp'].map(txt =>
        `<div class="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-[#0F172A] border border-[#1E293B]"><div class="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0"></div><div class="text-[11.5px] text-gray-200 flex-1"><strong class="text-gray-100">AVA</strong> · ${txt}</div><div class="text-[10px] text-gray-600">ahora</div></div>`
      ).join('')}
    </div>
  ` : '' : '<div class="text-center py-6 text-gray-500 text-[13px] border border-dashed border-[#1E293B] rounded-xl">Inicia el demo para ver métricas en tiempo real.</div>';

  return (
    <div className="min-h-screen bg-[#090D16] text-[#E2E8F0] font-sans flex flex-col selection:bg-orange-500 selection:text-white">
      <Navbar />

      {screen === 'setup' && (
        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto bg-gradient-to-br from-[#090D16] via-[#0B1424] to-[#090D16]">
          <div className="max-w-[940px] w-full animate-[fadeUp_0.6s_ease-out]">
            <div className="flex flex-col items-center mb-7">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#1a2332] to-[#0F172A] flex items-center justify-center shadow-lg shadow-orange-500/10 border border-orange-500/20 relative mb-4">
                <div className="absolute inset-0.5 rounded-2xl bg-gradient-to-br from-orange-500/5 to-transparent"></div>
                <Bot className="w-14 h-14 text-orange-400" />
              </div>
              <div className="flex items-center gap-2 bg-[#0F172A] border border-orange-500/20 text-orange-400 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[1px] shadow-md">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></div>
                DEMO AVA CHAT · WhatsApp · CCG
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="font-black text-4xl uppercase tracking-[-.3px] leading-tight mb-2 text-white">
                Configura tu demo en <em className="not-italic text-orange-500">30 segundos</em>
              </h1>
              <p className="text-sm text-gray-400 max-w-[560px] mx-auto">Selecciona sector, tipo de conversación y moneda — AVA genera un demo WhatsApp completo con audio, imágenes, PDFs y más.</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[1.2px] text-white mb-3">
                <span className="w-5.5 h-5.5 rounded-full bg-orange-500 text-white text-[11px] inline-flex items-center justify-center font-extrabold flex-shrink-0">$</span>
                Moneda de operación
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                {MONEDAS.map(m => (
                  <button key={m.id} onClick={() => handleSelectMoneda(m)}
                    className={`flex items-center gap-1.5 px-4 py-2 border rounded-full text-[13px] font-bold cursor-pointer transition-all duration-200 tracking-[.5px] shadow-sm font-sans ${
                      moneda.id === m.id
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : 'border-[#334155] bg-[#0F172A] text-gray-400 hover:border-orange-500 hover:text-orange-400 hover:bg-orange-500/5'
                    }`}>
                    <span className="text-base">{m.flag}</span>
                    <span className="text-lg font-black">{m.sym}</span>
                    {m.nm}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[1.2px] text-white mb-3">
                <span className="w-5.5 h-5.5 rounded-full bg-orange-500 text-white text-[11px] inline-flex items-center justify-center font-extrabold flex-shrink-0">1</span>
                Cuál es el sector del cliente?
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-2.5">
                {SECTORS.map(s => (
                  <div key={s.id} onClick={() => handleSelectSector(s)}
                    className={`bg-[#0F172A] border-2 rounded-xl p-4 text-center cursor-pointer transition-all duration-200 flex flex-col items-center gap-1.5 relative overflow-hidden ${
                      sector?.id === s.id
                        ? 'border-orange-500 bg-orange-500/5 shadow-lg shadow-orange-500/10'
                        : 'border-[#1E293B] hover:border-orange-500/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/5'
                    }`}>
                    <div className="text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,.3)]">{s.ic}</div>
                    <div className="font-bold text-[12.5px] text-gray-100 leading-tight">{s.nm}</div>
                    <div className="text-[10px] text-gray-500 leading-tight">{s.sb}</div>
                  </div>
                ))}
              </div>
            </div>

            {sector && (
              <div className="mb-6 animate-[fadeUp_0.3s_ease-out]" id="step2">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[1.2px] text-white mb-3">
                  <span className="w-5.5 h-5.5 rounded-full bg-orange-500 text-white text-[11px] inline-flex items-center justify-center font-extrabold flex-shrink-0">2</span>
                  Qué tipo de conversación quieres demostrar?
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
                  {sector.tipos.map(t => (
                    <div key={t.id} onClick={() => handleSelectTipo(t)}
                      className={`bg-[#0F172A] border-2 rounded-xl px-3.5 py-3 cursor-pointer transition-all duration-200 flex items-center gap-2.5 ${
                        tipo?.id === t.id
                          ? 'border-orange-500 bg-orange-500/5'
                          : 'border-[#1E293B] hover:border-orange-500/30 hover:bg-orange-500/5'
                      }`}>
                      <div className="text-xl flex-shrink-0">{t.ic}</div>
                      <div><div className="text-[13px] font-bold text-gray-100">{t.nm}</div><div className="text-[10.5px] text-gray-500 mt-0.5">{t.dc}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tipo && (
              <div className="mb-6 animate-[fadeUp_0.3s_ease-out]" id="step3">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[1.2px] text-white mb-3">
                  <span className="w-5.5 h-5.5 rounded-full bg-orange-500 text-white text-[11px] inline-flex items-center justify-center font-extrabold flex-shrink-0">3</span>
                  Nombre del cliente / negocio (opcional)
                </div>
                <input type="text" value={bizName} onChange={e => setBizName(e.target.value.slice(0, 44))}
                  placeholder="ej: Hotel Grand Coral, Concesionario Vertex, Universidad Nacional…"
                  className="w-full px-4 py-3 border-2 border-[#334155] rounded-xl bg-[#0F172A] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,.1)] transition-all" />
              </div>
            )}

            {tipo && (
              <button onClick={handleLaunch}
                className="w-full py-4 border-none rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-white font-black text-lg tracking-[1px] uppercase cursor-pointer transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-orange-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/40 animate-pulse">
                <MessageCircle className="w-5.5 h-5.5 fill-white" />
                Iniciar Demo AVA WhatsApp
              </button>
            )}
          </div>
        </div>
      )}

      {screen === 'demo' && flow && (
        <>
          <div className="h-14 flex-shrink-0 bg-[#0F172A] border-b border-orange-500/10 shadow-lg flex items-center px-4 gap-3 z-50">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a2332] to-[#0F172A] flex items-center justify-center border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,.15)]">
              <Bot className="w-5.5 h-5.5 text-orange-400" />
            </div>
            <div>
              <div className="font-bold text-[17px] tracking-[1px] uppercase leading-tight font-sans">
                DEMO AVA CHAT <span className="text-orange-400">· WhatsApp</span>
              </div>
              <div className="text-[10px] text-gray-600">CCG · Contact Center Grupo · WhatsApp Business API</div>
            </div>
            <div className="w-px h-7 bg-[#1E293B]"></div>
            <div className="font-bold text-[11px] uppercase tracking-[.5px] bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full border border-orange-500/20 whitespace-nowrap">{sector?.ic} {sector?.nm} · {tipo?.nm}</div>
            <div className="font-bold text-[11px] bg-white/5 text-gray-500 px-2.5 py-1 rounded-full border border-white/10 whitespace-nowrap">{moneda.flag} {moneda.nm} ({moneda.sym})</div>

            <div className="flex gap-0.5 bg-white/5 rounded-lg p-0.5 ml-auto">
              <button onClick={() => setTab('panel')}
                className={`font-bold text-[11px] uppercase tracking-[.5px] px-3 py-1 rounded-md border-none cursor-pointer transition-all ${
                  tab === 'panel' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'text-gray-500 hover:text-gray-300 bg-transparent'
                }`}>
                <Settings className="w-3.5 h-3.5 inline mr-1" />Panel
              </button>
              <button onClick={() => setTab('dash')}
                className={`font-bold text-[11px] uppercase tracking-[.5px] px-3 py-1 rounded-md border-none cursor-pointer transition-all ${
                  tab === 'dash' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'text-gray-500 hover:text-gray-300 bg-transparent'
                }`}>
                <BarChart3 className="w-3.5 h-3.5 inline mr-1" />Dashboard
              </button>
            </div>

            <div className="flex gap-1.5 ml-2 items-center">
              <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full px-3 py-1 text-[11px] font-bold">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                En vivo
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full px-3 py-1 text-[11px] font-bold">{flow.lbl}</div>
              <button onClick={handleReconfig}
                className="bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg px-3 py-1 text-[12px] font-bold cursor-pointer hover:bg-orange-500/20 transition-all">
                <Settings className="w-3 h-3 inline mr-1" />Cambiar sector
              </button>
            </div>
          </div>

          <div className="flex flex-1 min-h-0 overflow-hidden">
            <div className="flex-[0_0_310px] bg-[#111827] flex flex-col border-r border-[#1E293B]">
              <div className="h-9 flex-shrink-0 bg-[#0F172A] border-b border-[#1E293B] flex items-center px-3.5 gap-2">
                <div className="font-bold text-[10.5px] tracking-[1.4px] uppercase text-gray-500">📱 WhatsApp · {flow.c1}</div>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10B981] animate-pulse"></div>
                  <span className="text-[10px] text-gray-500 font-semibold">Conectado</span>
                </div>
              </div>
              <div className="flex-1 min-h-0 flex flex-col p-2.5 gap-2 overflow-hidden">
                <div className="flex gap-1.5">
                  <button onClick={handleStart} disabled={running}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-amber-500 text-white border-none rounded-lg font-bold text-[13px] tracking-[.6px] uppercase px-3 py-2 cursor-pointer shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30 disabled:opacity-35 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-1.5">
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Iniciar
                  </button>
                  <button onClick={handleReset}
                    className="bg-[#0F172A] text-gray-400 border border-[#1E293B] rounded-lg text-[13px] font-bold px-3 py-2 cursor-pointer transition-all hover:border-orange-500 hover:text-orange-400">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-[256px] flex-1 min-h-0 border-[5px] border-gray-900 rounded-3xl flex flex-col overflow-hidden shadow-2xl self-center bg-[#0A0F1A] relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-b-xl z-10"></div>
                  <div className="bg-[#0F172A] pt-6 pb-2.5 px-3 flex items-center gap-2 flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a2332] to-[#0F172A] flex items-center justify-center border-2 border-orange-500/30 shadow-[0_0_6px_rgba(249,115,22,.2)] relative flex-shrink-0">
                      <Bot className="w-5 h-5 text-orange-400" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#0F172A]"></div>
                    </div>
                    <div><div className="font-bold text-[12.5px] text-white tracking-[.3px]">{bizName.trim() || sector?.nm || ''} · AVA</div><div className="text-[9.5px] text-gray-500">{flow.wst}</div></div>
                  </div>
                  <div ref={chatRef} className="flex-1 min-h-0 overflow-y-auto p-2.5 flex flex-col gap-1 bg-[#0A0F1A] bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:16px_16px] whatsapp-scrollbar">
                    {messages.map((html, i) => (
                      <div key={i} dangerouslySetInnerHTML={{ __html: html }} className="animate-[slideMsg_0.22s_ease-out]" />
                    ))}
                    {typingIdx !== null && (
                      <div className="self-start bg-[#1E293B] rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex gap-1 items-center shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-[dotPulse_1.2s_infinite_0s]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-[dotPulse_1.2s_infinite_0.22s]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-[dotPulse_1.2s_infinite_0.44s]"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0 bg-[#090D16] flex flex-col">
              <div className="h-9 flex-shrink-0 bg-[#0F172A] border-b border-[#1E293B] flex items-center px-3.5 gap-2">
                <div className="font-bold text-[10.5px] tracking-[1.4px] uppercase text-gray-500">
                  {tab === 'panel' ? '⚙️ ' + flow.c2 : '📊 ' + flow.c3}
                </div>
                <div className="ml-auto"><span className="text-[10px] text-gray-500 font-semibold">{tab === 'panel' ? 'Tiempo real · AVA CCG' : 'AVA · CCG Live'}</span></div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-3.5 flex flex-col gap-3 whatsapp-scrollbar">
                {tab === 'panel' ? (
                  running || feedItems.length > 0 ? (
                    <>
                      <div dangerouslySetInnerHTML={{ __html: opsHtml }} />
                      {feedItems.length > 0 && (
                        <>
                          <div className="text-[10px] font-bold uppercase tracking-[1.2px] text-gray-500 mt-1">Actividad en Tiempo Real</div>
                          <div className="flex flex-col gap-1.5">
                            {feedItems.map((ft, i) => {
                              const colors = ['bg-orange-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500'];
                              return (
                                <div key={i} className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-[#0F172A] border border-[#1E293B] opacity-100 translate-x-0 transition-all duration-350">
                                  <div className={`w-2 h-2 rounded-full ${colors[i % 4]} mt-1 flex-shrink-0`}></div>
                                  <div className="text-xs text-gray-200 flex-1"><strong className="text-gray-100">AVA</strong> {ft}</div>
                                  <div className="text-[10px] text-gray-600 pt-0.5">ahora</div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6 text-gray-500 text-[13px] border border-dashed border-[#1E293B] rounded-xl">
                      Inicia la conversación para ver el panel operativo en tiempo real.
                    </div>
                  )
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: dashHtml }} />
                )}
              </div>
            </div>

            <div className={`flex-[0_0_292px] bg-[#090D16] flex-col border-l border-[#1E293B] lg:flex ${tab === 'dash' ? 'hidden' : 'flex'}`}>
              <div className="h-9 flex-shrink-0 bg-[#0F172A] border-b border-[#1E293B] flex items-center px-3.5 gap-2">
                <div className="font-bold text-[10.5px] tracking-[1.4px] uppercase text-gray-500">📊 Dashboard · Métricas</div>
                <div className="ml-auto"><span className="text-[10px] text-gray-500 font-semibold">AVA · CCG Live</span></div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-3.5 flex flex-col gap-2.5 whatsapp-scrollbar">
                <div dangerouslySetInnerHTML={{ __html: col3Content }} />
              </div>
            </div>
          </div>

          <div className="h-8 flex-shrink-0 bg-[#0F172A] border-t border-orange-500/10 flex items-center justify-between px-4">
            <div className="flex items-center gap-1.5 font-bold text-[10.5px] tracking-[.6px] text-gray-600 uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></div>
              DEMO AVA CHAT · WhatsApp · CCG · Contact Center Grupo
            </div>
            <div className="text-[10px] text-gray-700">Demo comercial · Datos ficticios · <span className="text-gray-600">{sector?.nm} · {tipo?.nm}</span></div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideMsg { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dotPulse { 0%,80%,100% { transform: scale(.55); opacity: .3; } 40% { transform: scale(1); opacity: 1; } }
        @keyframes animate-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: animate-fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}
