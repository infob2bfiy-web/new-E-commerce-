// Bangladeshi Organic Grocery - Main Application JavaScript File
import { 
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  BANGLADESH_DISTRICTS, 
  DEFAULT_SITE_SETTINGS, 
  INITIAL_BANNERS, 
  INITIAL_COUPONS 
} from './data.js';

// Global Initializations
export function initDB() {
  if (!localStorage.getItem('products')) {
    localStorage.setItem('products', JSON.stringify(INITIAL_PRODUCTS));
  }
  if (!localStorage.getItem('categories')) {
    localStorage.setItem('categories', JSON.stringify(INITIAL_CATEGORIES));
  }
  if (!localStorage.getItem('siteSettings')) {
    localStorage.setItem('siteSettings', JSON.stringify(DEFAULT_SITE_SETTINGS));
  }
  if (!localStorage.getItem('banners')) {
    localStorage.setItem('banners', JSON.stringify(INITIAL_BANNERS));
  }
  if (!localStorage.getItem('coupons')) {
    localStorage.setItem('coupons', JSON.stringify(INITIAL_COUPONS));
  }
  if (!localStorage.getItem('orders')) {
    localStorage.setItem('orders', JSON.stringify([]));
  }
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([
      { name: "Demo User", email: "user@test.com", phone: "01700000000", password: "123", address: "Dhaka, Bangladesh" }
    ]));
  }
}

// Helpers
export function getProducts() {
  return JSON.parse(localStorage.getItem('products') || '[]');
}
export function getCategories() {
  return JSON.parse(localStorage.getItem('categories') || '[]');
}
export function getSettings() {
  return JSON.parse(localStorage.getItem('siteSettings') || '{}');
}
export function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}
export function getWishlist() {
  return JSON.parse(localStorage.getItem('wishlist') || '[]');
}
export function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

// Show Custom Toast
export function showToast(message, type = "success") {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-5 right-5 sm:bottom-10 sm:right-10 z-[100] flex flex-col gap-3 max-w-[90%] sm:max-w-md';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  const bgClass = type === "success" ? "bg-emerald-600" : type === "danger" ? "bg-red-600" : "bg-orange-500";
  toast.className = `toast px-5 py-3 rounded-lg text-white font-medium shadow-xl flex items-center gap-3 transition-all duration-300 ${bgClass}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="ml-auto text-white hover:text-emerald-100 font-bold focus:outline-none" onclick="this.parentElement.remove()">✕</button>
  `;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Cart Logic
export function addToCart(productId, quantity = 1, forceRedirect = false) {
  let cart = getCart();
  const products = getProducts();
  const prod = products.find(p => p.id === productId);
  if (!prod) return;
  
  if (prod.stock <= 0) {
    showToast("দুঃখিত, উপাদানটি শেষ হয়ে গেছে!", "danger");
    return;
  }

  const existingIndex = cart.findIndex(item => item.id === productId && !item.isFreeItem);
  if (existingIndex > -1) {
    cart[existingIndex].qty += Number(quantity);
  } else {
    cart.push({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      discountPrice: prod.discountPrice || prod.price,
      image: prod.image,
      tag: prod.tag,
      qty: Number(quantity),
      isFreeItem: false
    });
  }
  
  // Buy 1 Get 1 Free auto-add logic
  if (prod.tag === "Buy 1 Get 1") {
    const freeIndex = cart.findIndex(item => item.id === productId && item.isFreeItem);
    if (freeIndex > -1) {
      cart[freeIndex].qty += Number(quantity);
    } else {
      cart.push({
        id: prod.id,
        name: `🎁 (FREE - BOGO) ${prod.name}`,
        price: 0,
        discountPrice: 0,
        image: prod.image,
        qty: Number(quantity),
        isFreeItem: true
      });
    }
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  showToast("আইটেমটি কার্টে যুক্ত হয়েছে।", "success");
  updateCartBadges();
  
  if (forceRedirect) {
    setTimeout(() => {
      window.location.href = '/checkout.html';
    }, 200);
  }
}

export function removeFromCart(productId, isFreeItem = false) {
  let cart = getCart();
  cart = cart.filter(item => !(item.id === productId && item.isFreeItem === isFreeItem));
  
  // If we remove the main item, also remove its free companion in "Buy 1 Get 1"
  if (!isFreeItem) {
    cart = cart.filter(item => !(item.id === productId && item.isFreeItem === true));
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  showToast("আইটেমটি কার্ট থেকে সরানো হয়েছে।", "danger");
  updateCartBadges();
}

export function updateCartQty(productId, newQty, isFreeItem = false) {
  let cart = getCart();
  const index = cart.findIndex(item => item.id === productId && item.isFreeItem === isFreeItem);
  if (index > -1) {
    if (newQty <= 0) {
      removeFromCart(productId, isFreeItem);
      return;
    }
    cart[index].qty = Number(newQty);
    
    // Sync free BOGO quantity
    if (!isFreeItem && cart[index].tag === "Buy 1 Get 1") {
      const freeIndex = cart.findIndex(item => item.id === productId && item.isFreeItem === true);
      if (freeIndex > -1) {
        cart[freeIndex].qty = Number(newQty);
      }
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadges();
  }
}

export function clearCart() {
  localStorage.setItem('cart', JSON.stringify([]));
  updateCartBadges();
}

// Wishlist Logic
export function toggleWishlist(productId) {
  let wishlist = getWishlist();
  const products = getProducts();
  const prod = products.find(p => p.id === productId);
  if (!prod) return;
  
  const index = wishlist.findIndex(item => item.id === productId);
  if (index > -1) {
    wishlist.splice(index, 1);
    showToast("উইশলিস্ট থেকে সরানো হয়েছে!", "danger");
  } else {
    wishlist.push(prod);
    showToast("উইশলিস্টে যুক্ত করা হয়েছে!", "success");
  }
  
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  updateWishlistBadges();
}

// Update Badges & Counts
export function updateCartBadges() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + (item.isFreeItem ? 0 : item.qty), 0);
  
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = totalItems;
    if (totalItems > 0) el.classList.remove('hidden');
    else el.classList.add('hidden');
  });
  
  // If we are currently on the cart page, reload dynamic sections
  if (window.location.pathname.includes('cart.html')) {
    renderCartPageInside();
  }
}

