/**
 * Client-side Store — replaces the backend server for GitHub Pages deployment.
 * All state is held in memory and shared across views via event callbacks.
 * Works perfectly within a single browser tab (switching between Customer/Kitchen/Cashier views).
 */

const defaultCategories = [
  { id: 'meat', name: 'เนื้อสัตว์ / ซีฟู้ด', icon: 'Flame' },
  { id: 'veggie', name: 'ผัก / เห็ด / เส้น', icon: 'Salad' },
  { id: 'snack', name: 'ของทานเล่น / ของทอด', icon: 'UtensilsCrossed' },
  { id: 'drink', name: 'เครื่องดื่ม', icon: 'CupSoda' },
  { id: 'dessert', name: 'ของหวาน / ไอศกรีม', icon: 'IceCream', selfServiceNotice: 'บริการตัวเองที่บาร์ของหวานด้านหลังร้าน ตักได้ไม่อั้น!' },
  { id: 'service', name: 'บริการเสริม', icon: 'Bell' },
];

const defaultMenuItems = [
  { id: 'm1', categoryId: 'meat', name: 'หมูสามชั้นหมักงา', desc: 'สามชั้นคัดพิเศษ หมักซอสงาสูตรเด็ดร้าน', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'm2', categoryId: 'meat', name: 'สันคอสไลด์บาง', desc: 'แทรกมันนุ่ม ละลายบนกระทะ', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'm3', categoryId: 'meat', name: 'หมูหมักพริกไทยดำ', desc: 'หมูเนื้อนุ่ม หอมกลิ่นพริกไทยดำแท้', image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'm4', categoryId: 'meat', name: 'เบคอนสดสไลด์', desc: 'ปิ้งกรอบเกรียม หอมมันหมูกระทะแท้', image: 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'm5', categoryId: 'meat', name: 'ตับหมูสด', desc: 'ตับสดใหม่ ลวกสุกหวานกำลังดี', image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'm6', categoryId: 'meat', name: 'กุ้งขาวสด', desc: 'กุ้งสดเนื้อเด้ง ปิ้งหรือต้มน้ำซุปก็หวาน', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'm7', categoryId: 'meat', name: 'หมึกกล้วยบั้ง', desc: 'หมึกสดเนื้อกรอบ ปิ้งพอสะดุ้งไฟ', image: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'm8', categoryId: 'meat', name: 'ปลาดอลลี่สไลด์', desc: 'เนื้อปลาขาวนุ่ม ต้มซุปละมุน', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'v1', categoryId: 'veggie', name: 'กะหล่ำปลีซอยฝอย', desc: 'ผักคู่บุญหมูกระทะ ต้มซุปแล้วหวานฉ่ำ', image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'v2', categoryId: 'veggie', name: 'ผักบุ้งจีน', desc: 'ยอดอ่อนกรอบ สดสะอาด', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'v3', categoryId: 'veggie', name: 'เห็ดเข็มทอง', desc: 'เห็ดขาวกรุบกรอบ', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'v4', categoryId: 'veggie', name: 'ข้าวโพดอ่อน', desc: 'กรอบหวาน เพิ่มรสชาติน้ำซุป', image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'v5', categoryId: 'veggie', name: 'วุ้นเส้นสด', desc: 'วุ้นเส้นเหนียวนุ่ม ดูดซับน้ำซุป', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'v6', categoryId: 'veggie', name: 'บะหมี่หยกโรยกระเทียม', desc: 'เส้นเหนียวนุ่ม ลวกคลุกกระเทียมเจียว', image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 's1', categoryId: 'snack', name: 'เกี๊ยวหมูทอดกรอบ', desc: 'ทอดใหม่ร้อนๆ จิ้มน้ำจิ้มบ๊วย', image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 's2', categoryId: 'snack', name: 'ไก่ป๊อปสไปซี่', desc: 'ไก่กรอบคลุกผงวิงแซ่บ', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 's3', categoryId: 'snack', name: 'เฟรนช์ฟรายส์ทอด', desc: 'มันฝรั่งทอดร้อนๆ โรยเกลือ', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 's4', categoryId: 'snack', name: 'ไส้กรอกแดงในตำนาน', desc: 'ทอดพองกรอบนอกนุ่มใน', image: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'd1', categoryId: 'drink', name: 'เป๊ปซี่ (กระป๋อง)', desc: 'เครื่องดื่มอัดลมเย็นชื่นใจ', image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'd2', categoryId: 'drink', name: 'น้ำเขียวสไปรท์ (กระป๋อง)', desc: 'เย็นสดชื่น หอมกลิ่นมะนาว', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'd3', categoryId: 'drink', name: 'ชามะนาวเย็น', desc: 'เปรี้ยวหวานกลมกล่อม ดับเลี่ยน', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'd4', categoryId: 'drink', name: 'น้ำแข็ง 1 ถัง', desc: 'ถังน้ำแข็งเสริมพร้อมที่คีบ', image: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'sw1', categoryId: 'dessert', name: 'ไอศกรีม 6 รสชาติ', desc: 'กะทิรวมมิตร, ช็อกโกแลต, มะนาว, วานิลลา, ชาไทย, สตรอว์เบอร์รี (ตักเองที่บาร์)', image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: false },
  { id: 'sw2', categoryId: 'dessert', name: 'รวมมิตรน้ำกะทิ ลอดช่องแตงไทย', desc: 'เครื่องแน่น น้ำกะทิหอมอบควันเทียน (ตักเองที่บาร์)', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: false },
  { id: 'sw3', categoryId: 'dessert', name: 'ผลไม้ตามฤดูกาล (แตงโม/สับปะรด)', desc: 'แตงโมเย็นหวานฉ่ำ ล้างปากหลังมื้อ (ตักเองที่บาร์)', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: false },
];

