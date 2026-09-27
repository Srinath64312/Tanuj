/**
 * Teen Magnets - Square Edition E-Commerce Application
 * 3" x 3" Handcrafted Fridge Magnets
 * Contact: 9396310900 | mokshithguddeti@gmail.com
 * Order Notification Number: 9396310899
 */

// APPLICATION STATE
const state = {
  activeTab: 'catalog',
  activeCategory: 'all',
  searchQuery: '',
  magnets: [],
  categories: [],
  cart: JSON.parse(localStorage.getItem('teenmagnets_cart') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('teenmagnets_wishlist') || '[]'),
  currentUser: JSON.parse(localStorage.getItem('teenmagnets_user') || 'null'),
  savedAddress: JSON.parse(localStorage.getItem('teenmagnets_saved_address') || 'null'),
  darkMode: localStorage.getItem('teenmagnets_theme') !== 'light', // Defaults to Dark Mode
  fridgeMagnets: [],
  customizer: {
    photoUrl: '/assets/owners.jpg',
    serverPhotoUrl: '/assets/owners.jpg',
    text: 'Beach Adventures 🏍️✨',
    font: 'cursive',
    shape: 'square',
    finish: 'glossy',
    price: 99.00
  }
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  checkOAuthRedirect();
  initIcons();
  updateAuthUI();
  updateWishlistUI();
  loadCategories();
  loadCatalog();
  updateCartUI();
  initFridgeWithSampleMagnets();
});

function checkOAuthRedirect() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('auth_success') === 'true') {
    try {
      const user = JSON.parse(decodeURIComponent(urlParams.get('user')));
      state.currentUser = user;
      localStorage.setItem('teenmagnets_user', JSON.stringify(user));
      showToast(`✓ Welcome, ${user.name}! Logged in via Google.`);
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {
      console.error('Failed to parse OAuth user:', e);
    }
  } else if (urlParams.get('auth_error')) {
    showToast('Google Sign-in failed or was cancelled');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ============================================================================
// THEME (DARK / LIGHT MODE CONTROLLER)
// ============================================================================
function initTheme() {
  const saved = localStorage.getItem('teenmagnets_theme');
  state.darkMode = saved ? saved === 'dark' : true;
  applyThemeDOM();
}

function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  const themeName = state.darkMode ? 'dark' : 'light';
  localStorage.setItem('teenmagnets_theme', themeName);
  applyThemeDOM();
  showToast(state.darkMode ? '🌙 Dark Mode Activated' : '☀️ Light Mode Activated');
}

function applyThemeDOM() {
  const root = document.documentElement;
  const body = document.body;
  const iconContainer = document.getElementById('theme-icon-container');

  if (state.darkMode) {
    root.classList.add('dark');
    root.classList.remove('light');
    if (body) {
      body.classList.add('dark');
      body.classList.remove('light');
    }
    if (iconContainer) {
      iconContainer.innerHTML = '<i data-lucide="sun" class="w-4 h-4 text-amber-400"></i>';
    }
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    if (body) {
      body.classList.remove('dark');
      body.classList.add('light');
    }
    if (iconContainer) {
      iconContainer.innerHTML = '<i data-lucide="moon" class="w-4 h-4 text-slate-700"></i>';
    }
  }

  initIcons();
}

// ============================================================================
// AUDIO SFX
// ============================================================================
function playMagnetSnapSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.09);
  } catch (e) {}
}

// ============================================================================
// AUTHENTICATION & GOOGLE SIGN-IN SYSTEM
// ============================================================================
function updateAuthUI() {
  const container = document.getElementById('auth-header-section');
  if (!container) return;

  if (state.currentUser) {
    const initial = (state.currentUser.name || 'U').charAt(0).toUpperCase();
    const isAdmin = state.currentUser.role === 'admin';

    container.innerHTML = `
      <div class="relative group">
        <button class="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition shadow-xs cursor-pointer">
          <div class="w-7 h-7 rounded-full ${isAdmin ? 'bg-gradient-to-tr from-amber-500 to-pink-600' : 'bg-pink-600'} text-white font-black text-xs flex items-center justify-center shadow-xs">
            ${initial}
          </div>
          <div class="hidden sm:flex flex-col text-left">
            <span class="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[100px]">${state.currentUser.name}</span>
            <span class="text-[9px] font-bold ${isAdmin ? 'text-amber-500' : 'text-pink-600 dark:text-pink-400'}">${isAdmin ? '★ Admin' : 'Customer'}</span>
          </div>
          <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400"></i>
        </button>

        <!-- Dropdown Menu -->
        <div class="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 hidden group-hover:block hover:block z-50 animate-in fade-in zoom-in-95 duration-150">
          <div class="p-2 border-b border-slate-100 dark:border-slate-800">
            <span class="text-xs font-bold text-slate-900 dark:text-white block truncate">${state.currentUser.name}</span>
            <span class="text-[11px] text-slate-400 truncate block">${state.currentUser.email}</span>
          </div>
          
          <button onclick="openMyOrdersModal()" class="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 hover:text-pink-600 rounded-xl flex items-center gap-2 transition cursor-pointer mt-1">
            <i data-lucide="package" class="w-4 h-4 text-pink-500"></i>
            <span>My Orders & UPI Tracking</span>
          </button>

          <button onclick="handleLogout()" class="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-2 transition cursor-pointer">
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button onclick="openAuthModal('login')" class="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-2 shadow-xs border border-slate-200 dark:border-slate-800 cursor-pointer">
        <i data-lucide="user" class="w-3.5 h-3.5 text-pink-500"></i>
        <span>Sign In</span>
      </button>
    `;
  }
  initIcons();
}

function openAuthModal(mode = 'login') {
  hideAuthError();
  switchAuthTab(mode);
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
  hideAuthError();
}

