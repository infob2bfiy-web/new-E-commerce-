# 🚀 Vercel-এ পাবলিশ এবং Supabase ইন্টিগ্রেশন গাইড

আপনার অর্গানিক গ্রোসারি ই-কমার্স ওয়েবসাইটটি সম্পূর্ণভাবে প্রস্তুত! নিচে ওয়েবসাইটটি **Supabase ক্লাউড ডাটাবেজ**-এ যুক্ত করার এবং **Vercel**-এ ফ্রিতে পাবলিশ করার সহজ বাংলা নির্দেশিকা দেওয়া হলো।

---

## ধাপ ১: Supabase-এ ডাটা টেবিল তৈরি করা

১. [Supabase](https://supabase.com/) এ গিয়ে ফ্রি একাউন্ট সাইন-আপ করুন এবং একটি নতুন প্রজেক্ট তৈরি করুন।
২. আপনার প্রজেক্ট ড্যাশবোর্ডের বাম পাশের মেনু থেকে **SQL Editor**-এ যান।
৩. একটি নতুন কোয়েরি খুলুন এবং নিচের SQL কোডটি পেস্ট করে নিচে ডান পাশের **Run** বাটনে ক্লিক করুন:

```sql
-- Create orders table in Supabase
create table public.orders (
  id bigint generated always as identity primary key,
  order_id text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date text,
  customer_name text,
  customer_phone text,
  customer_email text,
  division text,
  district text,
  area text,
  address text,
  note text,
  items jsonb,
  subtotal numeric,
  discount numeric,
  delivery_fee numeric,
  total_price numeric,
  payment_method text,
  status text default 'Pending'::text,
  synced_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table public.orders enable row level security;

-- Create policies so anyone can insert and read/update with correct API access
create policy "Enable insert for everyone" on public.orders for insert with check (true);
create policy "Enable read for everyone" on public.orders for select using (true);
create policy "Enable update for everyone" on public.orders for update using (true);
```

---

## ধাপ ২: Vercel-এ ওয়েবসাইট পাবলিশ করা

১. আপনার প্রজেক্টটি GitHub-এ পুশ করুন।
২. [Vercel](https://vercel.com/) এ লগইন করে **Add New > Project** এ যান এবং আপনার GitHub রিপোজিটরি সিলেক্ট করুন।
৩. ভেরসেল প্রজেক্ট ইম্পোর্ট করার সময় **Environment Variables** সেকশনে নিচের দুটি কী (Key) যোগ করুন:
   * **VITE_SUPABASE_URL** = `আপনার_সুপাবেস_প্রজেক্ট_ইউআরএল` (Settings > API-তে পাবেন)
   * **VITE_SUPABASE_ANON_KEY** = `আপনার_সুপাবেস_অ্যানন_পাবলিক_কী` (Settings > API-তে পাবেন)
৪. এবার **Deploy** বাটনে ক্লিক করুন। ২ মিনিটের মধ্যে আপনার লাইভ ওয়েবসাইট লিংক পেয়ে যাবেন!

---

## ধাপ ৩: অ্যাডমিন প্যানেল থেকে কানেকশন চেক করা

আপনার পাবলিশ করা সাইটে গিয়ে চাইলে আপনি ডাইরেক্টলি অ্যাডমিন প্যানেল থেকেও ক্রেডেনশিয়াল আপডেট করে লাইভ ডাটা কানেকশন টেস্ট করতে পারেন:
১. ব্রাউজারে `/admin` মেনুতে প্রবেশ করুন।
২. **সেটিংস > সুপাবেস ক্লাউড (Supabase)** সাব-ট্যাব সিলেক্ট করুন।
৩. আপনার URL এবং Anon Key বসিয়ে **সংরক্ষণ করুন (Save Settings)** বাটনে ক্লিক করুন।
৪. **কানেকশন টেস্ট করুন (Test Connection)** চাপুন। কোনো অসুবিধা না থাকলে সেটি সবুজ আকারে কানেক্টেড দেখাবে!
৫. এছাড়া পূর্বে থাকা কোনো লোকাল অফলাইন কাস্টমার অর্ডার থাকলে **সুপাবেসে সিঙ্ক করুন** ক্লিক করে সাথে সাথে ক্লাউড ড্যাশবোর্ডে পুশ করতে পারবেন।

🎉 শুভকামনা আপনার বিজনেস এবং নতুন ওয়েবসাইটের জন্য!