const defaultServiceTypes = [
  { id: 'coal', title: 'ขอเติมถ่าน / ไฟมอด', icon: 'Flame', desc: 'พนักงานจะนำถ่านร้อนมาเติมให้ที่เตา' },
  { id: 'pan', title: 'ขอเปลี่ยนกระทะใหม่', icon: 'RefreshCw', desc: 'กระทะไหม้ เกรียม ขอสลับใบใหม่ทันที' },
  { id: 'soup', title: 'ขอเติมน้ำซุปกระดูกหมู', icon: 'Soup', desc: 'พนักงานจะนำกาวมซุปมาเติมให้' },
  { id: 'staff', title: 'เรียกพนักงานที่โต๊ะ', icon: 'UserCheck', desc: 'ต้องการความช่วยเหลืออื่นๆ' },
];

function generateTables() {
  const tables = [];
  for (let i = 1; i <= 12; i++) {
    tables.push({
      id: `table-${i}`,
      number: i,
      name: `โต๊ะ ${i < 10 ? '0' + i : i}`,
      status: 'available',
      token: null,
      startTime: null,
      endTime: null,
      durationMinutes: 90,
      customerCount: 0,
    });
  }
  return tables;
}

function generateToken() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Simple event bus
const listeners = {};
function on(event, fn) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(fn);
  return () => { listeners[event] = listeners[event].filter((f) => f !== fn); };
}
function emit(event, data) {
  (listeners[event] || []).forEach((fn) => fn(data));
}

// In-memory DB
const store = {
  categories: [...defaultCategories],
  menuItems: defaultMenuItems.map((m) => ({ ...m })),
  serviceTypes: [...defaultServiceTypes],
  tables: generateTables(),
  orders: [],
  serviceRequests: [],
};

// Public API
export function getState() {
  return { ...store, serverTime: Date.now() };
}