function switchAuthTab(tab) {
  hideAuthError();
  const isLogin = tab === 'login';
  const formLogin = document.getElementById('form-login');
  const formSignup = document.getElementById('form-signup');
  if (formLogin) formLogin.classList.toggle('hidden', !isLogin);
  if (formSignup) formSignup.classList.toggle('hidden', isLogin);

  const loginBtn = document.getElementById('auth-tab-login-btn');
  const signupBtn = document.getElementById('auth-tab-signup-btn');

  if (isLogin) {
    if (loginBtn) loginBtn.className = 'pb-2 text-sm font-extrabold text-pink-600 dark:text-pink-500 border-b-2 border-pink-600 dark:border-pink-500 cursor-pointer';
    if (signupBtn) signupBtn.className = 'pb-2 text-sm font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-white border-b-2 border-transparent cursor-pointer';
  } else {
    if (signupBtn) signupBtn.className = 'pb-2 text-sm font-extrabold text-pink-600 dark:text-pink-500 border-b-2 border-pink-600 dark:border-pink-500 cursor-pointer';
    if (loginBtn) loginBtn.className = 'pb-2 text-sm font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-white border-b-2 border-transparent cursor-pointer';
  }
}

function showAuthError(msg) {
  const banner = document.getElementById('auth-error-banner');
  const text = document.getElementById('auth-error-text');
  if (banner && text) {
    text.innerText = msg;
    banner.classList.remove('hidden');
  }
}

function hideAuthError() {
  const banner = document.getElementById('auth-error-banner');
  if (banner) banner.classList.add('hidden');
}

// Google Sign-In Modal Trigger
function handleGoogleSignIn() {
  const modal = document.getElementById('google-picker-modal');
  if (modal) modal.classList.remove('hidden');
}

// Confirm Google Account Selection & Authenticate with SQLite Backend
async function confirmGoogleAccount(name, email) {
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    const data = await res.json();

    if (data.success) {
      state.currentUser = data.user;
      localStorage.setItem('teenmagnets_user', JSON.stringify(data.user));
      updateAuthUI();
      const picker = document.getElementById('google-picker-modal');
      if (picker) picker.classList.add('hidden');
      closeAuthModal();
      showToast(`✓ Welcome, ${data.user.name}! Signed in via Google.`);
    } else {
      showToast('Google sign-in failed');
    }
  } catch (err) {
    console.error('Google Sign-in failed:', err);
    showToast('Failed to connect to authentication server');
  }
}

function submitCustomGoogleAccount() {
  const name = document.getElementById('custom-google-name').value.trim() || 'Google User';
  const email = document.getElementById('custom-google-email').value.trim();

  if (!email || !email.includes('@')) {
    showToast('Please enter a valid Gmail address');
    return;
  }

  confirmGoogleAccount(name, email);
}

async function handleLogin(e) {
  e.preventDefault();
  hideAuthError();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('btn-submit-login');

  if (btn) btn.innerText = 'Signing In...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success) {
      state.currentUser = data.user;
      localStorage.setItem('teenmagnets_user', JSON.stringify(data.user));
      updateAuthUI();
      closeAuthModal();
      showToast(`Welcome back, ${data.user.name}!`);
    } else {
      showAuthError(data.error || 'Invalid username or password');
    }
  } catch (err) {
    console.error('Login error:', err);
    showAuthError('Failed to connect to server');
  } finally {
    if (btn) btn.innerText = 'Sign In';
  }
}

async function handleSignup(e) {
  e.preventDefault();
  hideAuthError();
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const phone = document.getElementById('signup-phone').value;
  const password = document.getElementById('signup-password').value;
  const btn = document.getElementById('btn-submit-signup');

  if (btn) btn.innerText = 'Creating Account...';

  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });
    const data = await res.json();

    if (data.success) {
      state.currentUser = data.user;
      localStorage.setItem('teenmagnets_user', JSON.stringify(data.user));
      updateAuthUI();
      closeAuthModal();
      showToast(`Account created for ${data.user.name}!`);
    } else {
      showAuthError(data.error || 'Signup failed');
    }
  } catch (err) {
    console.error('Signup error:', err);
    showAuthError('Failed to connect to server');
  } finally {
    if (btn) btn.innerText = 'Create Account';
  }
}

function handleLogout() {
  state.currentUser = null;
  localStorage.removeItem('teenmagnets_user');
  updateAuthUI();
  showToast('Logged out successfully');
}

