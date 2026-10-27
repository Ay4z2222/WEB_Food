import React, { useState, useEffect } from 'react';
import { 
  Users, Clock, QrCode, CheckCircle, XCircle, AlertTriangle, 
  Settings2, Plus, RefreshCw, Sparkles, X, Printer, ExternalLink, Flame
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { socket } from '../socket';

export default function CashierView({ onOpenCustomerView }) {
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  
  // Selected table for actions
  const [activeModal, setActiveModal] = useState(null); // 'open' | 'qr' | 'stock'
  const [selectedTable, setSelectedTable] = useState(null);
  
  // Form state
  const [guestCount, setGuestCount] = useState(2);
  const [durationMins, setDurationMins] = useState(90);

  // Load initial data
  useEffect(() => {
    fetch('/api/state')
      .then((res) => res.json())
      .then((data) => {
        setTables(data.tables || []);
        setMenuItems(data.menuItems || []);
      })
      .catch((err) => console.error(err));
  }, []);

  // Socket listeners
  useEffect(() => {
    function handleTablesUpdated(updatedTables) {
      setTables(updatedTables);
      // Keep selectedTable updated if modal open
      if (selectedTable) {
        const found = updatedTables.find((t) => t.id === selectedTable.id);
        if (found) setSelectedTable(found);
      }
    }

    function handleMenuUpdated({ menuId, isAvailable }) {
      setMenuItems((prev) =>
        prev.map((m) => (m.id === menuId ? { ...m, isAvailable } : m))
      );
    }

    socket.on('tables:updated', handleTablesUpdated);
    socket.on('menu:updated', handleMenuUpdated);

    return () => {
      socket.off('tables:updated', handleTablesUpdated);
      socket.off('menu:updated', handleMenuUpdated);
    };
  }, [selectedTable]);

  // Open table action
  const handleOpenTable = () => {
    if (!selectedTable) return;
    socket.emit('table:open', {
      tableId: selectedTable.id,
      customerCount: guestCount,
      durationMinutes: durationMins,
    });
    setActiveModal('qr');
  };

  // Close / Checkout table
  const handleCloseTable = (tableId) => {
    if (confirm('ยืนยันการเช็คบิลและปิดโต๊ะนี้? (QR Code เดิมจะหมดอายุทันที)')) {
      socket.emit('table:close', { tableId });
      setActiveModal(null);
      setSelectedTable(null);
    }
  };

  // Toggle item stock
  const handleToggleStock = (menuId, currentAvailable) => {
    socket.emit('menu:toggle_stock', {
      menuId,
      isAvailable: !currentAvailable,
    });
  };

  // Calculate remaining time for a table
  const getTableTimeRemaining = (endTime) => {
    if (!endTime) return null;
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return { expired: true, text: 'หมดเวลา' };
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return { 
      expired: false, 
      text: `${mins}:${secs < 10 ? '0' : ''}${secs} น.` 
    };
  };

  // Generate Customer URL for QR
  const getCustomerUrl = (table) => {
    if (!table?.token) return '';
    const origin = window.location.origin;
    return `${origin}/?table=${table.id}&token=${table.token}&view=customer`;
  };

  // Counters
  const occupiedCount = tables.filter((t) => t.status === 'active').length;
  const availableCount = tables.length - occupiedCount;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6 pb-20">
      {/* CASHIER HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white">
              ระบบแคชเชียร์ & ผังโต๊ะ (Cashier POS)
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              เปิดโต๊ะบุฟเฟต์ 90 นาที, สร้าง QR Code และเช็คบิล
            </p>
          </div>
        </div>

        {/* Quick summary & Stock toggle button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-zinc-400">โต๊ะว่าง:</span>
            <span className="font-bold text-emerald-400 text-sm">{availableCount}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">กำลังทาน:</span>
            <span className="font-bold text-orange-400 text-sm">{occupiedCount}</span>
          </div>

          <button
            onClick={() => setActiveModal('stock')}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold flex items-center gap-2 transition"
          >
            <Settings2 className="w-4 h-4 text-orange-400" />
            <span>จัดการของหมด</span>
          </button>
        </div>
      </header>

      {/* TABLE GRID */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {tables.map((tbl) => {
          const isActive = tbl.status === 'active';
          const timeInfo = isActive ? getTableTimeRemaining(tbl.endTime) : null;
          const isTimeUp = timeInfo && timeInfo.expired;

          return (
            <div
              key={tbl.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between transition-all h-44 ${
                isActive
                  ? isTimeUp
                    ? 'bg-red-950/20 border-red-800 shadow-lg shadow-red-950/20'
                    : 'bg-zinc-900 border-orange-500/60 shadow-lg shadow-orange-950/20'
                  : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-white">{tbl.name}</span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isActive
                        ? isTimeUp
                          ? 'bg-red-500 animate-ping'
                          : 'bg-emerald-400 animate-pulse'
                        : 'bg-zinc-600'
                    }`}
                  ></span>
                </div>

                <div className="mt-2 text-xs">
                  {isActive ? (
                    <div>
                      <div className="text-zinc-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{tbl.customerCount} ท่าน</span>
                      </div>
                      <div
                        className={`mt-1 font-mono font-bold flex items-center gap-1 ${
                          isTimeUp ? 'text-red-400' : 'text-orange-400'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{timeInfo ? timeInfo.text : ''}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-zinc-500 font-medium">🟢 โต๊ะว่าง</span>
                  )}
                </div>
              </div>

              {/* Card Bottom CTA */}
              <div className="pt-2 border-t border-zinc-800/80">
                {isActive ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedTable(tbl);
                        setActiveModal('qr');
                      }}
                      className="py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1 transition"
                      title="ดู QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5 text-orange-400" />
                      <span>QR</span>
                    </button>
                    <button
                      onClick={() => handleCloseTable(tbl.id)}
                      className="py-1.5 px-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-semibold transition"
                    >
                      ปิดโต๊ะ
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedTable(tbl);
                      setGuestCount(2);
                      setActiveModal('open');
                    }}
                    className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition active:scale-95 flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เปิดโต๊ะ</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* MODAL: OPEN TABLE */}
      {activeModal === 'open' && selectedTable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>เปิด {selectedTable.name}</span>
                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-normal">
                  บุฟเฟต์หมูกระทะ
                </span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Guest Count Selector */}
            <div>
              <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">
                จำนวนลูกค้า (ท่าน):
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setGuestCount(num)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition ${
                      guestCount === num
                        ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Buffet Duration */}
            <div>
              <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">
                ระยะเวลารับประทาน:
              </label>
              <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-between text-sm">
                <span className="text-zinc-300 font-medium">บุฟเฟต์ราคาเดียว รวมทุกอย่าง</span>
                <span className="font-bold text-orange-400 font-mono">1 ชม. 30 นาที (90 น.)</span>
              </div>
            </div>

            <button
              onClick={handleOpenTable}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/25 transition active:scale-98"
            >
              ยืนยันเปิดโต๊ะ & สร้าง QR Code
            </button>
          </div>
        </div>
      )}

      {/* MODAL: QR CODE DISPLAY */}
      {activeModal === 'qr' && selectedTable && selectedTable.token && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="text-left">
                <h3 className="text-lg font-black text-white">{selectedTable.name}</h3>
                <p className="text-xs text-zinc-400">รหัสรอบ: #{selectedTable.token}</p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
              <QRCodeSVG
                value={getCustomerUrl(selectedTable)}
                size={210}
                level="M"
                includeMargin={false}
              />
            </div>

            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
              ให้ลูกค้านำมือถือสแกนเพื่อเริ่มสั่งอาหารบุฟเฟต์ (ระบบนับเวลา 90 นาทีอัตโนมัติ)
            </p>

            {/* Actions for testing */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setActiveModal(null);
                  onOpenCustomerView(selectedTable, selectedTable.token);
                }}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>จำลองลูกค้าสแกนโต๊ะนี้ (เปิดหน้าจอลูกค้า)</span>
              </button>

              <button
                onClick={() => window.print()}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์สลิป QR Code</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: OUT OF STOCK TOGGLER */}
      {activeModal === 'stock' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="bg-zinc-900 border-l border-zinc-800 w-full max-w-md h-full p-5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="font-bold text-lg text-white">จัดการสถานะอาหาร</h3>
                <p className="text-xs text-zinc-400">ปิด-เปิดสถานะของหมดได้ทันที (ซิงก์ไปที่มือถือลูกค้าสดๆ)</p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2 divide-y divide-zinc-800/60">
              {menuItems.map((item) => (
                <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover bg-zinc-800"
                    />
                    <div>
                      <div className="text-sm font-semibold text-zinc-200">{item.name}</div>
                      <div className="text-xs text-zinc-500">
                        {item.isAvailable ? '🟢 กำลังขาย' : '🔴 ของหมด'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleStock(item.id, item.isAvailable)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      item.isAvailable
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-red-950/60 hover:text-red-300 border border-zinc-700'
                        : 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-emerald-950/60 hover:text-emerald-300'
                    }`}
                  >
                    {item.isAvailable ? 'กดตั้งเป็นของหมด' : 'กดเปิดขาย'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
