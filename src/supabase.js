// Supabase Integration Handler - Lightweight REST implementation for maximum reliability
import { showToast } from './app.js';

export function getSupabaseConfig() {
  // Read from Vite env variables first (best practice for Vercel / Production build)
  let url = import.meta.env?.VITE_SUPABASE_URL || '';
  let key = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

  // Fallback to Admin Panel local Storage settings if not defined in env variables
  try {
    const savedConfig = JSON.parse(localStorage.getItem('supabaseSettings') || '{}');
    if (savedConfig.supabaseUrl) url = savedConfig.supabaseUrl;
    if (savedConfig.supabaseKey) key = savedConfig.supabaseKey;
  } catch (e) {
    console.log("Error reading Supabase settings from localStorage:", e);
  }

  const cleanUrl = url?.trim().replace(/\/$/, "") || '';
  const cleanKey = key?.trim() || '';

  // Validate URL format and ensure no placeholders or dummy keys are used
  const isValidUrl = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://');
  const isPlaceholder = cleanUrl.includes('placeholder') || cleanUrl.includes('your-') || cleanUrl.includes('example.com') ||
                        cleanKey.includes('placeholder') || cleanKey.includes('your-') ||
                        cleanKey.length < 40; // A real Supabase anon key is a very long JWT token (usually >100 characters)

  const enabled = !!(cleanUrl && cleanKey && isValidUrl && !isPlaceholder);

  return {
    supabaseUrl: cleanUrl,
    supabaseKey: cleanKey,
    enabled: enabled
  };
}

// Convert native order schema to Supabase column names
function prepareOrderPayload(order) {
  return {
    order_id: order.orderId,
    date: order.date || new Date().toLocaleDateString('bn-BD'),
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail || '',
    division: order.division,
    district: order.district,
    area: order.area,
    address: order.address,
    note: order.note || '',
    items: order.items || [],
    subtotal: Number(order.subtotal || 0),
    discount: Number(order.discount || 0),
    delivery_fee: Number(order.deliveryFee || 0),
    total_price: Number(order.totalPrice || 0),
    payment_method: order.paymentMethod || 'COD',
    status: order.status || 'Pending'
  };
}

/**
 * Saves order directly to Supabase via REST catalog
 */
export async function saveOrderToSupabase(order) {
  const config = getSupabaseConfig();
  if (!config.enabled) {
    console.log("Supabase is not configured yet. Saving to Local Storage only.");
    return false;
  }

  const url = `${config.supabaseUrl}/rest/v1/orders`;
  const payload = prepareOrderPayload(order);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${config.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Supabase Response Err: ${response.status} - ${errText}`);
    }

    console.log("Order saved to Supabase successfully!");
    // Mark order as synced in local copy
    return true;
  } catch (err) {
    console.log("Failed to save order to Supabase:", err);
    return false;
  }
}

/**
 * Fetch all orders from Supabase (defaults to fallback to local if fail or not configured)
 */
export async function getOrdersFromSupabase() {
  const config = getSupabaseConfig();
  if (!config.enabled) {
    return null;
  }

  const url = `${config.supabaseUrl}/rest/v1/orders?select=*&order=created_at.desc`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${config.supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error fetching from Supabase: ${response.status}`);
    }

    const data = await response.json();
    
    // Map back to internal representation
    return data.map(item => ({
      orderId: item.order_id,
      date: item.date,
      customerName: item.customer_name,
      customerPhone: item.customer_phone,
      customerEmail: item.customer_email,
      division: item.division,
      district: item.district,
      area: item.area,
      address: item.address,
      note: item.note,
      items: item.items,
      subtotal: item.subtotal,
      discount: item.discount,
      deliveryFee: item.delivery_fee,
      totalPrice: item.total_price,
      paymentMethod: item.payment_method,
      status: item.status,
      supabaseId: item.id
    }));
  } catch (err) {
    console.log("Failed to fetch orders from Supabase:", err);
    return null;
  }
}

/**
 * Tests connection to a custom Supabase instance
 */
export async function testSupabaseConnection(supabaseUrl, supabaseKey) {
  if (!supabaseUrl || !supabaseKey) {
    return { success: false, message: "URL and Key cannot be empty!" };
  }

  const cleanUrl = supabaseUrl.trim().replace(/\/$/, "");
  const url = `${cleanUrl}/rest/v1/orders?select=id&limit=1`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 404) {
      return { 
        success: false, 
        message: "Supabase connected but the 'orders' table was not found! Please run the SQL schema script provided on your Supabase dashboard." 
      };
    }

    if (!response.ok) {
      const text = await response.text();
      return { success: false, message: `Status ${response.status}: ${text || 'Authentication Failed'}` };
    }

    return { success: true, message: "Great! Supabase connection tested successfully and 'orders' table is running!" };
  } catch (err) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