// ============================================================================
// MY ORDERS & TRACKING MODAL
// ============================================================================
async function openMyOrdersModal() {
  if (!state.currentUser) return;
  const modal = document.getElementById('my-orders-modal');
  const container = document.getElementById('my-orders-list');
  if (!modal || !container) return;

  modal.classList.remove('hidden');
  container.innerHTML = '<div class="text-center py-8 text-slate-400 text-xs">Loading orders...</div>';

  try {
    const res = await fetch(`/api/auth/my-orders?email=${encodeURIComponent(state.currentUser.email)}`);
    const data = await res.json();

    if (data.success && data.data.length > 0) {
      container.innerHTML = data.data.map(order => `
        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="font-mono font-bold text-pink-600 dark:text-pink-400">${order.order_number}</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 capitalize">${order.status}</span>
          </div>

          <div class="text-xs text-slate-600 dark:text-slate-300">
            <div><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</div>
            <div><strong>Shipping To:</strong> ${order.shipping_address}, ${order.city || ''}</div>
            <div><strong>Payment:</strong> ${order.payment_method} (${order.payment_status})</div>
            <div><strong>UPI Ref:</strong> <span class="font-mono text-pink-500">${order.upi_txn_id || 'Pending'}</span></div>
          </div>

          <div class="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
            <span class="text-slate-500 dark:text-slate-400">${order.items ? order.items.length : 1} square items</span>
            <span class="text-slate-900 dark:text-white text-sm font-black">₹${Number(order.total_amount).toFixed(2)}</span>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = `
        <div class="text-center py-12 text-slate-400 space-y-2">
          <i data-lucide="package-search" class="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600"></i>
          <p class="text-xs font-semibold text-slate-600 dark:text-slate-400">No orders placed under ${state.currentUser.email}</p>
        </div>
      `;
    }
    initIcons();
  } catch (err) {
    container.innerHTML = '<div class="text-center py-8 text-rose-500 text-xs">Failed to load orders</div>';
  }
}

// ============================================================================
// WISHLIST SYSTEM
// ============================================================================
function toggleWishlist(magnetId, event) {
  if (event) event.stopPropagation();
  const magnet = state.magnets.find(m => m.id === magnetId);
  if (!magnet) return;

  const existsIndex = state.wishlist.findIndex(item => item.id === magnetId);
  if (existsIndex > -1) {
    state.wishlist.splice(existsIndex, 1);
    showToast(`Removed "${magnet.title}" from Wishlist`);
  } else {
    state.wishlist.push(magnet);
    showToast(`Saved "${magnet.title}" to Wishlist! ❤️`);
  }

  localStorage.setItem('teenmagnets_wishlist', JSON.stringify(state.wishlist));
  updateWishlistUI();
  renderCatalogGrid();
}

function updateWishlistUI() {
  const count = state.wishlist.length;
  const badge = document.getElementById('wishlist-badge-count');
  if (badge) {
    badge.innerText = count;
    badge.style.transform = count > 0 ? 'scale(1)' : 'scale(0)';
  }

  const container = document.getElementById('wishlist-items-container');
  if (!container) return;

  if (state.wishlist.length === 0) {
    container.innerHTML = `
      <div class="py-16 text-center text-slate-400 space-y-3">
        <i data-lucide="heart" class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600"></i>
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Your wishlist is empty</p>
        <p class="text-xs text-slate-400">Tap the heart on any square magnet to save it for later!</p>
      </div>
    `;
    initIcons();
    return;
  }

  container.innerHTML = state.wishlist.map(item => `
    <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
      <div class="w-14 h-14 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center p-1 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm shrink-0">
        ${item.image_url ? `<img src="${item.image_url}" class="w-full h-full object-cover rounded-lg">` : item.image_svg}
      </div>

      <div class="flex-1 min-w-0">
        <h4 class="font-bold text-slate-900 dark:text-white text-xs truncate">${item.title}</h4>
        <span class="text-xs text-pink-600 dark:text-pink-400 font-bold">₹${Number(item.price).toFixed(2)}</span>
      </div>

      <button onclick="addToCart({ id: ${item.id}, title: '${escapeQuotes(item.title)}', price: ${item.price}, svg: '${escapeSvgForJson(item.image_svg)}', imgUrl: '${item.image_url || ''}', type: 'catalog' }); toggleWishlist(${item.id});" class="p-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer">
        <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i> Add
      </button>

      <button onclick="toggleWishlist(${item.id})" class="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    </div>
  `).join('');

  initIcons();
}

function toggleWishlistDrawer(show) {
  const drawer = document.getElementById('wishlist-drawer');
  if (drawer) drawer.classList.toggle('hidden', !show);
}

function moveAllWishlistToCart() {
  state.wishlist.forEach(item => {
    addToCart({
      id: item.id,
      title: item.title,
      price: item.price,
      svg: item.image_svg,
      imgUrl: item.image_url,
      type: 'catalog'
    });
  });
  state.wishlist = [];
  localStorage.setItem('teenmagnets_wishlist', '[]');
  updateWishlistUI();
  toggleWishlistDrawer(false);
  toggleCartModal(true);
  showToast('All wishlist items moved to cart!');
}

// ============================================================================
// NAVIGATION TABS
// ============================================================================
function switchTab(tabId) {
  state.activeTab = tabId;

  ['catalog', 'customizer', 'fridge', 'about'].forEach(tab => {
    const el = document.getElementById(`view-${tab}`);
    const navBtn = document.getElementById(`nav-${tab}`);
    if (el) el.classList.toggle('hidden', tab !== tabId);
    if (navBtn) {
      if (tab === tabId) {
        navBtn.className = 'nav-btn px-5 py-2 rounded-xl flex items-center gap-2 transition-all bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 font-bold shadow-xs';
      } else {
        navBtn.className = 'nav-btn px-5 py-2 rounded-xl flex items-center gap-2 transition-all text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-medium';
      }
    }
  });

  initIcons();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// CATALOG & PRODUCTS (SQUARE EDITION)
// ============================================================================
async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
    const data = await res.json();
    if (data.success) {
      state.categories = data.data;
      renderCategoryPills();
    }
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

function renderCategoryPills() {
  const container = document.getElementById('category-pills-container');
  if (!container) return;

  container.innerHTML = state.categories.map(cat => {
    const isActive = state.activeCategory === cat.id;
    return `
      <button onclick="filterByCategory('${cat.id}')" class="whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
        isActive 
          ? 'bg-pink-600 text-white shadow-md shadow-pink-600/20' 
          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      }">
        <span>${cat.name}</span>
        ${cat.magnet_count !== undefined ? `<span class="opacity-70 text-[10px]">(${cat.magnet_count})</span>` : ''}
      </button>
    `;
  }).join('');
}

function filterByCategory(catId) {
  state.activeCategory = catId;
  renderCategoryPills();
  loadCatalog();
}

function handleCatalogSearch(val) {
  state.searchQuery = val.trim();
  loadCatalog();
}

async function loadCatalog() {
  try {
    const sort = document.getElementById('filter-sort')?.value || 'featured';
    let url = `/api/magnets?category=${state.activeCategory}&sort=${sort}`;
    if (state.searchQuery) {
      url += `&search=${encodeURIComponent(state.searchQuery)}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      state.magnets = data.data;
      renderCatalogGrid();
    }
  } catch (err) {
    console.error('Failed to load magnets catalog:', err);
  }
}

