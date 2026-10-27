import React, { useState, useEffect } from 'react';
import { 
  Flame, Salad, UtensilsCrossed, CupSoda, IceCream, Bell, 
  Plus, Minus, ShoppingBag, Clock, AlertTriangle, CheckCircle2, 
  History, Info, ChevronRight, X, Sparkles, RefreshCw, Soup, UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { socket } from '../socket';

export default function CustomerView({ table, token, onSwitchToCashier }) {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [activeCategory, setActiveCategory] = useState('meat');
  
  // Cart state: { [menuId]: quantity }
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);

  // Orders & Service Requests history
  const [myOrders, setMyOrders] = useState([]);
  const [myServices, setMyServices] = useState([]);

  // Timer state
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  // Status message
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch initial session & sync
  useEffect(() => {
    if (!table?.id || !token) return;

    fetch(`/api/session/${table.id}/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error('Session invalid');
        return res.json();
      })
      .then((data) => {
        setCategories(data.categories || []);
        setMenuItems(data.menuItems || []);
        setServiceTypes(data.serviceTypes || []);
        setMyOrders(data.orders || []);
        setMyServices(data.serviceRequests || []);
        
        const remSec = Math.floor(data.remainingMs / 1000);
        setRemainingSeconds(remSec);
        setIsExpired(remSec <= 0);
      })
      .catch((err) => {
        console.error(err);
        setIsExpired(true);
      });
  }, [table?.id, token]);

  // Real-time Socket listeners
  useEffect(() => {
    function handleOrderNew(order) {
      if (order.tableId === table?.id && order.token === token) {
        setMyOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
      }
    }

    function handleOrderUpdated(order) {
      if (order.tableId === table?.id && order.token === token) {
        setMyOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
      }
    }

    function handleServiceNew(srv) {
      if (srv.tableId === table?.id && srv.token === token) {
        setMyServices((prev) => [srv, ...prev.filter((s) => s.id !== srv.id)]);
      }
    }

    function handleServiceUpdated(srv) {
      if (srv.tableId === table?.id && srv.token === token) {
        setMyServices((prev) => prev.map((s) => (s.id === srv.id ? srv : s)));
      }
    }

    function handleMenuUpdated({ menuId, isAvailable }) {
      setMenuItems((prev) =>
        prev.map((item) => (item.id === menuId ? { ...item, isAvailable } : item))
      );
    }

    function handleSessionInvalidated({ tableId }) {
      if (tableId === table?.id) {
        setIsExpired(true);
      }
    }

    socket.on('order:new', handleOrderNew);
    socket.on('order:updated', handleOrderUpdated);
    socket.on('service:new', handleServiceNew);
    socket.on('service:updated', handleServiceUpdated);
    socket.on('menu:updated', handleMenuUpdated);
    socket.on('session:invalidated', handleSessionInvalidated);

    return () => {
      socket.off('order:new', handleOrderNew);
      socket.off('order:updated', handleOrderUpdated);
      socket.off('service:new', handleServiceNew);
      socket.off('service:updated', handleServiceUpdated);
      socket.off('menu:updated', handleMenuUpdated);
      socket.off('session:invalidated', handleSessionInvalidated);
    };
  }, [table?.id, token]);

  // Server-synced countdown timer (1 second interval)
  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  // Toast notification
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Format seconds into MM:SS or HH:MM:SS
  const formatTime = (secs) => {
    if (secs === null || secs <= 0) return '00:00';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // Cart operations
  const updateCartQty = (menuId, delta) => {
    if (isExpired) return;
    setCart((prev) => {
      const current = prev[menuId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[menuId];
        return copy;
      }
      return { ...prev, [menuId]: next };
    });
  };

  const totalCartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  // Submit Order to Kitchen
  const handleSubmitOrder = () => {
    if (totalCartCount === 0 || isExpired) return;

    const items = Object.entries(cart).map(([menuId, qty]) => {
      const item = menuItems.find((m) => m.id === menuId);
      return {
        menuId,
        name: item ? item.name : 'อาหาร',
        qty,
      };
    });

    socket.emit('order:create', {
      tableId: table.id,
      token,
      items,
    });

    // Fun confetti burst
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.85 },
      colors: ['#f97316', '#eab308', '#22c55e'],
    });

    setCart({});
    setIsCartOpen(false);
    showToast('🎉 ส่งออเดอร์เข้าครัวเรียบร้อยแล้ว!');
  };

  // Request Service
  const handleRequestService = (requestType, title) => {
    if (isExpired) return;

    socket.emit('service:request', {
      tableId: table.id,
      token,
      requestType,
    });

    setIsServiceOpen(false);
    showToast(`🔔 ส่งคำขอ "${title}" แล้ว พนักงานกำลังมาครับ`);
  };

  // Icon mapping
  const renderCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-4 h-4" />;
      case 'Salad': return <Salad className="w-4 h-4" />;
      case 'UtensilsCrossed': return <UtensilsCrossed className="w-4 h-4" />;
      case 'CupSoda': return <CupSoda className="w-4 h-4" />;
      case 'IceCream': return <IceCream className="w-4 h-4" />;
      case 'Bell': return <Bell className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const renderServiceIcon = (iconName) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-6 h-6 text-orange-400" />;
      case 'RefreshCw': return <RefreshCw className="w-6 h-6 text-amber-400" />;
      case 'Soup': return <Soup className="w-6 h-6 text-yellow-400" />;
      case 'UserCheck': return <UserCheck className="w-6 h-6 text-blue-400" />;
      default: return <Bell className="w-6 h-6 text-orange-400" />;
    }
  };

  if (!table) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-zinc-950 text-zinc-200">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold mb-2">ยังไม่ได้เลือกหรือเปิดโต๊ะ</h2>
        <p className="text-zinc-400 mb-6 max-w-xs">
          กรุณาไปที่หน้าจอแคชเชียร์เพื่อเปิดโต๊ะและรับ QR Code สแกนเข้าสู่ระบบ
        </p>
        <button
          onClick={onSwitchToCashier}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-medium transition"
        >
          ไปที่หน้าจอแคชเชียร์ (เปิดโต๊ะ)
        </button>
      </div>
    );
  }

  // Timer status styling
  const isWarningTime = remainingSeconds !== null && remainingSeconds <= 900 && remainingSeconds > 0; // <= 15 mins

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-28">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* TOP BAR: Table info + 90 min Countdown Timer */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-3 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <div className="text-base font-bold text-white flex items-center gap-1.5">
                <span>{table.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-normal">
                  บุฟเฟต์หมูกระทะ
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">
                รหัสรอบ: #{token || 'ACTIVE'}
              </div>
            </div>
          </div>

          {/* Countdown Clock */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-mono font-bold transition-colors ${
              isExpired
                ? 'bg-red-950/60 border-red-800 text-red-400'
                : isWarningTime
                ? 'bg-amber-950/60 border-amber-600 text-amber-300 animate-pulse'
                : 'bg-zinc-800/80 border-zinc-700 text-emerald-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            <div>
              {isExpired ? 'หมดเวลา' : formatTime(remainingSeconds)}
            </div>
          </div>
        </div>

        {/* Warning Banner if <= 15 minutes */}
        {isWarningTime && !isExpired && (
          <div className="max-w-md mx-auto mt-2 bg-amber-500/15 border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>เหลือเวลาอีกไม่ถึง 15 นาที! สั่งอาหารรอบสุดท้ายได้เลยครับ</span>
          </div>
        )}

        {isExpired && (
          <div className="max-w-md mx-auto mt-2 bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-1.5 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>หมดเวลาสั่งอาหารแล้ว กรุณาติดต่อพนักงานเพื่อเช็คบิลครับ</span>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto px-4 pt-3">
        {/* Dessert / Self-service Announcement Banner */}
        <div className="mb-4 bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-zinc-900 border border-pink-900/40 rounded-2xl p-3 flex items-start gap-3 shadow-inner">
          <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 shrink-0">
            <IceCream className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-pink-300 flex items-center gap-1.5">
              <span>บาร์ของหวาน & ไอศกรีม 6 รส</span>
              <span className="text-[10px] bg-pink-500/30 px-1.5 py-0.5 rounded text-pink-200">ตักเองไม่อั้น</span>
            </div>
            <p className="text-zinc-400 mt-0.5 leading-relaxed">
              รวมมิตรน้ำกะทิ, ไอศกรีม และผลไม้ บริการตัวเองได้ที่มุมบาร์ด้านหลังร้าน
            </p>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none sticky top-[65px] z-30 bg-zinc-950/90 backdrop-blur py-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25 scale-[1.02]'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {renderCategoryIcon(cat.icon)}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* If Service category selected in tabs */}
        {activeCategory === 'service' ? (
          <div className="mt-4 space-y-3">
            <div className="text-sm font-semibold text-zinc-300 mb-2">
              บริการเสริมด่วน (แจ้งพนักงานทันที)
            </div>
            <div className="grid grid-cols-2 gap-3">
              {serviceTypes.map((srv) => (
                <button
                  key={srv.id}
                  disabled={isExpired}
                  onClick={() => handleRequestService(srv.id, srv.title)}
                  className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800/80 transition text-left flex flex-col justify-between h-32 active:scale-95 disabled:opacity-40"
                >
                  <div className="p-2.5 rounded-xl bg-zinc-800 w-fit">
                    {renderServiceIcon(srv.icon)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-zinc-100">{srv.title}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{srv.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Food Menu Grid */
          <div className="mt-3 space-y-3">
            {menuItems
              .filter((item) => item.categoryId === activeCategory)
              .map((item) => {
                const qtyInCart = cart[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className={`flex gap-3 p-3 rounded-2xl bg-zinc-900/90 border transition-all ${
                      qtyInCart > 0
                        ? 'border-orange-500/60 bg-orange-950/10'
                        : 'border-zinc-800/80 hover:border-zinc-700'
                    } ${!item.isAvailable ? 'opacity-50 grayscale' : ''}`}
                  >
                    {/* Food Photo */}
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-zinc-800">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {!item.isAvailable && (
                        <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-xs font-bold text-red-400">
                          ของหมด
                        </div>
                      )}
                    </div>

                    {/* Details & Counter */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-bold text-sm text-zinc-100">{item.name}</h4>
                          <span className="text-xs text-orange-400 font-semibold shrink-0">บุฟเฟต์ 0.-</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-between pt-2">
                        {item.isOrderable ? (
                          <>
                            <span className="text-[11px] text-zinc-500">
                              {qtyInCart > 0 ? `เลือกแล้ว ${qtyInCart} ถาด` : 'ยังไม่เลือก'}
                            </span>
                            <div className="flex items-center gap-2">
                              {qtyInCart > 0 && (
                                <button
                                  onClick={() => updateCartQty(item.id, -1)}
                                  className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:bg-zinc-700 active:scale-95 transition"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {qtyInCart > 0 && (
                                <span className="font-bold text-sm w-5 text-center text-orange-400">
                                  {qtyInCart}
                                </span>
                              )}
                              <button
                                disabled={!item.isAvailable || isExpired}
                                onClick={() => updateCartQty(item.id, 1)}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition active:scale-95 ${
                                  !item.isAvailable || isExpired
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                    : 'bg-orange-500 hover:bg-orange-400 text-white shadow-md shadow-orange-500/20'
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="w-full flex items-center justify-end">
                            <span className="text-[11px] text-pink-300 bg-pink-500/10 border border-pink-500/20 px-2.5 py-1 rounded-lg">
                              🍦 ตักเองที่บาร์ของหวาน
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </main>

      {/* STICKY BOTTOM BAR: Quick Service Button + Cart / Order CTA */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 p-3">
        <div className="max-w-md mx-auto flex items-center gap-2">
          {/* Service Bell Button */}
          <button
            onClick={() => setIsServiceOpen(true)}
            className="flex flex-col items-center justify-center px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-200 transition shrink-0 active:scale-95"
            title="เรียกพนักงาน / เติมถ่าน / ซุป"
          >
            <Bell className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] mt-0.5 font-medium">บริการด่วน</span>
          </button>

          {/* View Order History */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex flex-col items-center justify-center px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-200 transition shrink-0 active:scale-95 relative"
            title="ประวัติอาหารที่สั่งไปแล้ว"
          >
            <History className="w-5 h-5 text-blue-400" />
            <span className="text-[10px] mt-0.5 font-medium">ประวัติ</span>
            {myOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                {myOrders.length}
              </span>
            )}
          </button>

          {/* Cart / Submit Order Button */}
          <button
            disabled={totalCartCount === 0 || isExpired}
            onClick={() => setIsCartOpen(true)}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-between font-bold text-sm shadow-xl transition active:scale-98 ${
              totalCartCount === 0 || isExpired
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-orange-500/25'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>{isExpired ? 'หมดเวลาสั่งอาหาร' : `ถาดในตะกร้า (${totalCartCount})`}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-black/20 px-2 py-1 rounded-md">
              <span>ดูรายการ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </footer>

      {/* MODAL: CART & REVIEW ORDER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-zinc-900 border-t border-zinc-800 rounded-t-3xl max-w-md w-full mx-auto p-5 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-lg text-zinc-100">ยืนยันรายการอาหาร</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items list */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 divide-y divide-zinc-800/60">
              {Object.entries(cart).map(([menuId, qty]) => {
                const item = menuItems.find((m) => m.id === menuId);
                if (!item) return null;
                return (
                  <div key={menuId} className="pt-3 first:pt-0 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-zinc-100">{item.name}</div>
                      <div className="text-xs text-zinc-400">บุฟเฟต์ 0 บาท</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQty(menuId, -1)}
                        className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-sm w-6 text-center text-orange-400">
                        {qty}
                      </span>
                      <button
                        onClick={() => updateCartQty(menuId, 1)}
                        className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Confirmation CTA */}
            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>จำนวนทั้งหมด</span>
                <span className="font-bold text-zinc-200">{totalCartCount} ถาด</span>
              </div>
              <button
                onClick={handleSubmitOrder}
                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-xl font-bold text-base shadow-lg shadow-orange-500/25 active:scale-98 transition flex items-center justify-center gap-2"
              >
                <span>🔥 สั่งอาหารเข้าห้องครัว</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ORDER HISTORY (ดูประวัติที่สั่งไปแล้ว) */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-zinc-900 border-t border-zinc-800 rounded-t-3xl max-w-md w-full mx-auto p-5 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-lg text-zinc-100">ประวัติที่สั่งไปแล้ว</h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-4">
              {myOrders.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-sm">
                  ยังไม่มีประวัติการสั่งอาหารในรอบนี้
                </div>
              ) : (
                myOrders.map((ord, idx) => (
                  <div key={ord.id} className="p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/60">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-700/50">
                      <div className="text-xs text-zinc-400">
                        รอบที่ {myOrders.length - idx} • {new Date(ord.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        ord.status === 'served'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : ord.status === 'cooking'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-amber-500/20 text-amber-300 animate-pulse'
                      }`}>
                        {ord.status === 'served' ? '✓ เสิร์ฟแล้ว' : ord.status === 'cooking' ? 'กำลังเตรียม' : 'ครัวรับออเดอร์แล้ว'}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {ord.items.map((it, i) => (
                        <li key={i} className="text-sm flex items-center justify-between text-zinc-200">
                          <span>{it.name}</span>
                          <span className="font-semibold text-orange-400">x{it.qty}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SERVICE REQUEST (ขอถ่าน/กระทะ/ซุป) */}
      {isServiceOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-zinc-900 border-t border-zinc-800 rounded-t-3xl max-w-md w-full mx-auto p-5 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg text-zinc-100">เรียกพนักงาน / บริการเสริม</h3>
              </div>
              <button
                onClick={() => setIsServiceOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-4">
              {serviceTypes.map((srv) => (
                <button
                  key={srv.id}
                  disabled={isExpired}
                  onClick={() => handleRequestService(srv.id, srv.title)}
                  className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700 hover:border-orange-500 hover:bg-zinc-700/80 transition text-left flex flex-col justify-between h-28 active:scale-95 disabled:opacity-40"
                >
                  {renderServiceIcon(srv.icon)}
                  <div className="font-bold text-sm text-zinc-100">{srv.title}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