export function updateWishlistBadges() {
  const wishlist = getWishlist();
  const count = wishlist.length;
  
  document.querySelectorAll('.wishlist-count').forEach(el => {
    el.textContent = count;
    if (count > 0) el.classList.remove('hidden');
    else el.classList.add('hidden');
  });
  
  if (window.location.pathname.includes('wishlist.html')) {
    renderWishlistPageInside();
  }
}

// Injects Navbar & Footer dynamically
export function injectSharedLayouts() {
  const settings = getSettings();
  const categories = getCategories();
  const currentUser = getCurrentUser();

  // Dynamically Inject Favicon
  if (settings.favicon) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = settings.favicon;

    let shortcutLink = document.querySelector("link[rel~='shortcut']");
    if (!shortcutLink) {
      shortcutLink = document.createElement('link');
      shortcutLink.rel = 'shortcut icon';
      document.head.appendChild(shortcutLink);
    }
    shortcutLink.href = settings.favicon;
  }
  
  // 1. Shared Header
  const header = document.getElementById('shared-header');
  if (header) {
    header.className = "relative z-45 block";
    const isCustomLogo = settings.logoUrl && 
                         settings.logoUrl.trim() !== "" && 
                         !settings.logoUrl.includes("images.unsplash.com/photo-1542838132");

    let logoMarkup = "";
    if (isCustomLogo) {
      logoMarkup = `<img src="${settings.logoUrl}" alt="${settings.siteName || 'আম্রপালি'}" class="h-9 md:h-11 w-auto object-contain max-w-[200px]" />`;
    } else {
      const name = settings.siteName || "আম্রপালি";
      if (name === "আম্রপালি") {
        logoMarkup = `
          <span class="font-black text-2xl md:text-3.5xl tracking-tight select-none font-sans flex items-center">
            <span class="text-[#f97316]">আম্র</span><span class="text-slate-900 font-extrabold">পালি</span>
          </span>
        `;
      } else {
        const words = name.trim().split(" ");
        if (words.length > 1) {
          logoMarkup = `
            <span class="font-black text-2.5xl md:text-3.5xl tracking-tight select-none font-sans flex items-center">
              <span class="text-[#f97316]">${words[0]}</span><span class="text-slate-900 ml-1.5 font-extrabold">${words.slice(1).join(" ")}</span>
            </span>
          `;
        } else {
          const mid = Math.ceil(name.length / 2);
          const first = name.substring(0, mid);
          const second = name.substring(mid);
          logoMarkup = `
            <span class="font-black text-2.5xl md:text-3.5xl tracking-tight select-none font-sans flex items-center">
              <span class="text-[#f97316]">${first}</span><span class="text-slate-900 font-extrabold">${second}</span>
            </span>
          `;
        }
      }
    }

    header.innerHTML = `
      <!-- Announcement bar -->
      <div class="bg-emerald-700 text-white text-xs sm:text-sm py-2 px-4 font-medium select-none flex justify-between items-center relative z-50">
        <div class="mx-auto flex items-center gap-2 text-center overflow-x-auto no-scrollbar whitespace-nowrap scroll-smooth">
          <span class="inline-block animate-pulse">📢</span>
          <span>${settings.announcement || settings.tagline}</span>
        </div>
      </div>
      
      <!-- Top White Header Row exactly matching the reference layout -->
      <div class="bg-white border-b border-gray-100 py-3.5 px-4 md:px-8 max-w-7xl mx-auto flex items-center justify-between gap-4 z-40 relative">
        
        <!-- Logo on the left styled dynamically from admin -->
        <a href="/index.html" class="flex-shrink-0 flex items-center gap-2 hover:opacity-95 transition-opacity select-none -translate-y-[1px]">
          ${logoMarkup}
        </a>

        <!-- Search Bar with Live Suggestions in the center -->
        <div class="relative flex-1 max-w-[620px] mx-2 md:mx-6 hidden md:block">
          <div class="relative flex items-center w-full">
            <input 
              type="text" 
              id="global-search-input" 
              placeholder="Enter product name..." 
              class="w-full bg-white border border-gray-200 focus:border-gray-300 rounded-full py-3.5 pl-6 pr-14 text-[13.5px] outline-none transition-all placeholder:text-gray-400 text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
            <!-- Black rounded search action button exactly like reference -->
            <button class="absolute right-1 top-1 bottom-1 bg-[#111111] hover:bg-black text-white rounded-full w-14 flex items-center justify-center transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-white"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </div>
          <!-- Live suggestions drop -->
          <div id="live-suggestions" class="absolute left-0 top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 max-h-96 overflow-y-auto hidden z-[999] p-1"></div>
        </div>

        <!-- Right side action icons precisely grouped -->
        <div class="hidden md:flex items-center gap-5 lg:gap-7 flex-shrink-0 select-none">
          
          <!-- Track Order -->
          <a href="/order-tracking.html" class="group flex flex-col items-center justify-center gap-1 text-center cursor-pointer relative py-0.5">
            <div class="text-slate-700 group-hover:text-orange-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="stroke-[1.8]"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            </div>
            <span class="text-[11px] font-semibold text-slate-500 group-hover:text-slate-800 transition-colors font-sans whitespace-nowrap">Track Order</span>
          </a>

          <!-- Sign In / Dashboard-->
          <a href="${currentUser ? '/dashboard.html' : '/login.html'}" class="group flex flex-col items-center justify-center gap-1 text-center cursor-pointer relative py-0.5">
            <div class="text-slate-700 group-hover:text-orange-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="stroke-[1.8]"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <span class="text-[11px] font-semibold text-slate-500 group-hover:text-slate-800 transition-colors font-sans whitespace-nowrap">${currentUser ? 'Dashboard' : 'Sign In'}</span>
          </a>

          <!-- Wishlist -->
          <a href="/wishlist.html" class="group flex flex-col items-center justify-center gap-1 text-center cursor-pointer relative py-0.5">
            <div class="text-slate-700 group-hover:text-red-500 transition-colors relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="stroke-[1.8]"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              <span class="wishlist-count absolute -top-1 -right-1.5 bg-red-600 text-white font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white hidden">0</span>
            </div>
            <span class="text-[11px] font-semibold text-slate-500 group-hover:text-slate-800 transition-colors font-sans whitespace-nowrap">Wishlist</span>
          </a>

          <!-- Cart with high-contrast black badge -->
          <a href="/cart.html" class="group flex flex-col items-center justify-center gap-1 text-center cursor-pointer relative py-0.5">
            <div class="text-slate-700 group-hover:text-emerald-600 transition-colors relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="stroke-[1.8]"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              <!-- Cart count black badge aligned to top-right of icon -->
              <span class="cart-count absolute -top-1.5 -right-2 bg-[#111111] text-white font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white hidden">0</span>
            </div>
            <span class="text-[11px] font-semibold text-slate-500 group-hover:text-slate-800 transition-colors font-sans whitespace-nowrap font-sans">Cart</span>
          </a>

          <!-- More Button with dynamic drawer open/close -->
          <button id="desktop-more-menu-btn" class="group flex flex-col items-center justify-center gap-1 text-center cursor-pointer relative py-0.5 focus:outline-none">
            <div class="text-slate-700 group-hover:text-emerald-650 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="stroke-[1.8]"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </div>
            <span class="text-[11px] font-semibold text-slate-500 group-hover:text-slate-800 transition-colors font-sans whitespace-nowrap">More</span>
          </button>

        </div>
      </div>

      <!-- Mobile Search bar row (only visible on mobile below the logo header) -->
      <div class="bg-white px-4 pb-3 border-b border-gray-100 md:hidden">
        <div class="relative flex items-center w-full">
          <input 
            type="text" 
            id="global-search-input-mobile" 
            placeholder="Enter product name..." 
            class="w-full bg-slate-50 border border-gray-200 focus:border-gray-200 rounded-full py-2.5 pl-5 pr-12 text-sm outline-none transition-all placeholder:text-gray-400 text-slate-800"
          >
          <button class="absolute right-1 top-1 bottom-1 bg-[#111111] hover:bg-black text-white rounded-full w-10 flex items-center justify-center transition cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-white"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
          <div id="live-suggestions-mobile" class="absolute left-0 top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 max-h-80 overflow-y-auto hidden z-[999] p-1"></div>
        </div>
      </div>

      <!-- Bottom Dark Green Category Navigation dynamically loaded -->
      <div class="bg-[#021c15] text-white/95 select-none w-full border-b border-emerald-950/40 relative z-30">
        <div class="max-w-7xl mx-auto px-4 md:px-8">
          <div class="flex items-center gap-x-5 lg:gap-x-7 py-3 overflow-x-auto lg:overflow-visible no-scrollbar whitespace-nowrap scroll-smooth font-sans justify-start lg:justify-center w-full">
            ${categories.map(cat => {
              const hasSubs = cat.subcategories && cat.subcategories.length > 0;
              if (hasSubs) {
                return `
                  <div class="relative group py-1 border-b-2 border-transparent hover:border-emerald-500/80 flex-shrink-0">
                    <a href="/shop.html?category=${cat.id}" class="text-white hover:text-emerald-300 font-medium text-[13.5px] transition flex items-center gap-1 cursor-pointer">
                      <span>${cat.name}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="transition-transform duration-200 group-hover:rotate-180 opacity-80"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </a>
                    <!-- Dropdown Menu (only shown on desktop lg screen hover) -->
                    <div class="absolute left-0 top-full pt-1.5 hidden lg:group-hover:block z-[9999] min-w-[170px] animate-fade-in shadow-xl rounded-lg">
                      <div class="bg-white rounded-lg shadow-xl py-1.5 border border-gray-150 text-slate-700 text-xs font-semibold">
                        ${cat.subcategories.map(sub => `
                          <a href="/shop.html?category=${cat.id}&subcategory=${encodeURIComponent(sub)}" class="block px-4 py-2 hover:bg-emerald-50 hover:text-emerald-800 transition text-left">${sub}</a>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                `;
              } else {
                return `
                  <div class="py-1 border-b-2 border-transparent hover:border-emerald-500/80 flex-shrink-0 font-sans">
                    <a href="/shop.html?category=${cat.id}" class="text-white hover:text-emerald-300 font-medium text-[13.5px] transition cursor-pointer">${cat.name}</a>
                  </div>
                `;
              }
            }).join('')}
          </div>
        </div>
      </div>

      <!-- "More" Slide-out Panel Overlay (drawer) -->
      <div id="desktop-more-drawer" class="fixed inset-0 bg-black/60 z-[100] hidden transition-opacity duration-300 backdrop-blur-xs">
        <div class="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl p-6 overflow-y-auto transform translate-x-full transition-transform duration-300 font-sans" id="desktop-more-drawer-content">
          <div class="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
            <h5 class="text-base font-bold text-slate-800">অতিরিক্ত মেনু ও লিংকসমূহ</h5>
            <button id="close-desktop-more-btn" class="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition focus:outline-none cursor-pointer">✕</button>
          </div>
          
          <!-- Useful Links inside the More menu -->
          <div class="space-y-6 text-sm font-semibold text-slate-700">
            <div>
              <p class="text-[10px] tracking-wider uppercase text-slate-400 font-black mb-3">কাস্টমার সার্ভিস</p>
              <div class="space-y-3.5 pl-1.5">
                <a href="/order-tracking.html" class="block hover:text-emerald-700 transition">অর্ডার ট্র্যাকিং</a>
                <a href="/shop.html?sort_by=flash-sale" class="block hover:text-emerald-700 transition text-rose-600 flex items-center gap-1">ফ্ল্যাশ সেল ⚡</a>
                <a href="/shop.html?sort_by=preorder" class="block hover:text-emerald-700 transition">প্রি-অর্ডার পণ্যসমূহ</a>
                <a href="/shop.html?sort_by=b1g1" class="block hover:text-emerald-700 transition">১ কিনলে ১ ফ্রি ধামাকা অফার</a>
              </div>
            </div>

            <div>
              <p class="text-[10px] tracking-wider uppercase text-slate-400 font-black mb-3">কোম্পানি নীতিমালা</p>
              <div class="space-y-3.5 pl-1.5">
                <a href="/about.html" class="block hover:text-emerald-700 transition">আমাদের সম্পর্কে (About Us)</a>
                <a href="/contact.html" class="block hover:text-emerald-700 transition">যোগাযোগ করুন</a>
                <a href="/shipping-policy.html" class="block hover:text-emerald-700 transition">শিপিং পলিসি</a>
                <a href="/return-policy.html" class="block hover:text-emerald-700 transition">রিটার্ন পলিসি</a>
                <a href="/privacy-and-policy.html" class="block hover:text-emerald-700 transition">প্রাইভেসি পলিসি</a>
                <a href="/terms-and-condition.html" class="block hover:text-emerald-700 transition">শর্তাবলী ও নিয়মাবলী</a>
              </div>
            </div>

            <div class="border-t border-gray-100 pt-5">
              <p class="text-[10px] tracking-wider uppercase text-slate-400 font-black mb-2.5">এডমিন জোন (Admin Zone)</p>
              <div class="pl-0.5">
                <a href="/admin/index.html" class="flex items-center gap-2.5 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/80 text-emerald-800 rounded-xl transition duration-200 shadow-xs group">
                  <div class="p-1.5 bg-emerald-600 rounded-lg text-white group-hover:scale-105 transition-transform flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-white"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </div>
                  <div class="text-left">
                    <p class="font-black text-[12.5px] leading-tight text-emerald-950 font-sans">এডমিন কন্ট্রোল প্যানেল</p>
                    <p class="text-[10px] font-medium text-emerald-650 leading-none mt-1 font-sans">অর্ডার, প্রোডাক্ট, হেডার-ফুটার ও সব সেটিংস</p>
                  </div>
                </a>
              </div>
            </div>

            <div class="border-t border-gray-100 pt-5">
              <p class="text-xs text-gray-500 font-medium">হেল্পলাইন নম্বর: ${settings.phone || '01789-123456'}</p>
              <p class="text-[11px] text-gray-400 font-medium mt-1">সকাল ৯:০০ - রাত ১০:০০ প্রতিদিন</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind drawer trigger logic for More menu
    const moreBtn = document.getElementById('desktop-more-menu-btn');
    const moreDrawer = document.getElementById('desktop-more-drawer');
    const moreDrawerContent = document.getElementById('desktop-more-drawer-content');
    const closeMoreBtn = document.getElementById('close-desktop-more-btn');

    if (moreBtn && moreDrawer && moreDrawerContent) {
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moreDrawer.classList.remove('hidden');
        setTimeout(() => {
          moreDrawerContent.classList.remove('translate-x-full');
        }, 50);
      });

      const closeDrawer = () => {
        moreDrawerContent.classList.add('translate-x-full');
        setTimeout(() => {
          moreDrawer.classList.add('hidden');
        }, 300);
      };

      if (closeMoreBtn) {
        closeMoreBtn.addEventListener('click', closeDrawer);
      }

      moreDrawer.addEventListener('click', (e) => {
        if (!moreDrawerContent.contains(e.target)) {
          closeDrawer();
        }
      });
    }
    
    // Set up live search handling dynamically
    initNavSearch();
  }

  // 2. Shared Footer
  const footer = document.getElementById('shared-footer');
  if (footer) {
    const renderFooterLinks = (linksText, defaultLinksHTML) => {
      if (!linksText) return defaultLinksHTML;
      const lines = linksText.trim().split('\n');
      let html = '';
      lines.forEach(line => {
        const parts = line.split('|');
        if (parts.length >= 2) {
          const label = parts[0].trim();
          const url = parts[1].trim();
          if (label && url) {
            html += `<a href="${url}" class="hover:text-emerald-400 transition">${label}</a>`;
          }
        }
      });
      return html || defaultLinksHTML;
    };

    const col1Default = `
      <a href="/about.html" class="hover:text-emerald-400 transition">আমাদের সম্পর্কে (About Us)</a>
      <a href="/contact.html" class="hover:text-emerald-400 transition">যোগাযোগ করুন (Contact)</a>
      <a href="/blog.html" class="hover:text-emerald-400 transition">আমাদের ব্লগ (Blog)</a>
      <a href="/terms-and-condition.html" class="hover:text-emerald-400 transition">শর্তাবলী ও নীতিমালা</a>
      <a href="/privacy-and-policy.html" class="hover:text-emerald-400 transition">প্রাইভেসি পলিসি</a>
    `;

    const col2Default = `
      <a href="/shipping-policy.html" class="hover:text-emerald-400 transition">শিপিং পলিসি</a>
      <a href="/return-policy.html" class="hover:text-emerald-400 transition">রিটার্ন পলিসি</a>
      <a href="/refund-policy.html" class="hover:text-emerald-400 transition">রিফান্ড পলিসি</a>
      <a href="/faq.html" class="hover:text-emerald-400 transition">সাধারণ প্রশ্ন ও উত্তর (FAQs)</a>
      <a href="/order-tracking.html" class="hover:text-emerald-400 transition">অর্ডার কুরিয়ার ট্র্যাকিং</a>
    `;

    const col1LinksHTML = renderFooterLinks(settings.footerCol1LinksText, col1Default);
    const col2LinksHTML = renderFooterLinks(settings.footerCol2LinksText, col2Default);

    const checkCopyright = settings.footerCopyright || "&copy; 2026 [siteName]. All Rights Reserved. Crafted for Healthy Lifestyle.";
    const processedCopyright = checkCopyright.replace('[siteName]', settings.siteName || "আম্রপালি");

    footer.innerHTML = `
      <section class="bg-gray-900 text-gray-300 pt-14 pb-8 border-t border-gray-800 bengali-font">
        <div class="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 class="font-bold text-xl text-white mb-4 flex items-center gap-2">
              <img src="${settings.footerLogoUrl || settings.logoUrl}" class="w-8 h-8 rounded-full">
              <span>${settings.footerLogoText || settings.siteName}</span>
            </h4>
            <p class="text-sm text-gray-400 leading-relaxed mb-4">${settings.footerText}</p>
            <p class="text-sm text-emerald-400 font-bold">🎯 Customer Helpline: ${settings.phone}</p>
          </div>
          <div>
            <h5 class="font-bold text-white text-md mb-4 flex items-center gap-2">${settings.footerCol1Title || 'গুরুত্বপূর্ণ লিংকসমূহ'}</h5>
            <div class="flex flex-col gap-2.5 text-sm">
              ${col1LinksHTML}
            </div>
          </div>
          <div>
            <h5 class="font-bold text-white text-md mb-4 flex items-center gap-2">${settings.footerCol2Title || 'কাস্টমার সার্ভিস'}</h5>
            <div class="flex flex-col gap-2.5 text-sm">
              ${col2LinksHTML}
            </div>
          </div>
          <div>
            <h5 class="font-bold text-white text-md mb-4">${settings.footerNewsletterTitle || 'নিউজলেটার সাবস্ক্রিপশন'}</h5>
            <p class="text-sm text-gray-400 leading-relaxed mb-4">${settings.footerNewsletterText || 'আমাদের নতুন অফার এবং অর্গ্যানিক পণ্যের আপডেট পেতে মেইল দিয়ে সাবস্ক্রাইব করুন।'}</p>
            <div class="flex gap-2">
              <input type="email" id="footer-newsletter-email" placeholder="আপনার ইমেইল..." class="bg-gray-800 border border-gray-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm w-full outline-none text-white transition">
              <button id="footer-newsletter-btn" class="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition">নিবন্ধন</button>
            </div>
          </div>
        </div>
        <div class="max-w-7xl mx-auto px-4 md:px-8 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-xs text-gray-500">${processedCopyright} <span class="mx-1.5 text-gray-700">•</span> <a href="/admin/index.html" class="hover:text-emerald-400 transition font-medium underline decoration-dotted">অ্যাডমিন প্রবেশদ্বার (Admin Login)</a></p>
          <div class="flex items-center gap-4 ${settings.footerShowPayments === false ? 'hidden' : ''}">
            <span class="text-xs text-gray-500 select-none">Secure Payments via:</span>
            <!-- Logo flags -->
            <div class="flex gap-2 opacity-75 grayscale hover:grayscale-0 transition duration-300">
              <span class="bg-white text-rose-600 font-bold text-[10px] px-1.5 py-0.5 rounded">bKash</span>
              <span class="bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0.5 rounded">Nagad</span>
              <span class="bg-blue-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded">Visa</span>
              <span class="bg-red-500 text-white font-bold text-[10px] px-1.5 py-0.5 rounded">MC</span>
            </div>
          </div>
        </div>
      </section>
    `;
    
    // Subscribe button logic
    const subBtn = document.getElementById('footer-newsletter-btn');
    if (subBtn) {
      subBtn.addEventListener('click', () => {
        const email = document.getElementById('footer-newsletter-email').value.trim();
        if (email) {
          showToast("নিউজলেটার রেজিস্ট্রেশন সম্পন্ন হয়েছে!", "success");
          document.getElementById('footer-newsletter-email').value = '';
        } else {
          showToast("দয়া করে সঠিক ইমেইল প্রদান করুন।", "danger");
        }
      });
    }
  }

  // 3. Mobile Navigation Layout
  const mobileNav = document.getElementById('shared-mobile-nav');
  if (mobileNav) {
    const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';
    const isShop = window.location.pathname.includes('shop.html');
    const isCart = window.location.pathname.includes('cart.html');
    const isWishlist = window.location.pathname.includes('wishlist.html');
    const isAccount = window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('login.html');

    mobileNav.innerHTML = `
      <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-150 py-2.5 px-4 flex justify-between items-center z-[90] sm:hidden shadow-lg select-none">
        <a href="/index.html" class="bottom-nav-item flex flex-col items-center gap-1 flex-1 text-gray-500 ${isHome ? 'active' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <span class="text-[10px] font-medium font-bengali">হোম</span>
        </a>
        <a href="/shop.html" class="bottom-nav-item flex flex-col items-center gap-1 flex-1 text-gray-500 ${isShop ? 'active' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span class="text-[10px] font-medium font-bengali">ক্যাটাগরি</span>
        </a>
        <a href="/cart.html" class="bottom-nav-item flex flex-col items-center gap-1 flex-1 text-gray-500 relative ${isCart ? 'active' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          <span class="cart-count absolute top-0 right-4 bg-emerald-600 text-white font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center hidden">0</span>
          <span class="text-[10px] font-medium font-bengali">কার্ট</span>
        </a>
        <a href="/wishlist.html" class="bottom-nav-item flex flex-col items-center gap-1 flex-1 text-gray-500 relative ${isWishlist ? 'active' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          <span class="wishlist-count absolute top-0 right-4 bg-orange-500 text-white font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center hidden">0</span>
          <span class="text-[10px] font-medium font-bengali">উইশলিস্ট</span>
        </a>
        <a href="${currentUser ? '/dashboard.html' : '/login.html'}" class="bottom-nav-item flex flex-col items-center gap-1 flex-1 text-gray-500 ${isAccount ? 'active' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span class="text-[10px] font-medium font-bengali">অ্যাকাউন্ট</span>
        </a>
      </div>
    `;
  }
}