function renderCatalogGrid() {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;

  if (state.magnets.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400 space-y-3">
        <i data-lucide="package-search" class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600"></i>
        <h3 class="text-base font-bold text-slate-700 dark:text-slate-300">No square magnets found</h3>
        <p class="text-xs text-slate-400">Try selecting "All Square Magnets" or clearing search</p>
      </div>
    `;
    initIcons();
    return;
  }

  grid.innerHTML = state.magnets.map(magnet => {
    const inWishlist = state.wishlist.some(w => w.id === magnet.id);
    return `
      <div class="group bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 hover:border-pink-500/50 magnet-card-shadow flex flex-col justify-between relative overflow-hidden transition-all duration-300">
        
        <!-- Square Magnet Visual Stage -->
        <div onclick="openProductModal(${magnet.id})" class="cursor-pointer relative w-full h-44 rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center p-3 overflow-hidden group-hover:scale-[1.02] transition-transform">
          <div class="relative z-10 w-full h-full flex items-center justify-center filter drop-shadow-md">
            ${magnet.image_url ? `<img src="${magnet.image_url}" class="w-full h-full object-cover rounded-xl shadow-sm">` : magnet.image_svg}
          </div>

          <!-- Finish Badge -->
          <div class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700">
            3"x3" • ${magnet.finish}
          </div>

          <!-- Wishlist Heart Button -->
          <button onclick="toggleWishlist(${magnet.id}, event)" title="${inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}" class="wishlist-btn ${inWishlist ? 'active' : ''} absolute top-2.5 left-2.5 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-pink-500 transition shadow-sm z-20 cursor-pointer">
            <i data-lucide="heart" class="w-4 h-4 ${inWishlist ? 'fill-pink-500 text-pink-500' : ''}"></i>
          </button>
        </div>

        <div class="pt-4 space-y-2">
          <div class="flex items-center justify-between text-xs font-semibold">
            <span class="uppercase tracking-wider text-[10px] text-pink-600 dark:text-pink-400 font-bold">${magnet.category_id}</span>
            <div class="flex items-center gap-1 text-amber-500 font-bold">
              <span>★</span>
              <span>${Number(magnet.average_rating || 5).toFixed(1)}</span>
            </div>
          </div>

          <h3 onclick="openProductModal(${magnet.id})" class="font-extrabold text-slate-900 dark:text-white text-base leading-snug cursor-pointer hover:text-pink-600 dark:hover:text-pink-400 transition truncate">
            ${magnet.title}
          </h3>

          <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            ${magnet.description}
          </p>

          <div class="pt-2 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 block font-semibold uppercase">Square Unit</span>
              <div class="text-lg font-black text-slate-900 dark:text-white">₹${Number(magnet.price).toFixed(2)}</div>
            </div>

            <div class="flex items-center gap-1.5">
              <button onclick="addCatalogMagnetToFridge(${magnet.id})" title="Stick on Fridge Sandbox" class="p-2.5 rounded-xl bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 text-pink-700 dark:text-pink-300 font-bold transition cursor-pointer">
                <i data-lucide="layout-grid" class="w-4 h-4"></i>
              </button>
              <button onclick="addToCart({ id: ${magnet.id}, title: '${escapeQuotes(magnet.title)}', price: ${magnet.price}, svg: '${escapeSvgForJson(magnet.image_svg)}', imgUrl: '${magnet.image_url || ''}', type: 'catalog' })" class="px-3.5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md shadow-pink-600/20 transition flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
  }).join('');

  initIcons();
}

function escapeQuotes(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'");
}

function escapeSvgForJson(svg) {
  if (!svg) return '';
  return svg.replace(/"/g, '&quot;').replace(/\n/g, ' ');
}

// ============================================================================
// PRODUCT QUICK VIEW MODAL
// ============================================================================
async function openProductModal(id) {
  try {
    const res = await fetch(`/api/magnets/${id}`);
    const data = await res.json();
    if (!data.success) return;

    const magnet = data.data;
    const modalContent = document.getElementById('product-modal-content');
    
    modalContent.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div class="bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 flex items-center justify-center min-h-[220px] shadow-inner border border-slate-200 dark:border-slate-700">
          <div class="w-full max-w-[200px] aspect-square flex items-center justify-center overflow-hidden rounded-xl">
            ${magnet.image_url ? `<img src="${magnet.image_url}" class="w-full h-full object-cover rounded-xl shadow-md">` : magnet.image_svg}
          </div>
        </div>

        <div class="space-y-4">
          <div class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 uppercase">
            ${magnet.category_id}
          </div>
          <h2 class="text-2xl font-black text-slate-900 dark:text-white leading-tight">${magnet.title}</h2>
          <div class="text-2xl font-black text-pink-600 dark:text-pink-400">₹${Number(magnet.price).toFixed(2)}</div>
          
          <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">${magnet.description}</p>
          
          <div class="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div><span class="text-slate-400">Dimensions:</span> <strong class="text-slate-700 dark:text-slate-200">3.0" x 3.0" Square</strong></div>
            <div><span class="text-slate-400">Finish:</span> <strong class="text-slate-700 dark:text-slate-200">${magnet.finish}</strong></div>
            <div><span class="text-slate-400">Magnetic Pull:</span> <strong class="text-slate-700 dark:text-slate-200">${magnet.magnet_strength}</strong></div>
            <div><span class="text-slate-400">Availability:</span> <strong class="text-emerald-600 dark:text-emerald-400">${magnet.stock} units in stock</strong></div>
          </div>

          <div class="flex gap-3 pt-2">
            <button onclick="addToCart({ id: ${magnet.id}, title: '${escapeQuotes(magnet.title)}', price: ${magnet.price}, svg: '${escapeSvgForJson(magnet.image_svg)}', imgUrl: '${magnet.image_url || ''}', type: 'catalog' }); closeProductModal();" class="flex-1 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
              <i data-lucide="shopping-bag" class="w-4 h-4"></i> Add To Cart
            </button>
            <button onclick="addCatalogMagnetToFridge(${magnet.id}); closeProductModal(); switchTab('fridge');" class="py-3 px-4 rounded-xl bg-purple-100 dark:bg-purple-900/60 hover:bg-purple-200 dark:hover:bg-purple-800 text-purple-800 dark:text-purple-300 font-bold text-sm transition flex items-center justify-center gap-1.5 cursor-pointer">
              <i data-lucide="layout-grid" class="w-4 h-4"></i> Try On Fridge
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('product-modal').classList.remove('hidden');
    initIcons();
  } catch (err) {
    console.error('Error opening product modal:', err);
  }
}

function closeProductModal() {
  document.getElementById('product-modal').classList.add('hidden');
}

// ============================================================================
// CUSTOM SQUARE PHOTO MAGNET STUDIO (DIY)
// ============================================================================
async function handleCustomPhotoUpload(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];

  const reader = new FileReader();
  reader.onload = function(e) {
    state.customizer.photoUrl = e.target.result;
    
    const imgEl = document.getElementById('custom-uploaded-img');
    const placeholderEl = document.getElementById('custom-placeholder-view');
    const btnText = document.getElementById('cust-upload-btn-text');

    if (imgEl && placeholderEl) {
      imgEl.src = e.target.result;
      imgEl.classList.remove('hidden');
      placeholderEl.classList.add('hidden');
    }
    if (btnText) btnText.innerText = `Photo: ${file.name.slice(0, 16)}...`;
    showToast('Photo fitted into 3"x3" square magnet!');
  };
  reader.readAsDataURL(file);

  const formData = new FormData();
  formData.append('photo', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      state.customizer.serverPhotoUrl = data.url;
    }
  } catch (err) {
    console.error('Photo upload failed:', err);
  }
}

