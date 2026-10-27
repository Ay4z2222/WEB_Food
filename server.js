import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'restaurant_data.json');

// Default initial state
const defaultCategories = [
  { id: 'meat', name: 'เนื้อสัตว์ / ซีฟู้ด', icon: 'Flame' },
  { id: 'veggie', name: 'ผัก / เห็ด / เส้น', icon: 'Salad' },
  { id: 'snack', name: 'ของทานเล่น / ของทอด', icon: 'UtensilsCrossed' },
  { id: 'drink', name: 'เครื่องดื่ม', icon: 'CupSoda' },
  { id: 'dessert', name: 'ของหวาน / ไอศกรีม', icon: 'IceCream', selfServiceNotice: 'บริการตัวเองที่บาร์ของหวานด้านหลังร้าน ตักได้ไม่อั้น!' },
  { id: 'service', name: 'บริการเสริม', icon: 'Bell' },
];

const defaultMenuItems = [
  // หมู / เนื้อสัตว์ / ซีฟู้ด
  { id: 'm1', categoryId: 'meat', name: 'หมูสามชั้นหมักงา', desc: 'สามชั้นคัดพิเศษ หมักซอสงาสูตรเด็ดร้าน', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'm2', categoryId: 'meat', name: 'สันคอสไลด์บาง', desc: 'แทรกมันนุ่ม ละลายบนกระทะ', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'm3', categoryId: 'meat', name: 'หมูหมักพริกไทยดำ', desc: 'หมูเนื้อนุ่ม หอมกลิ่นพริกไทยดำแท้', image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'm4', categoryId: 'meat', name: 'เบคอนสดสไลด์', desc: 'ปิ้งกรอบเกรียม หอมมันหมูกระทะแท้', image: 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'm5', categoryId: 'meat', name: 'ตับหมูสด', desc: 'ตับสดใหม่ ลวกสุกหวานกำลังดี', image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'm6', categoryId: 'meat', name: 'กุ้งขาวสด', desc: 'กุ้งสดเนื้อเด้ง ปิ้งหรือต้มน้ำซุปก็หวาน', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'm7', categoryId: 'meat', name: 'หมึกกล้วยบั้ง', desc: 'หมึกสดเนื้อกรอบ ปิ้งพอสะดุ้งไฟ', image: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'm8', categoryId: 'meat', name: 'ปลาดอลลี่สไลด์', desc: 'เนื้อปลาขาวนุ่ม ต้มซุปละมุน', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },

  // ผัก / เส้น
  { id: 'v1', categoryId: 'veggie', name: 'กะหล่ำปลีซอยฝอย', desc: 'ผักคู่บุญหมูกระทะ ต้มซุปแล้วหวานฉ่ำ', image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'v2', categoryId: 'veggie', name: 'ผักบุ้งจีน', desc: 'ยอดอ่อนกรอบ สดสะอาด', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'v3', categoryId: 'veggie', name: 'เห็ดเข็มทอง', desc: 'เห็ดขาวกรุบกรอบ', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'v4', categoryId: 'veggie', name: 'ข้าวโพดอ่อน', desc: 'กรอบหวาน เพิ่มรสชาติน้ำซุป', image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'v5', categoryId: 'veggie', name: 'วุ้นเส้นสด', desc: 'วุ้นเส้นเหนียวนุ่ม ดูดซับน้ำซุป', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'v6', categoryId: 'veggie', name: 'บะหมี่หยกโรยกระเทียม', desc: 'เส้นเหนียวนุ่ม ลวกคลุกกระเทียมเจียว', image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },

  // ของทานเล่น
  { id: 's1', categoryId: 'snack', name: 'เกี๊ยวหมูทอดกรอบ', desc: 'ทอดใหม่ร้อนๆ จิ้มน้ำจิ้มบ๊วย', image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 's2', categoryId: 'snack', name: 'ไก่ป๊อปสไปซี่', desc: 'ไก่กรอบคลุกผงวิงแซ่บ', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 's3', categoryId: 'snack', name: 'เฟรนช์ฟรายส์ทอด', desc: 'มันฝรั่งทอดร้อนๆ โรยเกลือ', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 's4', categoryId: 'snack', name: 'ไส้กรอกแดงในตำนาน', desc: 'ทอดพองกรอบนอกนุ่มใน', image: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },

  // เครื่องดื่ม
  { id: 'd1', categoryId: 'drink', name: 'เป๊ปซี่ (กระป๋อง)', desc: 'เครื่องดื่มอัดลมเย็นชื่นใจ', image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'd2', categoryId: 'drink', name: 'น้ำเขียวสไปรท์ (กระป๋อง)', desc: 'เย็นสดชื่น หอมกลิ่นมะนาว', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'd3', categoryId: 'drink', name: 'ชามะนาวเย็น', desc: 'เปรี้ยวหวานกลมกล่อม ดับเลี่ยน', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },
  { id: 'd4', categoryId: 'drink', name: 'น้ำแข็ง 1 ถัง', desc: 'ถังน้ำแข็งเสริมพร้อมที่คีบ', image: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: true },

  // ของหวาน (Self Service Notice)
  { id: 'sw1', categoryId: 'dessert', name: 'ไอศกรีม 6 รสชาติ', desc: 'กะทิรวมมิตร, ช็อกโกแลต, มะนาว, วานิลลา, ชาไทย, สตรอว์เบอร์รี (ตักเองที่บาร์)', image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: false },
  { id: 'sw2', categoryId: 'dessert', name: 'รวมมิตรน้ำกะทิ ลอดช่องแตงไทย', desc: 'เครื่องแน่น น้ำกะทิหอมอบควันเทียน (ตักเองที่บาร์)', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: false },
  { id: 'sw3', categoryId: 'dessert', name: 'ผลไม้ตามฤดูกาล (แตงโม/สับปะรด)', desc: 'แตงโมเย็นหวานฉ่ำ ล้างปากหลังมื้อ (ตักเองที่บาร์)', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=60', isAvailable: true, isOrderable: false },
];

const defaultServiceTypes = [
  { id: 'coal', title: 'ขอเติมถ่าน / ไฟมอด', icon: 'Flame', desc: 'พนักงานจะนำถ่านร้อนมาเติมให้ที่เตา' },
  { id: 'pan', title: 'ขอเปลี่ยนกระทะใหม่', icon: 'RefreshCw', desc: 'กระทะไหม้ เกรียม ขอสลับใบใหม่ทันที' },
  { id: 'soup', title: 'ขอเติมน้ำซุปกระดูกหมู', icon: 'Soup', desc: 'พนักงานจะนำการวมซุปมาเติมให้' },
  { id: 'staff', title: 'เรียกพนักงานที่โต๊ะ', icon: 'UserCheck', desc: 'ต้องการความช่วยเหลืออื่นๆ' },
];

function generateInitialTables() {
  const tables = [];
  for (let i = 1; i <= 12; i++) {
    const id = `table-${i}`;
    const name = `โต๊ะ ${i < 10 ? '0' + i : i}`;
    tables.push({
      id,
      number: i,
      name,
      status: 'available', // available | active | cleaning
      token: null,
      startTime: null,
      endTime: null,
      durationMinutes: 90,
      customerCount: 0,
    });
  }
  return tables;
}

let db = {
  categories: defaultCategories,
  menuItems: defaultMenuItems,
  serviceTypes: defaultServiceTypes,
  tables: generateInitialTables(),
  orders: [],
  serviceRequests: [],
};

// Load or save DB
function loadDB() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      db = { ...db, ...data };
      console.log('Loaded database from restaurant_data.json');
    } catch (e) {
      console.error('Failed to load JSON db, using defaults', e);
    }
  } else {
    saveDB();
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save DB', e);
  }
}