// Global Nav Search Control
function initNavSearch() {
  const products = getProducts();
  
  const setupInput = (inputId, boxId) => {
    const input = document.getElementById(inputId);
    const box = document.getElementById(boxId);
    if (!input || !box) return;
    
    input.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      if (!term) {
        box.innerHTML = '';
        box.classList.add('hidden');
        return;
      }

      const filtered = products.filter(p => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term));
      if (filtered.length === 0) {
        box.innerHTML = `<p class="p-4 text-sm text-gray-500 text-center font-sans">কোনো পণ্য পাওয়া যায়নি!</p>`;
      } else {
        box.innerHTML = filtered.slice(0, 5).map(p => `
          <a href="/product.html?id=${p.id}" class="flex items-center gap-3 p-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-none cursor-pointer">
            <img src="${p.image}" class="w-10 h-10 object-cover rounded-lg">
            <div class="text-left">
              <h6 class="text-xs font-semibold text-gray-800 line-clamp-1">${p.name}</h6>
              <div class="flex items-center gap-2 text-[10px] mt-0.5">
                <span class="text-emerald-700 font-bold">৳${p.discountPrice || p.price}</span>
                ${p.discountPrice && p.discountPrice < p.price ? `<span class="line-through text-gray-400">৳${p.price}</span>` : ''}
              </div>
            </div>
          </a>
        `).join('');
      }
      box.classList.remove('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !box.contains(e.target)) {
        box.classList.add('hidden');
      }
    });
  };

  setupInput('global-search-input', 'live-suggestions');
  setupInput('global-search-input-mobile', 'live-suggestions-mobile');
}