function clearCustomPhoto() {
  state.customizer.photoUrl = null;
  state.customizer.serverPhotoUrl = null;
  const imgEl = document.getElementById('custom-uploaded-img');
  const placeholderEl = document.getElementById('custom-placeholder-view');
  const btnText = document.getElementById('cust-upload-btn-text');

  if (imgEl) {
    imgEl.src = '';
    imgEl.classList.add('hidden');
  }
  if (placeholderEl) placeholderEl.classList.remove('hidden');
  if (btnText) btnText.innerText = 'Select Picture / Artwork';
}

function updateCustomPreview() {
  const text = document.getElementById('cust-text')?.value || '';
  state.customizer.text = text;
  const textEl = document.getElementById('custom-preview-text');
  if (textEl) textEl.innerText = text || 'PREVIEW CAPTION';
}

function setCustomFont(font) {
  state.customizer.font = font;
  const textEl = document.getElementById('custom-preview-text');
  if (!textEl) return;

  textEl.className = 'text-sm text-slate-800 dark:text-slate-100 tracking-wide truncate max-w-full';
  if (font === 'cursive') textEl.classList.add('font-cursive');
  if (font === 'sans') textEl.classList.add('font-sans', 'font-extrabold');
  if (font === 'serif') textEl.classList.add('font-serif', 'font-bold');
  if (font === 'mono') textEl.classList.add('font-mono', 'font-bold');

  document.querySelectorAll('.cust-font-btn').forEach(b => {
    b.className = 'cust-font-btn flex-1 py-2 px-2 rounded-lg border text-xs font-sans border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 cursor-pointer';
  });
}

function setCustomSize(size, price) {
  state.customizer.size = size;
  state.customizer.dimensions = `${size} x ${size}`;
  state.customizer.price = price;

  const priceEl = document.getElementById('cust-unit-price');
  const labelEl = document.getElementById('cust-size-label');
  if (priceEl) priceEl.innerText = `₹${price.toFixed(2)}`;
  if (labelEl) labelEl.innerText = `${size} Square Unit`;

  // Update button highlights
  ['44', '48', '55'].forEach(s => {
    const btn = document.getElementById(`btn-size-${s}`);
    if (btn) {
      if (`${s}mm` === size) {
        btn.className = 'cust-size-btn p-3 rounded-2xl border text-center transition border-pink-500 bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold cursor-pointer';
      } else {
        btn.className = 'cust-size-btn p-3 rounded-2xl border text-center transition border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 cursor-pointer hover:border-pink-400';
      }
    }
  });

  showToast(`Size selected: ${size} (₹${price.toFixed(2)})`);
}

function setCustomFinish(finish) {
  state.customizer.finish = finish;
  const finishLayer = document.getElementById('custom-finish-layer');
  if (finishLayer) {
    finishLayer.className = `finish-${finish}`;
  }
}

function resetCustomizer() {
  state.customizer.photoUrl = '/assets/owners.jpg';
  state.customizer.serverPhotoUrl = '/assets/owners.jpg';
  state.customizer.size = '55mm';
  state.customizer.price = 99.00;
  const imgEl = document.getElementById('custom-uploaded-img');
  if (imgEl) {
    imgEl.src = '/assets/owners.jpg';
    imgEl.classList.remove('hidden');
  }
  const txtInput = document.getElementById('cust-text');
  if (txtInput) txtInput.value = 'Beach Adventures 🏍️✨';
  updateCustomPreview();
  setCustomSize('55mm', 99.00);
  setCustomFont('cursive');
  setCustomFinish('glossy');
}

