/**
 * WAF Demo Site — Realistic E-Commerce Server
 * =============================================
 * Native Node.js server with real-ish API endpoints.
 * Every endpoint accepts user input, making it a proper
 * target for manual attack testing through the WAF.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const crypto = require("crypto");

const PORT = 9000;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
};

// ── Fake Database ────────────────────────────────────────────────────────
const USERS = [
  { id: 1, username: "admin", password: "admin123", email: "admin@nexastore.com", role: "admin" },
  { id: 2, username: "john",  password: "john2024", email: "john@gmail.com",      role: "customer" },
  { id: 3, username: "sarah", password: "sarah!99", email: "sarah@outlook.com",   role: "customer" },
];

const PRODUCTS = [
  { id: 1, name: "Wireless Headphones Pro",   price: 79.99,  category: "Electronics",  stock: 24, rating: 4.8, image: "🎧", description: "Premium noise-cancelling wireless headphones with 40-hour battery life, deep bass, and crystal-clear audio. Features Bluetooth 5.3 and multipoint connection." },
  { id: 2, name: "Ergonomic Laptop Stand",     price: 45.00,  category: "Accessories",  stock: 56, rating: 4.6, image: "💻", description: "Adjustable aluminum stand for perfect viewing angle and maximum airflow. Compatible with all laptops up to 17 inches." },
  { id: 3, name: "USB-C Multi Hub 7-in-1",     price: 34.99,  category: "Electronics",  stock: 89, rating: 4.5, image: "🔌", description: "7-in-1 hub with 4K HDMI, USB 3.0 x3, SD/TF card reader, and 100W PD charging pass-through." },
  { id: 4, name: "Mechanical Gaming Keyboard", price: 89.99,  category: "Gaming",       stock: 31, rating: 4.9, image: "⌨️", description: "RGB backlit mechanical keyboard with hot-swappable switches, PBT keycaps, and full N-key rollover." },
  { id: 5, name: "4K Webcam Ultra",            price: 129.99, category: "Electronics",  stock: 15, rating: 4.7, image: "📷", description: "Ultra HD 4K webcam with autofocus, noise-cancelling dual microphones, and low-light correction." },
  { id: 6, name: "Wireless Charging Pad",      price: 24.99,  category: "Accessories",  stock: 120,rating: 4.3, image: "🔋", description: "15W fast wireless charger compatible with all Qi-enabled devices. Sleek tempered glass design." },
  { id: 7, name: "Smart LED Desk Lamp",        price: 59.99,  category: "Home Office",  stock: 42, rating: 4.6, image: "💡", description: "App-controlled smart desk lamp with adjustable color temperature, brightness levels, and USB charging port." },
  { id: 8, name: "Noise-Cancelling Earbuds",   price: 149.99, category: "Electronics",  stock: 67, rating: 4.8, image: "🎵", description: "True wireless earbuds with adaptive ANC, 30-hour battery with case, and IPX5 water resistance." },
];

const REVIEWS = [
  { id: 1, productId: 1, user: "Mike T.",   rating: 5, text: "Best headphones I've ever owned! Battery lasts forever.", date: "2025-11-15" },
  { id: 2, productId: 1, user: "Lisa K.",   rating: 4, text: "Great sound quality. Wish it came in more colors.", date: "2025-12-01" },
  { id: 3, productId: 4, user: "GamerPro",  rating: 5, text: "Typing experience is amazing. The RGB is beautiful!", date: "2025-10-22" },
  { id: 4, productId: 2, user: "WorkFromHome", rating: 5, text: "Saved my neck! Great build quality.", date: "2025-09-30" },
];

let reviewIdCounter = 5;
let orderIdCounter = 1000;
let sessionTokens = {};
let contactMessages = [];

// ── Utilities ────────────────────────────────────────────────────────────

function serveStatic(filePath, res) {
  const ext = path.extname(filePath);
  const mime = MIME_TYPES[ext] || "application/octet-stream";
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("404 Not Found"); return; }
    res.writeHead(200, { "Content-Type": mime }); res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
  });
}

function parseJSON(str) {
  try { return JSON.parse(str); } catch { return null; }
}

function jsonResponse(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

// ── Server ───────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method = req.method.toUpperCase();

  // CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  // ────────────────────────────────────────────────────────────────────
  // AUTH ENDPOINTS
  // ────────────────────────────────────────────────────────────────────

  // POST /api/auth/login — Login with username & password
  if (pathname === "/api/auth/login" && method === "POST") {
    const body = parseJSON(await readBody(req));
    if (!body || !body.username || !body.password) {
      return jsonResponse(res, 400, { error: "Missing username or password" });
    }
    const user = USERS.find(u => u.username === body.username && u.password === body.password);
    if (user) {
      const token = crypto.randomBytes(16).toString("hex");
      sessionTokens[token] = user.id;
      return jsonResponse(res, 200, {
        status: "success", message: "Login successful",
        token, user: { id: user.id, username: user.username, email: user.email, role: user.role },
      });
    }
    return jsonResponse(res, 401, { status: "error", message: "Invalid username or password" });
  }

  // POST /api/auth/register — Register new account
  if (pathname === "/api/auth/register" && method === "POST") {
    const body = parseJSON(await readBody(req));
    if (!body || !body.username || !body.password || !body.email) {
      return jsonResponse(res, 400, { error: "Missing required fields" });
    }
    if (USERS.find(u => u.username === body.username)) {
      return jsonResponse(res, 409, { status: "error", message: "Username already exists" });
    }
    const newUser = {
      id: USERS.length + 1, username: body.username,
      password: body.password, email: body.email, role: "customer",
    };
    USERS.push(newUser);
    return jsonResponse(res, 201, {
      status: "success", message: "Account created successfully",
      user: { id: newUser.id, username: newUser.username, email: newUser.email },
    });
  }

  // POST /api/auth/reset-password — Password reset
  if (pathname === "/api/auth/reset-password" && method === "POST") {
    const body = parseJSON(await readBody(req));
    if (!body || !body.email) {
      return jsonResponse(res, 400, { error: "Email required" });
    }
    return jsonResponse(res, 200, {
      status: "success", message: "If the email exists, a reset link has been sent.",
    });
  }

  // GET /api/auth/profile?id= — User profile
  if (pathname === "/api/auth/profile" && method === "GET") {
    const userId = parseInt(parsed.query.id) || 1;
    const user = USERS.find(u => u.id === userId);
    if (!user) return jsonResponse(res, 404, { error: "User not found" });
    return jsonResponse(res, 200, {
      status: "success",
      user: { id: user.id, username: user.username, email: user.email, role: user.role,
        joined: "2024-03-15", orders: Math.floor(Math.random() * 20) + 1 },
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // PRODUCT ENDPOINTS
  // ────────────────────────────────────────────────────────────────────

  // GET /api/products — List all products
  if (pathname === "/api/products" && method === "GET") {
    const category = parsed.query.category;
    const sort = parsed.query.sort;
    let items = [...PRODUCTS];
    if (category) items = items.filter(p => p.category.toLowerCase() === category.toLowerCase());
    if (sort === "price_asc")  items.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") items.sort((a, b) => b.price - a.price);
    if (sort === "rating")     items.sort((a, b) => b.rating - a.rating);
    return jsonResponse(res, 200, { status: "success", products: items, total: items.length });
  }

  // GET /api/products/:id — Single product detail
  if (pathname.match(/^\/api\/products\/\d+$/) && method === "GET") {
    const id = parseInt(pathname.split("/").pop());
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return jsonResponse(res, 404, { error: "Product not found" });
    const prodReviews = REVIEWS.filter(r => r.productId === id);
    return jsonResponse(res, 200, { status: "success", product, reviews: prodReviews });
  }

  // GET /api/search?q= — Search products
  if (pathname === "/api/search" && method === "GET") {
    const q = (parsed.query.q || "").toLowerCase();
    const results = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
    return jsonResponse(res, 200, {
      status: "success", query: parsed.query.q || "", results, total: results.length,
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // REVIEW / COMMENT ENDPOINTS
  // ────────────────────────────────────────────────────────────────────

  // POST /api/reviews — Submit a review
  if (pathname === "/api/reviews" && method === "POST") {
    const body = parseJSON(await readBody(req));
    if (!body || !body.productId || !body.text || !body.name) {
      return jsonResponse(res, 400, { error: "Missing required fields (productId, name, text)" });
    }
    const review = {
      id: reviewIdCounter++, productId: body.productId,
      user: body.name, rating: body.rating || 5, text: body.text,
      date: new Date().toISOString().split("T")[0],
    };
    REVIEWS.push(review);
    return jsonResponse(res, 201, { status: "success", message: "Review submitted", review });
  }

  // GET /api/reviews?productId= — Get reviews for a product
  if (pathname === "/api/reviews" && method === "GET") {
    const pid = parseInt(parsed.query.productId) || 0;
    const prodReviews = REVIEWS.filter(r => r.productId === pid);
    return jsonResponse(res, 200, { status: "success", reviews: prodReviews, total: prodReviews.length });
  }

  // ────────────────────────────────────────────────────────────────────
  // ORDER ENDPOINTS
  // ────────────────────────────────────────────────────────────────────

  // POST /api/orders — Place an order
  if (pathname === "/api/orders" && method === "POST") {
    const body = parseJSON(await readBody(req));
    if (!body || !body.items || !body.shippingAddress) {
      return jsonResponse(res, 400, { error: "Missing items or shipping address" });
    }
    const orderId = `ORD-${orderIdCounter++}`;
    return jsonResponse(res, 201, {
      status: "success", message: "Order placed successfully",
      order: {
        id: orderId, items: body.items, shippingAddress: body.shippingAddress,
        total: body.items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0),
        status: "processing", date: new Date().toISOString(),
      },
    });
  }

  // GET /api/orders?userId= — Get order history
  if (pathname === "/api/orders" && method === "GET") {
    const userId = parsed.query.userId || "1";
    return jsonResponse(res, 200, {
      status: "success",
      orders: [
        { id: "ORD-998", date: "2025-11-28", total: 124.98, status: "delivered", items: 2 },
        { id: "ORD-997", date: "2025-11-15", total: 79.99,  status: "delivered", items: 1 },
      ],
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // CONTACT / SUPPORT
  // ────────────────────────────────────────────────────────────────────

  // POST /api/contact — Contact form
  if (pathname === "/api/contact" && method === "POST") {
    const body = parseJSON(await readBody(req));
    if (!body || !body.name || !body.email || !body.message) {
      return jsonResponse(res, 400, { error: "Missing required fields" });
    }
    contactMessages.push({ ...body, date: new Date().toISOString() });
    return jsonResponse(res, 200, {
      status: "success", message: "Message received. We'll respond within 24 hours.",
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // FILE UPLOAD (simulated)
  // ────────────────────────────────────────────────────────────────────

  if (pathname === "/api/upload" && method === "POST") {
    const body = await readBody(req);
    return jsonResponse(res, 200, {
      status: "success", message: "File uploaded successfully",
      file: { name: "upload_" + Date.now() + ".pdf", size: body.length + " bytes" },
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // NEWSLETTER
  // ────────────────────────────────────────────────────────────────────

  if (pathname === "/api/newsletter" && method === "POST") {
    const body = parseJSON(await readBody(req));
    if (!body || !body.email) {
      return jsonResponse(res, 400, { error: "Email required" });
    }
    return jsonResponse(res, 200, {
      status: "success", message: "Subscribed to newsletter successfully!",
    });
  }

  // ── Static Files ───────────────────────────────────────────────────
  let filePath = pathname === "/" ? "/index.html" : pathname;
  filePath = path.join(PUBLIC_DIR, filePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("403 Forbidden");
    return;
  }

  serveStatic(filePath, res);
});

server.listen(PORT, () => {
  console.log(`\n  🏪 NexaStore running at http://localhost:${PORT}`);
  console.log(`  🛡️  CloudFort WAF proxy at http://localhost:8000 → here`);
  console.log(`  🔓 Security Lab available on the site\n`);
});