export function getSession(tableId, token) {
  const table = store.tables.find((t) => t.id === tableId);
  if (!table) return { error: 'ไม่พบหมายเลขโต๊ะนี้ในระบบ' };
  if (table.status !== 'active' || table.token !== token) {
    return { error: 'QR Code นี้หมดอายุ หรือโต๊ะนี้ยังไม่ได้เปิดใช้งาน กรุณาติดต่อพนักงาน' };
  }
  const now = Date.now();
  const remainingMs = Math.max(0, new Date(table.endTime).getTime() - now);
  return {
    table,
    categories: store.categories,
    menuItems: store.menuItems,
    serviceTypes: store.serviceTypes,
    orders: store.orders.filter((o) => o.tableId === tableId && o.token === token),
    serviceRequests: store.serviceRequests.filter((s) => s.tableId === tableId && s.token === token),
    serverTime: now,
    remainingMs,
    isExpired: remainingMs <= 0,
  };
}

export function openTable({ tableId, customerCount = 2, durationMinutes = 90 }) {
  const table = store.tables.find((t) => t.id === tableId);
  if (!table) return;
  const now = new Date();
  table.status = 'active';
  table.customerCount = customerCount;
  table.durationMinutes = durationMinutes;
  table.startTime = now.toISOString();
  table.endTime = new Date(now.getTime() + durationMinutes * 60 * 1000).toISOString();
  table.token = generateToken();
  emit('tables:updated', [...store.tables]);
}

export function closeTable(tableId) {
  const table = store.tables.find((t) => t.id === tableId);
  if (!table) return;
  table.status = 'available';
  table.token = null;
  table.startTime = null;
  table.endTime = null;
  table.customerCount = 0;
  emit('tables:updated', [...store.tables]);
  emit('session:invalidated', { tableId });
}

export function createOrder({ tableId, token, items }) {
  const table = store.tables.find((t) => t.id === tableId);
  if (!table || table.token !== token || table.status !== 'active') {
    return { error: 'โต๊ะนี้หมดอายุแล้ว ไม่สามารถส่งออเดอร์ได้' };
  }
  const remainingMs = new Date(table.endTime).getTime() - Date.now();
  if (remainingMs <= 0) {
    return { error: 'หมดเวลาสั่งอาหาร 90 นาทีแล้วครับ' };
  }
  if (!items || items.length === 0) return { error: 'ไม่มีรายการอาหาร' };

  const orderId = `ord-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
  const newOrder = {
    id: orderId,
    tableId,
    tableName: table.name,
    token,
    items: items.map((item) => ({ menuId: item.menuId, name: item.name, qty: item.qty, status: 'pending' })),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  store.orders.unshift(newOrder);
  emit('order:new', newOrder);
  return { orderId };
}

export function updateOrderStatus(orderId, status) {
  const order = store.orders.find((o) => o.id === orderId);
  if (!order) return;
  order.status = status;
  order.items.forEach((it) => { it.status = status; });
  emit('order:updated', order);
}

export function createServiceRequest({ tableId, token, requestType }) {
  const table = store.tables.find((t) => t.id === tableId);
  if (!table || table.token !== token || table.status !== 'active') return { error: 'โต๊ะหมดอายุ' };
  const typeObj = store.serviceTypes.find((s) => s.id === requestType) || { title: 'เรียกพนักงาน' };
  const reqId = `srv-${Date.now()}`;
  const newRequest = {
    id: reqId,
    tableId,
    tableName: table.name,
    token,
    requestType,
    title: typeObj.title,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  store.serviceRequests.unshift(newRequest);
  emit('service:new', newRequest);
  return newRequest;
}

export function resolveServiceRequest(reqId, status = 'completed') {
  const req = store.serviceRequests.find((s) => s.id === reqId);
  if (!req) return;
  req.status = status;
  emit('service:updated', req);
}

export function toggleMenuStock(menuId, isAvailable) {
  const item = store.menuItems.find((m) => m.id === menuId);
  if (!item) return;
  item.isAvailable = isAvailable;
  emit('menu:updated', { menuId, isAvailable });
}

export { on, emit };