function generateCustomMagnetPreviewHtml() {
  const { photoUrl, text, font, size } = state.customizer;
  return `
    <div class="w-32 h-32 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between items-center text-slate-900 dark:text-white select-none">
      <div class="w-full h-20 rounded-xl overflow-hidden bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
        ${photoUrl ? `<img src="${photoUrl}" class="w-full h-full object-cover">` : `<i data-lucide="camera" class="w-6 h-6 text-white"></i>`}
      </div>
      <span class="text-[9px] font-${font} truncate text-center w-full block mt-1">${text || 'Custom Square'} (${size || '55mm'})</span>
    </div>
  `;
}

function addCustomToFridge() {
  const html = generateCustomMagnetPreviewHtml();
  spawnMagnetOnFridge(html, 'Custom Square Photo Magnet');
  showToast('Custom square magnet placed on Fridge Sandbox!');
  switchTab('fridge');
}

function addCustomToCart() {
  const size = state.customizer.size || '55mm';
  const customItem = {
    id: 'custom-' + Date.now(),
    type: 'custom',
    title: `Custom ${size} Square Magnet: ${state.customizer.text || 'Personalized'}`,
    price: state.customizer.price || 99.00,
    imgUrl: state.customizer.photoUrl || state.customizer.serverPhotoUrl,
    html: generateCustomMagnetPreviewHtml(),
    details: { ...state.customizer, size: size, dimensions: `${size} x ${size}` }
  };

  addToCart(customItem);
  showToast(`Custom ${size} square magnet added to cart!`);
  toggleCartModal(true);
}

// ============================================================================
// REFRIGERATOR SIMULATOR (SANDBOX)
// ============================================================================
function setFridgeColor(color) {
  const door = document.getElementById('fridge-door');
  if (!door) return;
  door.classList.remove('fridge-silver', 'fridge-mint', 'fridge-cream', 'fridge-dark');
  door.classList.add(`fridge-${color}`);
}

function initFridgeWithSampleMagnets() {
  setTimeout(() => {
    if (state.magnets.length > 0) {
      addCatalogMagnetToFridge(state.magnets[0].id, 120, 160);
      if (state.magnets[1]) addCatalogMagnetToFridge(state.magnets[1].id, 320, 240);
    }
  }, 600);
}

function addCatalogMagnetToFridge(id, x, y) {
  const magnet = state.magnets.find(m => m.id === id);
  if (!magnet) return;

  const content = `
    <div class="w-28 h-28 p-1 flex items-center justify-center">
      ${magnet.image_url ? `<img src="${magnet.image_url}" class="w-full h-full object-cover rounded-xl shadow-md">` : magnet.image_svg}
    </div>
  `;
  spawnMagnetOnFridge(content, magnet.title, x, y);
}

function addRandomCatalogMagnetToFridge() {
  if (!state.magnets.length) return;
  const rand = state.magnets[Math.floor(Math.random() * state.magnets.length)];
  addCatalogMagnetToFridge(rand.id);
  showToast(`Stuck "${rand.title}" to fridge!`);
}

function spawnMagnetOnFridge(innerHtml, title, initialX, initialY) {
  const container = document.getElementById('fridge-magnets-container');
  if (!container) return;

  const magnetDiv = document.createElement('div');
  magnetDiv.className = 'fridge-magnet-item';
  magnetDiv.innerHTML = innerHtml;

  const posX = initialX !== undefined ? initialX : Math.floor(Math.random() * 380) + 40;
  const posY = initialY !== undefined ? initialY : Math.floor(Math.random() * 320) + 70;
  const rotate = Math.floor(Math.random() * 16) - 8;

  magnetDiv.style.left = `${posX}px`;
  magnetDiv.style.top = `${posY}px`;
  magnetDiv.style.transform = `rotate(${rotate}deg)`;
  magnetDiv.style.zIndex = 20 + state.fridgeMagnets.length;

  makeDraggable(magnetDiv);

  container.appendChild(magnetDiv);
  state.fridgeMagnets.push(magnetDiv);
  updateFridgeBadge();
  playMagnetSnapSound();
  initIcons();
}

function makeDraggable(el) {
  let isDragging = false;
  let startX, startY, origLeft, origTop;

  const onPointerDown = (e) => {
    isDragging = true;
    startX = e.clientX || e.touches?.[0]?.clientX;
    startY = e.clientY || e.touches?.[0]?.clientY;
    origLeft = parseInt(el.style.left || 0);
    origTop = parseInt(el.style.top || 0);
    el.style.zIndex = 1000 + Date.now() % 1000;
    playMagnetSnapSound();

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    const dx = clientX - startX;
    const dy = clientY - startY;

    el.style.left = `${origLeft + dx}px`;
    el.style.top = `${origTop + dy}px`;
  };

  const onPointerUp = () => {
    if (isDragging) {
      isDragging = false;
      playMagnetSnapSound();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }
  };

  el.addEventListener('pointerdown', onPointerDown);
}

function clearFridge() {
  const container = document.getElementById('fridge-magnets-container');
  if (container) container.innerHTML = '';
  state.fridgeMagnets = [];
  updateFridgeBadge();
  showToast('Fridge cleared!');
}

function updateFridgeBadge() {
  const badge = document.getElementById('fridge-count-badge');
  if (badge) badge.innerText = state.fridgeMagnets.length;
}

// ============================================================================
// SHOPPING CART & MULTI-STEP CHECKOUT (1. ADDRESS -> 2. UPI PAYMENT)
// ============================================================================
function addToCart(item) {
  const existing = state.cart.find(i => i.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ ...item, quantity: 1 });
  }

  saveCart();
  updateCartUI();
  showToast(`Added "${item.title}" to cart!`);
  playMagnetSnapSound();
}

function updateCartItemQty(id, delta) {
  const item = state.cart.find(i => i.id === id);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter(i => i.id !== id);
  }

  saveCart();
  updateCartUI();
}

function removeCartItem(id) {
  state.cart = state.cart.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('teenmagnets_cart', JSON.stringify(state.cart));
}

