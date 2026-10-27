import React, { useState, useEffect } from 'react';
import { Flame, CheckCircle2, Clock, Volume2, VolumeX, RefreshCw, Soup, UserCheck, Bell } from 'lucide-react';
import * as store from '../store';
import { playOrderSound, playServiceAlertSound } from '../utils/sound';

export default function KitchenView() {
  const [orders, setOrders] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const data = store.getState();
    setOrders(data.orders || []);
    setServiceRequests(data.serviceRequests || []);
  }, []);

  useEffect(() => {
    const unsubs = [
      store.on('order:new', (order) => {
        setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
        if (soundEnabled) playOrderSound();
      }),
      store.on('order:updated', (order) => {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
      }),
      store.on('service:new', (srv) => {
        setServiceRequests((prev) => [srv, ...prev.filter((s) => s.id !== srv.id)]);
        if (soundEnabled) playServiceAlertSound();
      }),
      store.on('service:updated', (srv) => {
        setServiceRequests((prev) => prev.map((s) => (s.id === srv.id ? srv : s)));
      }),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [soundEnabled]);

  const handleUpdateOrderStatus = (orderId, newStatus) => store.updateOrderStatus(orderId, newStatus);
  const handleResolveService = (reqId) => store.resolveServiceRequest(reqId);

  const activeOrders = orders.filter((o) => o.status !== 'served');
  const servedOrders = orders.filter((o) => o.status === 'served').slice(0, 8);
  const pendingServices = serviceRequests.filter((s) => s.status !== 'completed');

  const getTimeElapsed = (createdAt) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return minutes <= 0 ? 'เมื่อสักครู่' : `${minutes} นาทีที่แล้ว`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6 pb-20">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30"><Flame className="w-7 h-7" /></div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2"><span>จอห้องครัว & เตรียมของ (KDS)</span><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span></h1>
            <p className="text-xs text-zinc-400 mt-0.5">ระบบรับออเดอร์ Real-time สำหรับแผนกเตรียมเนื้อสัตว์และของทอด</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-zinc-400">ค้างจัด:</span><span className="font-bold text-orange-400 text-sm">{activeOrders.length}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">บริการด่วน:</span><span className="font-bold text-amber-400 text-sm">{pendingServices.length}</span>
          </div>
          <button onClick={() => { setSoundEnabled(!soundEnabled); if (!soundEnabled) playOrderSound(); }} className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition ${soundEnabled ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}<span>{soundEnabled ? 'เสียงเตือนเปิดอยู่' : 'ปิดเสียงเตือน'}</span>
          </button>
        </div>
      </header>
      {pendingServices.length > 0 && (
        <section className="mb-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider"><Bell className="w-4 h-4 animate-bounce" /><span>คำขอบริการเสริมเร่งด่วน ({pendingServices.length})</span></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingServices.map((srv) => (
              <div key={srv.id} className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex items-center justify-between shadow-lg shadow-amber-950/30 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
                    {srv.requestType === 'coal' && <Flame className="w-5 h-5 text-orange-400" />}
                    {srv.requestType === 'pan' && <RefreshCw className="w-5 h-5 text-amber-400" />}
                    {srv.requestType === 'soup' && <Soup className="w-5 h-5 text-yellow-400" />}
                    {srv.requestType === 'staff' && <UserCheck className="w-5 h-5 text-blue-400" />}
                  </div>
                  <div><div className="font-black text-sm text-amber-200">{srv.tableName}</div><div className="text-xs text-zinc-300 font-semibold">{srv.title}</div><div className="text-[10px] text-zinc-400">{getTimeElapsed(srv.createdAt)}</div></div>
                </div>
                <button onClick={() => handleResolveService(srv.id)} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition active:scale-95">✓ จัดการแล้ว</button>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2"><span>รายการสั่งอาหารที่ต้องจัดส่ง ({activeOrders.length})</span></h2>
        {activeOrders.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-zinc-900/50 border border-dashed border-zinc-800 text-zinc-500"><CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-zinc-600" /><div className="text-base font-semibold text-zinc-300">เคลียร์ออเดอร์หมดแล้ว!</div><div className="text-xs mt-1">ยังไม่มีออเดอร์ใหม่เข้ามาในระบบ</div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeOrders.map((ord) => {
              const isUrgent = (Date.now() - new Date(ord.createdAt).getTime()) > 5 * 60000;
              return (
                <div key={ord.id} className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all ${isUrgent ? 'bg-zinc-900/90 border-red-500/80 shadow-red-950/20' : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'}`}>
                  <div className={`p-4 border-b flex items-center justify-between ${isUrgent ? 'bg-red-950/30 border-red-900/40' : 'bg-zinc-800/40 border-zinc-800'}`}>
                    <div className="flex items-center gap-2"><span className="text-lg font-black text-white">{ord.tableName}</span><span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${ord.status === 'cooking' ? 'bg-blue-500/20 text-blue-300' : 'bg-orange-500/20 text-orange-300'}`}>{ord.status === 'cooking' ? 'กำลังจัดของ' : 'ออเดอร์ใหม่'}</span></div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono"><Clock className="w-3.5 h-3.5 text-zinc-500" /><span>{getTimeElapsed(ord.createdAt)}</span></div>
                  </div>
                  <div className="p-4 flex-1 space-y-2.5">{ord.items.map((it, idx) => (<div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/50 border border-zinc-700/40"><span className="text-sm font-semibold text-zinc-100">{it.name}</span><span className="text-base font-black text-orange-400 px-2.5 py-0.5 rounded-lg bg-orange-500/10 border border-orange-500/20">x{it.qty}</span></div>))}</div>
                  <div className="p-3 bg-zinc-950/60 border-t border-zinc-800 grid grid-cols-2 gap-2">
                    {ord.status === 'pending' ? <button onClick={() => handleUpdateOrderStatus(ord.id, 'cooking')} className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center justify-center gap-1"><span>กำลังจัดของ</span></button> : <button onClick={() => handleUpdateOrderStatus(ord.id, 'pending')} className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-bold transition">ย้อนกลับ</button>}
                    <button onClick={() => handleUpdateOrderStatus(ord.id, 'served')} className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1 active:scale-95"><CheckCircle2 className="w-4 h-4" /><span>เสิร์ฟแล้ว</span></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      {servedOrders.length > 0 && (
        <section className="pt-4 border-t border-zinc-800/80">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">เสิร์ฟแล้วล่าสุด ({servedOrders.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {servedOrders.map((ord) => (<div key={ord.id} className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-400"><div className="flex justify-between font-bold text-zinc-300"><span>{ord.tableName}</span><span className="text-emerald-400">✓ เสร็จแล้ว</span></div><div className="text-[11px] text-zinc-500 truncate mt-1">{ord.items.map((i) => `${i.name} (${i.qty})`).join(', ')}</div></div>))}
          </div>
        </section>
      )}
    </div>
  );
}