loadDB();

// Helper to generate short random token
function generateToken() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// REST Endpoints
app.get('/api/state', (req, res) => {
  res.json({
    categories: db.categories,
    menuItems: db.menuItems,
    serviceTypes: db.serviceTypes,
    tables: db.tables,
    orders: db.orders,
    serviceRequests: db.serviceRequests,
    serverTime: Date.now(),
  });
});

// Customer Session Verification
app.get('/api/session/:tableId/:token', (req, res) => {
  const { tableId, token } = req.params;
  const table = db.tables.find((t) => t.id === tableId);
  if (!table) {
    return res.status(404).json({ error: 'ไม่พบหมายเลขโต๊ะนี้ในระบบ' });
  }
  if (table.status !== 'active' || table.token !== token) {
    return res.status(401).json({ 
      error: 'QR Code นี้หมดอายุ หรือโต๊ะนี้ยังไม่ได้เปิดใช้งาน กรุณาติดต่อพนักงาน',
      tableStatus: table.status,
    });
  }

  const now = Date.now();
  const remainingMs = Math.max(0, new Date(table.endTime).getTime() - now);
  const isExpired = remainingMs <= 0;

  // Filter orders for this table session
  const tableOrders = db.orders.filter((o) => o.tableId === tableId && o.token === token);
  const tableServices = db.serviceRequests.filter((s) => s.tableId === tableId && s.token === token);

  res.json({
    table,
    categories: db.categories,
    menuItems: db.menuItems,
    serviceTypes: db.serviceTypes,
    orders: tableOrders,
    serviceRequests: tableServices,
    serverTime: now,
    remainingMs,
    isExpired,
  });
});