// CARD GENERATOR HELPER
export function createProductCardHTML(p) {
  const isWishlisted = getWishlist().some(item => item.id === p.id);
  const discountAmount = p.discountPrice && p.discountPrice < p.price ? Math.round(((p.price - p.discountPrice) / p.price) * 100) : 0;
  
  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-emerald-300 hover:shadow-md transition-all duration-300 relative group flex flex-col h-full overflow-hidden">
      <!-- Tag / Discount badge -->
      <div class="absolute top-2 left-2 z-10 flex flex-col gap-1">
        ${discountAmount > 0 ? `<span class="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full select-none shadow">-${discountAmount}%</span>` : ''}
        ${p.tag ? `<span class="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full select-none shadow">${p.tag}</span>` : ''}
      </div>

      <!-- Wishlist Action -->
      <button class="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white text-gray-400 hover:text-red-500 p-2 rounded-full shadow-sm hover:scale-105 transition pointer-events-auto" data-action="wishlist" data-id="${p.id}">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? 'red' : 'none'}" stroke="${isWishlisted ? 'red' : 'currentColor'}" stroke-width="2" class="transition-colors"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
      </button>

      <!-- Thumb -->
      <a href="/product.html?id=${p.id}" class="block relative aspect-square overflow-hidden bg-gray-50 flex-shrink-0 cursor-pointer">
        <img src="${p.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" alt="${p.name}">
      </a>

      <!-- Content -->
      <div class="p-3.5 flex flex-col flex-grow text-left">
        <span class="text-[10px] uppercase tracking-wider text-emerald-700 font-bold font-mono mb-1">${p.category}</span>
        <a href="/product.html?id=${p.id}" class="text-sm font-semibold text-gray-800 line-clamp-2 hover:text-emerald-700 mb-2 font-sans h-10 cursor-pointer">${p.name}</a>
        
        <!-- Ratings placeholder representation -->
        <div class="flex items-center gap-1 mb-2 select-none">
          <span class="text-amber-400 text-xs text-center flex">★★★★★</span>
          <span class="text-[10px] text-gray-400 font-sans font-bold">(12)</span>
        </div>

        <!-- Prices -->
        <div class="flex items-baseline gap-2 mb-4 mt-auto">
          <span class="text-lg font-bold text-emerald-800 font-sans">৳${p.discountPrice || p.price}</span>
          ${p.discountPrice && p.discountPrice < p.price ? `<span class="text-xs line-through text-gray-400">৳${p.price}</span>` : ''}
        </div>

        <!-- Call to action loops -->
        <div class="grid grid-cols-2 gap-2 mt-auto">
          <button class="bg-gray-50 hover:bg-emerald-50 text-emerald-800 hover:text-emerald-900 border border-emerald-100 font-bold text-xs py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition select-none" data-action="add-cart" data-id="${p.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            <span>কার্ট</span>
          </button>
          <button class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition select-none" data-action="buy-now" data-id="${p.id}">
            <span>কিনুন</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Global button interceptors for dynamically generated content
