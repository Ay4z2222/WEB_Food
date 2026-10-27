import React, { useState, useEffect } from 'react';
import { Smartphone, ChefHat, LayoutGrid, Sparkles } from 'lucide-react';
import CustomerView from './views/CustomerView';
import KitchenView from './views/KitchenView';
import CashierView from './views/CashierView';

export default function App() {
  // Current view: 'customer' | 'kitchen' | 'cashier'
  const [currentView, setCurrentView] = useState('cashier');
  
  // Selected table session for Customer View
  const [activeCustomerTable, setActiveCustomerTable] = useState(null);
  const [activeCustomerToken, setActiveCustomerToken] = useState(null);

  // Check URL params on load (e.g. if someone actually scanned the QR code)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableId = params.get('table');
    const token = params.get('token');
    const view = params.get('view');

    if (tableId && token) {
      setActiveCustomerTable({ id: tableId, name: `โต๊ะ ${tableId.replace('table-', '')}` });
      setActiveCustomerToken(token);
      setCurrentView('customer');
    } else if (view && ['customer', 'kitchen', 'cashier'].includes(view)) {
      setCurrentView(view);
    }
  }, []);

  // When cashier clicks "จำลองสแกนโต๊ะนี้"
  const handleOpenCustomerView = (table, token) => {
    setActiveCustomerTable(table);
    setActiveCustomerToken(token);
    setCurrentView('customer');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* GLOBAL VIEW SWITCHER BAR (Convenient toolbar for testing all 3 sides) */}
      <nav className="bg-zinc-900 border-b border-zinc-800 px-3 py-2 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-orange-500 tracking-wider flex items-center gap-1.5">
              <span>🔥 MOOKATA BUFFET</span>
            </span>
          </div>

          {/* 3 Main View Buttons */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setCurrentView('customer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentView === 'customer'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>📱 หน้าจอลูกค้า (สแกน)</span>
            </button>

            <button
              onClick={() => setCurrentView('kitchen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentView === 'kitchen'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>🍳 จอห้องครัว (KDS)</span>
            </button>

            <button
              onClick={() => setCurrentView('cashier')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentView === 'cashier'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>💻 แคชเชียร์ & ผังโต๊ะ</span>
            </button>
          </div>
        </div>
      </nav>

      {/* RENDER ACTIVE VIEW */}
      <div className="flex-1">
        {currentView === 'customer' && (
          <CustomerView
            table={activeCustomerTable}
            token={activeCustomerToken}
            onSwitchToCashier={() => setCurrentView('cashier')}
          />
        )}

        {currentView === 'kitchen' && <KitchenView />}

        {currentView === 'cashier' && (
          <CashierView onOpenCustomerView={handleOpenCustomerView} />
        )}
      </div>
    </div>
  );
}