function updateCartUI() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById('cart-badge-count');
  if (badge) {
    badge.innerText = count;
    badge.style.transform = count > 0 ? 'scale(1)' : 'scale(0)';
  }

  const itemsContainer = document.getElementById('cart-items-container');
  if (!itemsContainer) return;

  if (state.cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="py-16 text-center text-slate-400 space-y-3">
        <i data-lucide="shopping-bag" class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600"></i>
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Your magnet cart is empty</p>
        <button onclick="toggleCartModal(false); switchTab('catalog')" class="px-4 py-2 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 text-xs font-bold hover:bg-pink-100 transition cursor-pointer">
          Browse Square Magnets
        </button>
      </div>
    `;
    updateCartTotals(0);
    initIcons();
    return;
  }

  let subtotal = 0;

  itemsContainer.innerHTML = state.cart.map(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    return `
      <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div class="w-14 h-14 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center p-1 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm shrink-0">
          ${item.imgUrl ? `<img src="${item.imgUrl}" class="w-full h-full object-cover rounded-lg">` : (item.svg || item.html || `<div class="text-[10px] font-bold text-center">${item.title}</div>`)}
        </div>

        <div class="flex-1 min-w-0">
          <h4 class="font-bold text-slate-900 dark:text-white text-xs truncate">${item.title}</h4>
          <span class="text-xs text-pink-600 dark:text-pink-400 font-bold">₹${Number(item.price).toFixed(2)}</span>
        </div>

        <div class="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button onclick="updateCartItemQty('${item.id}', -1)" class="w-5 h-5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer">-</button>
          <span class="text-xs font-bold text-slate-900 dark:text-white w-4 text-center">${item.quantity}</span>
          <button onclick="updateCartItemQty('${item.id}', 1)" class="w-5 h-5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer">+</button>
        </div>

        <button onclick="removeCartItem('${item.id}')" class="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    `;
  }).join('');

  updateCartTotals(subtotal);
  initIcons();
}

function updateCartTotals(subtotal) {
  const total = subtotal;
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-total');

  if (subtotalEl) subtotalEl.innerText = `₹${subtotal.toFixed(2)}`;
  if (totalEl) totalEl.innerText = `₹${total.toFixed(2)}`;
}

function toggleCartModal(show) {
  const drawer = document.getElementById('cart-drawer');
  if (drawer) drawer.classList.toggle('hidden', !show);
  if (show) goToCartItemsStep();
}

// CHECKOUT NAVIGATION: STEP 1 (ADDRESS) AND STEP 2 (PAYMENT)
function goToCartItemsStep() {
  document.getElementById('cart-items-container')?.classList.remove('hidden');
  document.getElementById('cart-checkout-panel')?.classList.remove('hidden');
  document.getElementById('checkout-address-panel')?.classList.add('hidden');
  document.getElementById('checkout-payment-panel')?.classList.add('hidden');

  const titleEl = document.getElementById('cart-drawer-title');
  if (titleEl) titleEl.innerText = 'Your Magnet Cart';
}

function goToAddressStep() {
  if (state.cart.length === 0) {
    showToast('Your cart is empty');
    return;
  }

  // Pre-fill from user profile or saved address
  const saved = state.savedAddress || {};
  const user = state.currentUser || {};

  const nameEl = document.getElementById('order-name');
  const phoneEl = document.getElementById('order-phone');
  const emailEl = document.getElementById('order-email');
  const addressEl = document.getElementById('order-address');
  const cityEl = document.getElementById('order-city');
  const pincodeEl = document.getElementById('order-pincode');

  if (nameEl && !nameEl.value) nameEl.value = saved.name || user.name || '';
  if (phoneEl && !phoneEl.value) phoneEl.value = saved.phone || user.phone || '9396310900';
  if (emailEl && !emailEl.value) emailEl.value = saved.email || user.email || '';
  if (addressEl && !addressEl.value) addressEl.value = saved.address || '';
  if (cityEl && !cityEl.value) cityEl.value = saved.city || '';
  if (pincodeEl && !pincodeEl.value) pincodeEl.value = saved.pincode || '';

  document.getElementById('cart-items-container')?.classList.add('hidden');
  document.getElementById('cart-checkout-panel')?.classList.add('hidden');
  document.getElementById('checkout-address-panel')?.classList.remove('hidden');
  document.getElementById('checkout-payment-panel')?.classList.add('hidden');

  const titleEl = document.getElementById('cart-drawer-title');
  if (titleEl) titleEl.innerText = 'Step 1: Shipping Address';
}

function handleAddressSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('order-name').value.trim();
  const phone = document.getElementById('order-phone').value.trim();
  const email = document.getElementById('order-email').value.trim();
  const address = document.getElementById('order-address').value.trim();
  const city = document.getElementById('order-city').value.trim();
  const pincode = document.getElementById('order-pincode').value.trim();

  if (!name || !phone || !email || !address || !city || !pincode) {
    showToast('Please fill all required address fields');
    return;
  }

  // Save address for convenient future orders
  state.savedAddress = { name, phone, email, address, city, pincode };
  localStorage.setItem('teenmagnets_saved_address', JSON.stringify(state.savedAddress));

  // Update Summary on Step 2 Payment panel
  const sName = document.getElementById('summary-address-name');
  const sPhone = document.getElementById('summary-address-phone');
  const sText = document.getElementById('summary-address-text');

  if (sName) sName.innerText = name;
  if (sPhone) sPhone.innerText = `📱 ${phone} • ✉️ ${email}`;
  if (sText) sText.innerText = `📍 ${address}, ${city} - ${pincode}`;

  goToPaymentStep();
}

