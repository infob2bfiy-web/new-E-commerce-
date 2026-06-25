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
    console.error("Error reading Supabase settings from localStorage", e);
  }

  return {
    supabaseUrl: url?.trim() || '',
    supabaseKey: key?.trim() || '',
    enabled: !!(url && key)
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
    console.error("Failed to save order to Supabase:", err);
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
    console.error("Failed to fetch orders from Supabase:", err);
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