// Socket.io Real-time Event Handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial data snapshot
  socket.emit('init_data', {
    categories: db.categories,
    menuItems: db.menuItems,
    serviceTypes: db.serviceTypes,
    tables: db.tables,
    orders: db.orders,
    serviceRequests: db.serviceRequests,
    serverTime: Date.now(),
  });

  // CASHIER: Open Table (เริ่มจับเวลา 90 นาที & สร้าง Token)
  socket.on('table:open', ({ tableId, customerCount = 2, durationMinutes = 90 }) => {
    const table = db.tables.find((t) => t.id === tableId);
    if (!table) return;

    const now = new Date();
    const end = new Date(now.getTime() + durationMinutes * 60 * 1000);
    const token = generateToken();

    table.status = 'active';
    table.customerCount = customerCount;
    table.durationMinutes = durationMinutes;
    table.startTime = now.toISOString();
    table.endTime = end.toISOString();
    table.token = token;

    saveDB();
    io.emit('tables:updated', db.tables);
    console.log(`Table ${table.name} opened with token ${token}. Ends at ${table.endTime}`);
  });

  // CASHIER: Close / Checkout Table (ปิดโต๊ะ & เคลียร์ Token)
  socket.on('table:close', ({ tableId }) => {
    const table = db.tables.find((t) => t.id === tableId);
    if (!table) return;

    table.status = 'available';
    table.token = null;
    table.startTime = null;
    table.endTime = null;
    table.customerCount = 0;

    saveDB();
    io.emit('tables:updated', db.tables);
    io.emit('session:invalidated', { tableId });
    console.log(`Table ${table.name} closed`);
  });

  // CUSTOMER: Create Order (ส่งออเดอร์เข้าครัว)
  socket.on('order:create', ({ tableId, token, items }) => {
    const table = db.tables.find((t) => t.id === tableId);
    if (!table || table.token !== token || table.status !== 'active') {
      return socket.emit('order:error', { message: 'โต๊ะนี้หมดอายุแล้ว ไม่สามารถส่งออเดอร์ได้' });
    }

    // Check timer expiration
    const remainingMs = new Date(table.endTime).getTime() - Date.now();
    if (remainingMs <= 0) {
      return socket.emit('order:error', { message: 'หมดเวลาสั่งอาหาร 90 นาทีแล้วครับ' });
    }

    if (!items || items.length === 0) return;

    const orderId = `ord-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    const newOrder = {
      id: orderId,
      tableId,
      tableName: table.name,
      token,
      items: items.map((item) => ({
        menuId: item.menuId,
        name: item.name,
        qty: item.qty,
        status: 'pending', // pending | cooking | served
      })),
      status: 'pending', // pending | cooking | served
      createdAt: new Date().toISOString(),
    };

    db.orders.unshift(newOrder);
    saveDB();

    // Broadcast to kitchen, cashier, and customer
    io.emit('order:new', newOrder);
    socket.emit('order:success', { orderId });
    console.log(`New Order ${orderId} received from ${table.name}: ${items.length} items`);
  });

  // KITCHEN: Update Order / Item status (กำลังทำ / เสิร์ฟแล้ว)
  socket.on('order:update_status', ({ orderId, status }) => {
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) return;

    order.status = status;
    order.items.forEach((it) => {
      it.status = status;
    });

    saveDB();
    io.emit('order:updated', order);
  });

  // CUSTOMER: Service Request (เติมถ่าน, เปลี่ยนกระทะ, เติมน้ำซุป, เรียกพนักงาน)
  socket.on('service:request', ({ tableId, token, requestType }) => {
    const table = db.tables.find((t) => t.id === tableId);
    if (!table || table.token !== token || table.status !== 'active') {
      return socket.emit('service:error', { message: 'โต๊ะหมดอายุหรือไม่ถูกต้อง' });
    }

    const typeObj = db.serviceTypes.find((s) => s.id === requestType) || { title: 'เรียกพนักงาน' };

    const reqId = `srv-${Date.now()}`;
    const newRequest = {
      id: reqId,
      tableId,
      tableName: table.name,
      token,
      requestType,
      title: typeObj.title,
      status: 'pending', // pending | acknowledged | completed
      createdAt: new Date().toISOString(),
    };

    db.serviceRequests.unshift(newRequest);
    saveDB();

    io.emit('service:new', newRequest);
    socket.emit('service:success', newRequest);
    console.log(`Service Request from ${table.name}: ${typeObj.title}`);
  });

  // STAFF: Resolve Service Request
  socket.on('service:resolve', ({ reqId, status }) => {
    const reqItem = db.serviceRequests.find((s) => s.id === reqId);
    if (!reqItem) return;

    reqItem.status = status; // acknowledged | completed
    saveDB();
    io.emit('service:updated', reqItem);
  });

  // ADMIN: Toggle Menu Item Out-of-Stock
  socket.on('menu:toggle_stock', ({ menuId, isAvailable }) => {
    const item = db.menuItems.find((m) => m.id === menuId);
    if (!item) return;

    item.isAvailable = isAvailable;
    saveDB();
    io.emit('menu:updated', { menuId, isAvailable });
    console.log(`Menu ${item.name} availability set to ${isAvailable}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Serve built static files if dist exists
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Mookata Buffet Server running on http://localhost:${PORT}`);
});