function goToPaymentStep() {
  const subtotal = state.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const upiPayableEl = document.getElementById('upi-payable-amount');
  if (upiPayableEl) upiPayableEl.innerText = `₹${subtotal.toFixed(2)}`;

  renderUpiQrCode(subtotal);

  document.getElementById('cart-items-container')?.classList.add('hidden');
  document.getElementById('cart-checkout-panel')?.classList.add('hidden');
  document.getElementById('checkout-address-panel')?.classList.add('hidden');
  document.getElementById('checkout-payment-panel')?.classList.remove('hidden');

  const titleEl = document.getElementById('cart-drawer-title');
  if (titleEl) titleEl.innerText = 'Step 2: UPI Payment';
}

function renderUpiQrCode(amount) {
  const qrContainer = document.getElementById('upi-qrcode');
  const deeplinkBtn = document.getElementById('btn-upi-deeplink');
  if (!qrContainer) return;

  qrContainer.innerHTML = '';
  const upiUri = `upi://pay?pa=9396310900@ybl&pn=Teen%20Magnets&am=${amount.toFixed(2)}&cu=INR&tn=TeenMagnetsOrder`;

  if (window.QRCode) {
    new QRCode(qrContainer, {
      text: upiUri,
      width: 140,
      height: 140,
      colorDark: '#0f172a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  if (deeplinkBtn) {
    deeplinkBtn.href = upiUri;
  }
}

async function handlePlaceOrder(e) {
  e.preventDefault();

  const saved = state.savedAddress || {};
  const name = document.getElementById('order-name').value.trim() || saved.name;
  const email = document.getElementById('order-email').value.trim() || saved.email;
  const phone = document.getElementById('order-phone').value.trim() || saved.phone;
  const address = document.getElementById('order-address').value.trim() || saved.address;
  const city = document.getElementById('order-city').value.trim() || saved.city;
  const pincode = document.getElementById('order-pincode').value.trim() || saved.pincode;
  const upi_utr = document.getElementById('order-upi-utr').value.trim();

  const total_amount = state.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemsSnapshot = [...state.cart];

  const btnConfirm = document.getElementById('btn-confirm-order');
  if (btnConfirm) btnConfirm.innerText = 'Submitting Order...';

  const orderPayload = {
    user_id: state.currentUser ? state.currentUser.id : null,
    customer_name: name,
    customer_email: email,
    customer_phone: phone,
    shipping_address: `${address}, ${city} - ${pincode}`,
    city: city,
    postal_code: pincode,
    total_amount: total_amount,
    payment_method: 'UPI (9396310900)',
    upi_id: '9396310900@ybl',
    upi_txn_id: upi_utr || 'Pending UTR Submission',
    items: state.cart.map(item => ({
      item_type: item.type || 'catalog',
      magnet_id: typeof item.id === 'number' ? item.id : null,
      title: item.title,
      unit_price: item.price,
      quantity: item.quantity,
      details: item.details || {}
    }))
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const data = await res.json();

    if (data.success) {
      // Clear Cart
      state.cart = [];
      saveCart();
      updateCartUI();
      toggleCartModal(false);

      // Build WhatsApp Notification Message for Number: 9396310899
      const orderItemsText = itemsSnapshot.map(i => `• ${i.quantity}x ${i.title} (₹${(i.price * i.quantity).toFixed(2)})`).join('\n');
      const whatsappMsg = `🌟 *NEW TEEN MAGNETS ORDER!* 🌟\n\n📦 *Order ID:* ${data.order_number}\n👤 *Customer:* ${name}\n📱 *Phone:* ${phone}\n✉️ *Email:* ${email}\n📍 *Delivery Address:* ${address}, ${city} - ${pincode}\n💰 *Total Amount:* ₹${total_amount.toFixed(2)}\n💳 *Payment:* UPI (9396310900@ybl)\n🔢 *UPI Ref / UTR:* ${upi_utr || 'Pending verification'}\n\n🛍️ *Items Ordered:*\n${orderItemsText}\n\n✨ _Please confirm order & dispatch 3"x3" square fridge magnets!_`;

      const whatsappUrl = `https://wa.me/919396310899?text=${encodeURIComponent(whatsappMsg)}`;

      // Show Order Success Modal with WhatsApp button to 9396310899
      showOrderSuccessModal(data.order_number, name, total_amount, `${address}, ${city}`, whatsappUrl);

      // Trigger automatic WhatsApp open in new window
      try {
        window.open(whatsappUrl, '_blank');
      } catch (err) {}

      showToast(`🎉 Order ${data.order_number} confirmed! WhatsApp notification sent.`);
    } else {
      showToast(data.error || 'Failed to place order');
    }
  } catch (err) {
    console.error('Checkout failed:', err);
    showToast('Checkout failed. Please check connection.');
  } finally {
    if (btnConfirm) btnConfirm.innerText = 'Confirm & Place Order';
  }
}

function showOrderSuccessModal(orderNumber, name, total, address, whatsappUrl) {
  const modal = document.getElementById('order-success-modal');
  const numEl = document.getElementById('success-order-number');
  const nameEl = document.getElementById('success-customer-name');
  const amtEl = document.getElementById('success-order-amount');
  const addrEl = document.getElementById('success-order-address');
  const waBtn = document.getElementById('btn-success-whatsapp');

  if (numEl) numEl.innerText = orderNumber;
  if (nameEl) nameEl.innerText = name;
  if (amtEl) amtEl.innerText = `₹${total.toFixed(2)}`;
  if (addrEl) addrEl.innerText = address;
  if (waBtn) waBtn.href = whatsappUrl;

  if (modal) modal.classList.remove('hidden');
  initIcons();
}

// TOAST NOTIFICATIONS
function showToast(message) {
  const toast = document.getElementById('toast');
  const msg = document.getElementById('toast-message');
  if (!toast || !msg) return;

  msg.innerText = message;
  toast.classList.remove('translate-y-24', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.add('translate-y-24', 'opacity-0');
    toast.classList.remove('translate-y-0', 'opacity-100');
  }, 3200);
}
