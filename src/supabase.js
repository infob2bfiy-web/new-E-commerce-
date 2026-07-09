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
        subcategories: c.subcategories || [],
        image: c.image || ''
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
      const fullPayload = products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category || '',
        subcategory: p.subcategory || '',
        price: Number(p.price || 0),
        discountPrice: p.discountPrice !== undefined ? Number(p.discountPrice) : null,
        stock: Number(p.stock || 0),
        description: p.description || '',
        image: p.image || '',
        images: p.images || [],
        variant: p.variant || '',
        tag: p.tag || ''
      }));

      const res = await fetch(`${config.supabaseUrl}/rest/v1/products`, {
        method: 'POST',
        headers: {
          'apikey': config.supabaseKey,
          'Authorization': `Bearer ${config.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(fullPayload)
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        console.warn("Full payload product save failed (likely due to missing 'images' or 'variant' columns). Retrying fallback save...", errorMsg);

        // Fallback payload without images/variant columns
        const fallbackPayload = products.map(p => ({
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

        const fallbackRes = await fetch(`${config.supabaseUrl}/rest/v1/products`, {
          method: 'POST',
          headers: {
            'apikey': config.supabaseKey,
            'Authorization': `Bearer ${config.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(fallbackPayload)
        });

        if (!fallbackRes.ok) {
          console.error("Fallback product save also failed:", await fallbackRes.text());
        } else {
          console.log("Product saved successfully using fallback mode (missing custom columns). Please run the SQL migration in Admin tab to support multiple images & variants!");
        }
      }
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
 * Save users array to Supabase
 */
export async function saveUsersToSupabase(users) {
  const config = getSupabaseConfig();
  if (!config.enabled) return;
  try {
    await fetch(`${config.supabaseUrl}/rest/v1/users?phone=not.is.null`, {
      method: 'DELETE',
      headers: {
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${config.supabaseKey}`
      }
    });

    if (users.length > 0) {
      const payload = users.map(u => ({
        phone: u.phone,
        name: u.name || '',
        email: u.email || '',
        password: u.password || '',
        address: u.address || ''
      }));
      await fetch(`${config.supabaseUrl}/rest/v1/users`, {
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
    console.warn("Error saving users to Supabase", e);
  }
}

/**
 * Save admin credentials to Supabase
 */
export async function saveAdminCredentialsToSupabase(creds) {
  const config = getSupabaseConfig();
  if (!config.enabled) return;
  try {
    if (!creds || !creds.username) return;

    // 1. Fetch existing credentials first
    const checkRes = await fetch(`${config.supabaseUrl}/rest/v1/admin_credentials?select=*`, {
      headers: {
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${config.supabaseKey}`
      }
    });
    
    const rows = checkRes.ok ? await checkRes.json() : [];

    if (rows && rows.length > 0) {
      // 2. Update the existing first row
      const firstRow = rows[0];
      const queryParam = firstRow.id ? `?id=eq.${firstRow.id}` : `?username=eq.${encodeURIComponent(firstRow.username)}`;
      
      await fetch(`${config.supabaseUrl}/rest/v1/admin_credentials${queryParam}`, {
        method: 'PATCH',
        headers: {
          'apikey': config.supabaseKey,
          'Authorization': `Bearer ${config.supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: creds.username,
          password: creds.password || 'admin1'
        })
      });
    } else {
      // 3. Insert new row
      await fetch(`${config.supabaseUrl}/rest/v1/admin_credentials`, {
        method: 'POST',
        headers: {
          'apikey': config.supabaseKey,
          'Authorization': `Bearer ${config.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          username: creds.username,
          password: creds.password || 'admin1'
        })
      });
    }
  } catch (e) {
    console.warn("Error saving admin credentials to Supabase", e);
  }
}

/**
 * Save support tickets array to Supabase
 */
export async function saveSupportTicketsToSupabase(tickets) {
  const config = getSupabaseConfig();
  if (!config.enabled) return;
  try {
    await fetch(`${config.supabaseUrl}/rest/v1/support_tickets?id=not.is.null`, {
      method: 'DELETE',
      headers: {
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${config.supabaseKey}`
      }
    });

    if (tickets.length > 0) {
      const payload = tickets.map(t => ({
        id: t.id,
        phone: t.phone || '',
        email: t.email || '',
        subject: t.subject || '',
        message: t.message || '',
        status: t.status || 'Open',
        date: t.date || ''
      }));
      await fetch(`${config.supabaseUrl}/rest/v1/support_tickets`, {
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
    console.warn("Error saving support tickets to Supabase", e);
  }
}

/**
 * Save site settings object to Supabase
 */
export async function saveSiteSettingsToSupabase(settings) {
  const config = getSupabaseConfig();
  if (!config.enabled) return { success: false, message: 'Supabase is not enabled' };
  try {
    const fullPayload = {
      id: 'default',
      siteName: settings.siteName || '',
      tagline: settings.tagline || '',
      logoUrl: settings.logoUrl || '',
      favicon: settings.favicon || '',
      phone: settings.phone || '',
      whatsapp: settings.whatsapp || '',
      email: settings.email || '',
      bkash: settings.bkash || '',
      nagad: settings.nagad || '',
      rocket: settings.rocket || '',
      cod: settings.cod !== false,
      announcement: settings.announcement || '',
      footerText: settings.footerText || '',
      footerLogoUrl: settings.footerLogoUrl || '',
      footerLogoText: settings.footerLogoText || '',
      fbPixel: settings.fbPixel || '',
      adminNotifyEmail: settings.adminNotifyEmail || '',
      headerLogoType: settings.headerLogoType || 'image',
      footerLogoType: settings.footerLogoType || 'image',
      // Dynamic newly-added social/footer settings
      facebookUrl: settings.facebookUrl || '',
      youtubeUrl: settings.youtubeUrl || '',
      footerCopyright: settings.footerCopyright || '',
      footerCol1Title: settings.footerCol1Title || '',
      footerCol1LinksText: settings.footerCol1LinksText || '',
      footerCol2Title: settings.footerCol2Title || '',
      footerCol2LinksText: settings.footerCol2LinksText || '',
      footerNewsletterTitle: settings.footerNewsletterTitle || '',
      footerNewsletterText: settings.footerNewsletterText || '',
      footerShowPayments: settings.footerShowPayments !== false,
      aboutContent: settings.aboutContent || '',
      termsContent: settings.termsContent || '',
      privacyContent: settings.privacyContent || '',
      shippingContent: settings.shippingContent || '',
      returnContent: settings.returnContent || '',
      refundContent: settings.refundContent || '',
      faqContent: settings.faqContent || '',
      contactContent: settings.contactContent || '',
      blogContent: settings.blogContent || '',
      trackingContent: settings.trackingContent || ''
    };

    const fallbackPayload = {
      id: 'default',
      siteName: settings.siteName || '',
      tagline: settings.tagline || '',
      logoUrl: settings.logoUrl || '',
      favicon: settings.favicon || '',
      phone: settings.phone || '',
      whatsapp: settings.whatsapp || '',
      email: settings.email || '',
      bkash: settings.bkash || '',
      nagad: settings.nagad || '',
      rocket: settings.rocket || '',
      cod: settings.cod !== false,
      announcement: settings.announcement || '',
      footerText: settings.footerText || '',
      footerLogoUrl: settings.footerLogoUrl || '',
      footerLogoText: settings.footerLogoText || '',
      fbPixel: settings.fbPixel || '',
      adminNotifyEmail: settings.adminNotifyEmail || '',
      headerLogoType: settings.headerLogoType || 'image',
      footerLogoType: settings.footerLogoType || 'image'
    };

    // Pre-emptively delete the existing row to make upsert highly compatible without conflict issues
    try {
      await fetch(`${config.supabaseUrl}/rest/v1/site_settings?id=eq.default`, {
        method: 'DELETE',
        headers: {
          'apikey': config.supabaseKey,
          'Authorization': `Bearer ${config.supabaseKey}`
        }
      });
    } catch (delErr) {
      console.warn("Non-blocking delete of existing site_settings default row failed:", delErr);
    }

    // Try full save first
    let response = await fetch(`${config.supabaseUrl}/rest/v1/site_settings`, {
      method: 'POST',
      headers: {
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${config.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(fullPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("Full payload site_settings save failed, retrying safe fallback...", errorText);

      // Fallback save using old schema (guaranteed to succeed on older tables)
      response = await fetch(`${config.supabaseUrl}/rest/v1/site_settings`, {
        method: 'POST',
        headers: {
          'apikey': config.supabaseKey,
          'Authorization': `Bearer ${config.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(fallbackPayload)
      });

      if (!response.ok) {
        const fallbackError = await response.text();
        console.error("Fallback site_settings save also failed:", fallbackError);
        return { success: false, message: fallbackError };
      } else {
        console.log("Site settings saved successfully using fallback mode (older table structure).");
        return { success: true, fallbackUsed: true, error: errorText };
      }
    } else {
      console.log("All site settings (including social media & copyright text) successfully saved to Supabase.");
    }
    return { success: true, fallbackUsed: false };
  } catch (e) {
    console.warn("Background sync of site settings to Supabase failed (non-blocking):", e.message);
    return { success: false, message: e.message };
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

  // Fetch all tables in parallel to dramatically speed up loading time and performance!
  const [
    catData,
    prodData,
    banData,
    coupData,
    settingsData,
    userData,
    adminCredData,
    ticketData
  ] = await Promise.all([
    fetchTable('categories'),
    fetchTable('products'),
    fetchTable('banners'),
    fetchTable('coupons'),
    fetchTable('site_settings'),
    fetchTable('users'),
    fetchTable('admin_credentials'),
    fetchTable('support_tickets')
  ]);

  // 1. Categories
  if (catData !== null) {
    if (catData.length === 0) {
      const defaults = JSON.parse(localStorage.getItem('categories') || '[]');
      if (defaults.length > 0) await saveCategoriesToSupabase(defaults);
    } else {
      localStorage.setItem('categories', JSON.stringify(catData));
    }
  }

  // 2. Products
  if (prodData !== null) {
    if (prodData.length === 0) {
      const defaults = JSON.parse(localStorage.getItem('products') || '[]');
      if (defaults.length > 0) await saveProductsToSupabase(defaults);
    } else {
      localStorage.setItem('products', JSON.stringify(prodData));
    }
  }

  // 3. Banners
  if (banData !== null) {
    if (banData.length === 0) {
      const defaults = JSON.parse(localStorage.getItem('banners') || '[]');
      if (defaults.length > 0) await saveBannersToSupabase(defaults);
    } else {
      localStorage.setItem('banners', JSON.stringify(banData));
    }
  }

  // 4. Coupons
  if (coupData !== null) {
    if (coupData.length === 0) {
      const defaults = JSON.parse(localStorage.getItem('coupons') || '[]');
      if (defaults.length > 0) await saveCouponsToSupabase(defaults);
    } else {
      localStorage.setItem('coupons', JSON.stringify(coupData));
    }
  }

  // 5. Site Settings
  if (settingsData !== null) {
    if (settingsData.length === 0) {
      const defaults = JSON.parse(localStorage.getItem('siteSettings') || '{}');
      if (Object.keys(defaults).length > 0) await saveSiteSettingsToSupabase(defaults);
    } else {
      const localSettings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
      const remoteSettings = settingsData.find(s => s.id === 'default') || settingsData[0] || {};
      delete remoteSettings.id;
      delete remoteSettings.updated_at;
      
      // Merge remote settings on top of local settings to avoid wiping out properties not supported in remote schema
      const mergedSettings = { ...localSettings };
      for (const key of Object.keys(remoteSettings)) {
        if (remoteSettings[key] !== null && remoteSettings[key] !== undefined) {
          mergedSettings[key] = remoteSettings[key];
        }
      }
      localStorage.setItem('siteSettings', JSON.stringify(mergedSettings));
    }
  }

  // 6. Users
  if (userData !== null) {
    if (userData.length === 0) {
      const defaults = JSON.parse(localStorage.getItem('users') || '[]');
      if (defaults.length > 0) await saveUsersToSupabase(defaults);
    } else {
      localStorage.setItem('users', JSON.stringify(userData));
    }
  }

  // 7. Admin Credentials
  if (adminCredData !== null) {
    if (adminCredData.length === 0) {
      const defaults = JSON.parse(localStorage.getItem('adminCredentials') || '{"username":"admin","password":"admin1"}');
      if (defaults.username) await saveAdminCredentialsToSupabase(defaults);
    } else {
      const firstRow = adminCredData[0] || {};
      const credentialsObj = {
        username: firstRow.username || 'admin',
        password: firstRow.password || 'admin1'
      };
      localStorage.setItem('adminCredentials', JSON.stringify(credentialsObj));
    }
  }

  // 8. Support Tickets
  if (ticketData !== null) {
    if (ticketData.length === 0) {
      const defaults = JSON.parse(localStorage.getItem('supportTickets') || '[]');
      if (defaults.length > 0) await saveSupportTicketsToSupabase(defaults);
    } else {
      localStorage.setItem('supportTickets', JSON.stringify(ticketData));
    }
  }
}