/**
 * Sync unsynced localStorage orders to Supabase
 */
export async function syncLocalOrdersToSupabase() {
  const config = getSupabaseConfig();
  if (!config.enabled) {
    return { success: false, message: "Supabase on-the-fly config is inactive!" };
  }

  const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
  if (localOrders.length === 0) {
    return { success: true, count: 0, message: "অর্ডার করার মত কোনো লোকাল ডাটা নেই!" };
  }

  showToast("লোকাল ডাটা সুপাবেসে সিঙ্ক হচ্ছে...", "info");
  let syncCount = 0;

  for (let order of localOrders) {
    // Only upload orders that don't have Supabase Sync flags yet
    if (!order.isSupabaseSynced) {
      const isSaved = await saveOrderToSupabase(order);
      if (isSaved) {
        order.isSupabaseSynced = true;
        syncCount++;
      }
    }
  }

  if (syncCount > 0) {
    localStorage.setItem('orders', JSON.stringify(localOrders));
  }

  return { 
    success: true, 
    count: syncCount, 
    message: `${syncCount}টি অর্ডার সফলভাবে সুপাবেসে সিঙ্ক করা হয়েছে!` 
  };
}

/**
 * Save categories array to Supabase
 */
export async function saveCategoriesToSupabase(categories) {
  const config = getSupabaseConfig();
  if (!config.enabled) return;
  try {
    await fetch(`${config.supabaseUrl}/rest/v1/categories?id=not.is.null`, {
      method: 'DELETE',
      headers: {
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${config.supabaseKey}`
      }
    });

    if (categories.length > 0) {
      const payload = categories.map(c => ({
        id: c.id,
        name: c.name,
        subcategories: c.subcategories || []
      }));
      await fetch(`${config.supabaseUrl}/rest/v1/categories`, {
        method: 'POST',
        headers: {
          'apikey': config.supabaseKey,
          'Authorization': `Bearer ${config.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });
    }
  } catch (e) {
    console.warn("Error saving categories to Supabase", e);
  }
}

/**
 * Save products array to Supabase
 */
export async function saveProductsToSupabase(products) {
  const config = getSupabaseConfig();
  if (!config.enabled) return;
  try {
    await fetch(`${config.supabaseUrl}/rest/v1/products?id=not.is.null`, {
      method: 'DELETE',
      headers: {
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${config.supabaseKey}`
      }
    });

    if (products.length > 0) {
      const payload = products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category || '',
        subcategory: p.subcategory || '',
        price: Number(p.price || 0),
        discountPrice: p.discountPrice !== undefined ? Number(p.discountPrice) : null,
        stock: Number(p.stock || 0),
        description: p.description || '',
        image: p.image || '',
        tag: p.tag || ''
      }));
      await fetch(`${config.supabaseUrl}/rest/v1/products`, {
        method: 'POST',
        headers: {
          'apikey': config.supabaseKey,
          'Authorization': `Bearer ${config.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });
    }
  } catch (e) {
    console.warn("Error saving products to Supabase", e);
  }
}

/**
 * Save banners array to Supabase
 */
export async function saveBannersToSupabase(banners) {
  const config = getSupabaseConfig();
  if (!config.enabled) return;
  try {
    await fetch(`${config.supabaseUrl}/rest/v1/banners?id=not.is.null`, {
      method: 'DELETE',
      headers: {
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${config.supabaseKey}`
      }
    });

    if (banners.length > 0) {
      const payload = banners.map(b => ({
        id: b.id,
        imageUrl: b.imageUrl || '',
        title: b.title || '',
        text: b.text || ''
      }));
      await fetch(`${config.supabaseUrl}/rest/v1/banners`, {
        method: 'POST',
        headers: {
          'apikey': config.supabaseKey,
          'Authorization': `Bearer ${config.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });
    }
  } catch (e) {
    console.warn("Error saving banners to Supabase", e);
  }
}

/**
 * Save coupons array to Supabase
 */
export async function saveCouponsToSupabase(coupons) {
  const config = getSupabaseConfig();
  if (!config.enabled) return;
  try {
    await fetch(`${config.supabaseUrl}/rest/v1/coupons?code=not.is.null`, {
      method: 'DELETE',
      headers: {
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${config.supabaseKey}`
      }
    });

    if (coupons.length > 0) {
      const payload = coupons.map(c => ({
        code: c.code,
        type: c.type || 'percentage',
        value: Number(c.value || 0),
        description: c.description || ''
      }));
      await fetch(`${config.supabaseUrl}/rest/v1/coupons`, {
        method: 'POST',
        headers: {
          'apikey': config.supabaseKey,
          'Authorization': `Bearer ${config.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });
    }
  } catch (e) {
    console.warn("Error saving coupons to Supabase", e);
  }
}

/**
 * Save site settings object to Supabase
 */
export async function saveSiteSettingsToSupabase(settings) {
  const config = getSupabaseConfig();
  if (!config.enabled) return;
  try {
    const payload = {
      id: 'default',
      siteName: settings.siteName || '',
      tagline: settings.tagline || '',
      logoUrl: settings.logoUrl || '',
      favicon: settings.favicon || '',
      phone: settings.phone || '',
      bkash: settings.bkash || '',
      nagad: settings.nagad || '',
      announcement: settings.announcement || '',
      footerText: settings.footerText || '',
      footerLogoUrl: settings.footerLogoUrl || '',
      footerLogoText: settings.footerLogoText || '',
      fbPixel: settings.fbPixel || '',
      adminNotifyEmail: settings.adminNotifyEmail || ''
    };

    await fetch(`${config.supabaseUrl}/rest/v1/site_settings`, {
      method: 'POST',
      headers: {
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${config.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.log("Error saving site settings to Supabase:", e);
  }
}

/**
 * Fetches all dynamic data tables from Supabase and updates localStorage.
 * If tables are empty on Supabase, seeds them with current local defaults.
 */
export async function syncAllDataFromSupabase() {
  const config = getSupabaseConfig();
  if (!config.enabled) return;

  console.log("Supabase is enabled. Checking cloud data collections...");

  const fetchTable = async (tableName) => {
    try {
      const res = await fetch(`${config.supabaseUrl}/rest/v1/${tableName}?select=*`, {
        headers: {
          'apikey': config.supabaseKey,
          'Authorization': `Bearer ${config.supabaseKey}`
        }
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.log(`Note: Supabase table ${tableName} fetch omitted/offline. Using cached local fallback.`, e);
    }
    return null;
  };

  // 1. Categories
  const catData = await fetchTable('categories');
  if (catData !== null) {
    if (catData.length === 0) {
      const defaults = JSON.parse(localStorage.getItem('categories') || '[]');
      if (defaults.length > 0) await saveCategoriesToSupabase(defaults);
    } else {
      localStorage.setItem('categories', JSON.stringify(catData));
    }
  }

  // 2. Products
  const prodData = await fetchTable('products');
  if (prodData !== null) {
    if (prodData.length === 0) {
      const defaults = JSON.parse(localStorage.getItem('products') || '[]');
      if (defaults.length > 0) await saveProductsToSupabase(defaults);
    } else {
      localStorage.setItem('products', JSON.stringify(prodData));
    }
  }

  // 3. Banners
  const banData = await fetchTable('banners');
  if (banData !== null) {
    if (banData.length === 0) {
      const defaults = JSON.parse(localStorage.getItem('banners') || '[]');
      if (defaults.length > 0) await saveBannersToSupabase(defaults);
    } else {
      localStorage.setItem('banners', JSON.stringify(banData));
    }
  }

  // 4. Coupons
  const coupData = await fetchTable('coupons');
  if (coupData !== null) {
    if (coupData.length === 0) {
      const defaults = JSON.parse(localStorage.getItem('coupons') || '[]');
      if (defaults.length > 0) await saveCouponsToSupabase(defaults);
    } else {
      localStorage.setItem('coupons', JSON.stringify(coupData));
    }
  }

  // 5. Site Settings
  const settingsData = await fetchTable('site_settings');
  if (settingsData !== null) {
    if (settingsData.length === 0) {
      const defaults = JSON.parse(localStorage.getItem('siteSettings') || '{}');
      if (Object.keys(defaults).length > 0) await saveSiteSettingsToSupabase(defaults);
    } else {
      const remoteSettings = settingsData.find(s => s.id === 'default') || settingsData[0] || {};
      delete remoteSettings.id;
      delete remoteSettings.updated_at;
      localStorage.setItem('siteSettings', JSON.stringify(remoteSettings));
    }
  }
}