export function bindGlobalProductButtons() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    
    const action = target.getAttribute('data-action');
    const id = target.getAttribute('data-id');
    
    if (action === 'wishlist') {
      toggleWishlist(id);
      // Toggle color state locally without full redraw
      const isWishlisted = getWishlist().some(item => item.id === id);
      const svg = target.querySelector('svg');
      if (svg) {
        svg.setAttribute('fill', isWishlisted ? 'red' : 'none');
        svg.setAttribute('stroke', isWishlisted ? 'red' : 'currentColor');
      }
    } else if (action === 'add-cart') {
      addToCart(id, 1);
    } else if (action === 'buy-now') {
      addToCart(id, 1, true);
    }
  });
}

// Page dynamic redraw helper (Cart rendering)
function renderCartPageInside() {
  const container = document.getElementById('cart-items-container');
  const summaryBlock = document.getElementById('cart-summary-block');
  if (!container) return;

  const cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <div class="h-24 w-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 select-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-dasharray="2" stroke-width="2" class="text-emerald-700"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        </div>
        <h4 class="font-bold text-lg text-gray-700 mb-2 font-bengali">আপনার শপিং কার্ট খালি!</h4>
        <p class="text-sm text-gray-400 mb-6 font-sans">তাজা অর্গ্যানিক পণ্য কিনতে নিচের লিংকে শপে প্রবেশ করুন।</p>
        <a href="/shop.html" class="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition shadow">শপে যান</a>
      </div>
    `;
    if (summaryBlock) summaryBlock.classList.add('hidden');
    return;
  }

  if (summaryBlock) summaryBlock.classList.remove('hidden');

  container.innerHTML = cart.map(item => `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-5 mb-5 last:border-none last:pb-0 font-sans">
      <div class="flex gap-4 items-center mb-4 sm:mb-0">
        <img src="${item.image}" class="w-16 h-16 object-cover rounded-xl border border-gray-50 flex-shrink-0">
        <div>
          <h5 class="text-sm font-bold text-gray-800 line-clamp-1">${item.name}</h5>
          <p class="text-xs text-gray-400 mt-0.5">মূল্য: ৳${item.discountPrice || item.price}</p>
        </div>
      </div>
      <div class="flex items-center justify-between sm:justify-start gap-4">
        <!-- Quantity control (Disabled for free bundle items to prevent manual exploitation) -->
        ${item.isFreeItem ? `
          <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">Qty: ${item.qty} (Free Bundle)</span>
        ` : `
          <div class="flex items-center border border-gray-200 rounded-lg bg-gray-50">
            <button class="px-2.5 py-1 text-gray-500 hover:bg-gray-100 font-bold" onclick="window.updateCartQuantityLocal('${item.id}', ${item.qty - 1}, false)">-</button>
            <input type="number" value="${item.qty}" min="1" class="w-10 text-center text-sm font-bold bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" onchange="window.updateCartQuantityLocal('${item.id}', this.value, false)">
            <button class="px-2.5 py-1 text-gray-500 hover:bg-gray-100 font-bold" onclick="window.updateCartQuantityLocal('${item.id}', ${item.qty + 1}, false)">+</button>
          </div>
        `}
        <div class="text-right">
          <p class="text-sm font-extrabold text-gray-800">৳${(item.discountPrice || item.price) * item.qty}</p>
          <button class="text-xs text-red-500 hover:text-red-700 font-medium font-bengali mt-0.5 inline-block" onclick="window.removeCartItemLocal('${item.id}', ${item.isFreeItem || false})">মুছে ফেলুন</button>
        </div>
      </div>
    </div>
  `).join('');

  // Summaries Calculations
  const subtotal = cart.reduce((sum, item) => sum + ((item.discountPrice || item.price) * item.qty), 0);
  const activePromoPercent = Number(sessionStorage.getItem('activeCouponPercent') || 0);
  const activePromoFlat = Number(sessionStorage.getItem('activeCouponFlat') || 0);
  
  let discount = 0;
  if (activePromoPercent > 0) discount = Math.round(subtotal * (activePromoPercent / 100));
  else if (activePromoFlat > 0) discount = activePromoFlat;

  const finalTotal = subtotal - discount;

  document.getElementById('cart-subtotal').textContent = `৳${subtotal}`;
  document.getElementById('cart-discount').textContent = `৳${discount}`;
  document.getElementById('cart-total').textContent = `৳${finalTotal}`;
}

// Global hook methods for inline callbacks
window.updateCartQuantityLocal = (id, val, isFree) => updateCartQty(id, val, isFree);
window.removeCartItemLocal = (id, isFree) => removeFromCart(id, isFree);

// Wishlist rendering helper
function renderWishlistPageInside() {
  const container = document.getElementById('wishlist-grid');
  if (!container) return;

  const wishlist = getWishlist();
  if (wishlist.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center max-w-md mx-auto">
        <div class="h-24 w-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 select-none animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="text-orange-500"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </div>
        <h4 class="font-bold text-lg text-gray-700 mb-2 font-bengali">আপনার পছন্দের প্রোডাক্টে লাইক দিন!</h4>
        <p class="text-sm text-gray-400 mb-6 font-sans">কোনো পণ্য ভালো লেগে থাকলে তা উইশলিস্টে সেভ করে রাখুন।</p>
        <a href="/shop.html" class="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition shadow">শপে যান</a>
      </div>
    `;
    return;
  }

  container.innerHTML = wishlist.map(p => createProductCardHTML(p)).join('');
}

// Trigger initializations on loaded safely
function startMainApplication() {
  initDB();
  injectSharedLayouts();
  updateCartBadges();
  updateWishlistBadges();
  bindGlobalProductButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startMainApplication);
} else {
  startMainApplication();
}
