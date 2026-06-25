// Bangladeshi Organic Grocery E-commerce - Sample Datasets

export const INITIAL_CATEGORIES = [
  { id: "mango", name: "আম (Mango)", subcategories: ["Amrapali", "Himsagor", "Lengra"] },
  { id: "oil-ghee", name: "তেল ও ঘি (Oil & Ghee)", subcategories: ["Mustard Oil", "Virgin Coconut Oil", "Ghee"] },
  { id: "honey", name: "মধু (Honey)", subcategories: ["Sundarban", "Litchi Flower", "Black Seed"] },
  { id: "dates", name: "খেজুর (Dates)", subcategories: ["Ajwa", "Medjool", "Kalmi"] },
  { id: "spices", name: "মসলা (Spices)", subcategories: ["Whole Spices", "Mixed Spices"] },
  { id: "nuts-seeds", name: "বাদাম ও বীজ (Nuts & Seeds)", subcategories: ["Nuts", "Seeds"] },
  { id: "beverage", name: "পানীয় (Beverage)", subcategories: ["Tea", "Coffee"] },
  { id: "flours-lentils", name: "আটা ও ডাল (Flours & Lentils)", subcategories: ["Atta", "Lentils"] },
  { id: "pickle", name: "আচার (Pickle)", subcategories: ["Mango Pickle", "Garlic Pickle", "Tamarind Pickle"] },
  { id: "lichi", name: "লিচু (Lichi)", subcategories: ["Dinajpur", "China-3", "Local"] },
  { id: "rice", name: "চাল (Rice)", subcategories: ["Nazirshail", "Kalizira", "Brown Rice"] }
];

export const INITIAL_PRODUCTS = [
  // Mango
  {
    id: "prod-mango-amrapali",
    name: "Premium Rajshahi Amrapali Mango (আম্রপালি আম)",
    category: "mango",
    subcategory: "Amrapali",
    price: 120,
    discountPrice: 110,
    stock: 50,
    description: "Freshly harvested premium Amrapali mangoes from Rajshahi orchards. Chemical-free and naturally ripened.",
    image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=600",
    tag: "Featured"
  },
  {
    id: "prod-mango-himsagor",
    name: "Satkhira Himsagor Mango (হিমসাগর আম)",
    category: "mango",
    subcategory: "Himsagor",
    price: 150,
    discountPrice: 130,
    stock: 35,
    description: "Highly sought-after sweet and aromatic Himsagor mangoes directly sourced from Satkhira.",
    image: "https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=600",
    tag: "Flash Sale"
  },
  {
    id: "prod-mango-lengra",
    name: "Sweet Lengra Mango (ল্যাংড়া আম)",
    category: "mango",
    subcategory: "Lengra",
    price: 140,
    discountPrice: 125,
    stock: 40,
    description: "Deliciously juicy Lengra mangoes, famous for their thin skin and distinct rich flavor.",
    image: "https://images.unsplash.com/photo-1605000797439-75a150088d44?auto=format&fit=crop&q=80&w=600",
    tag: "Preorder"
  },

  // Oil & Ghee
  {
    id: "prod-oil-ghee",
    name: "Premium Cow Ghee (খাঁটি গরুর ঘি)",
    category: "oil-ghee",
    subcategory: "Ghee",
    price: 1250,
    discountPrice: 1100,
    stock: 20,
    description: "Traditionally stirred purely organic clarified cow ghee, rich in flavor and aroma.",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600",
    tag: "Buy 1 Get 1"
  },
  {
    id: "prod-mustard-oil",
    name: "Cold Pressed Mustard Oil (সরিষার তেল)",
    category: "oil-ghee",
    subcategory: "Mustard Oil",
    price: 320,
    discountPrice: 290,
    stock: 60,
    description: "100% pure mustard oil extracted using traditional ghani wooden expeller method.",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600",
    tag: "Featured"
  },
  {
    id: "prod-coconut-oil",
    name: "Virgin Coconut Oil (নারকেল তেল)",
    category: "oil-ghee",
    subcategory: "Virgin Coconut Oil",
    price: 480,
    discountPrice: 420,
    stock: 30,
    description: "Extract of selected rich coconuts, cold-pressed raw virgin oil for versatile lifestyle needs.",
    image: "https://images.unsplash.com/photo-1622484211148-716598e0911a?auto=format&fit=crop&q=80&w=600",
    tag: "New"
  },

  // Honey
  {
    id: "prod-honey-sundarban",
    name: "Sundarban Flower Honey (সুন্দরবনের খলিসা মধু)",
    category: "honey",
    subcategory: "Sundarban",
    price: 900,
    discountPrice: 850,
    stock: 15,
    description: "Precious organic raw honey collected from Wild Khalisha flower of Sundarban mangroves.",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=600",
    tag: "Featured"
  },
  {
    id: "prod-honey-litchi",
    name: "Litchi Flower Honey (লিচু ফুলের মধু)",
    category: "honey",
    subcategory: "Litchi Flower",
    price: 650,
    discountPrice: 590,
    stock: 25,
    description: "Delightful organic honey sourced from extensive honeybee farms in Dinajpur Litchi gardens.",
    image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&q=80&w=600",
    tag: "New"
  },
  {
    id: "prod-honey-blackseed",
    name: "Black Seed Honey (কালিজিরা ফুলের মধু)",
    category: "honey",
    subcategory: "Black Seed",
    price: 980,
    discountPrice: 910,
    stock: 10,
    description: "Strong dark amber honey collected from Kali Jeera cumin flower farms, packed with health benefits.",
    image: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&q=80&w=600",
    tag: "Featured"
  },

  // Dates
  {
    id: "prod-dates-ajwa",
    name: "Madina Ajwa Dates Premium (আজওয়া খেজুর)",
    category: "dates",
    subcategory: "Ajwa",
    price: 950,
    discountPrice: 850,
    stock: 45,
    description: "Premium handpicked soft black dates from Al-Madinah, high nutritional, imported.",
    image: "https://images.unsplash.com/photo-1509223348103-9bb670fd7b31?auto=format&fit=crop&q=80&w=600",
    tag: "Flash Sale"
  },
  {
    id: "prod-dates-medjool",
    name: "Premium Egyptian Medjool Dates (মেদজুল খেজুর)",
    category: "dates",
    subcategory: "Medjool",
    price: 1300,
    discountPrice: 1150,
    stock: 28,
    description: "King of dates. Extremely large, soft, moist, wonderfully rich and caramel sweet.",
    image: "https://images.unsplash.com/photo-1618213837799-25d5552820d3?auto=format&fit=crop&q=80&w=600",
    tag: "Featured"
  },
  {
    id: "prod-dates-kalmi",
    name: "Kalmi Dates Imported (কালমি খেজুর)",
    category: "dates",
    subcategory: "Kalmi",
    price: 490,
    discountPrice: 430,
    stock: 50,
    description: "Authentic Kalmi dates, cylindrically long dark brown flesh with subtle sweetness.",
    image: "https://images.unsplash.com/photo-1541334903584-6338fe84ee1e?auto=format&fit=crop&q=80&w=600",
    tag: "New"
  },

  // Spices
  {
    id: "prod-spice-cardamom",
    name: "Premium Guatemala Cardamom (এলাচ)",
    category: "spices",
    subcategory: "Whole Spices",
    price: 420,
    discountPrice: 380,
    stock: 80,
    description: "Extremely strong aromatic large green cardamom pods, freshly sourced whole spice.",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600",
    tag: "Featured"
  },
  {
    id: "prod-spice-turmeric",
    name: "Organic Turmeric Powder (হলুদ গুড়া)",
    category: "spices",
    subcategory: "Mixed Spices",
    price: 130,
    discountPrice: 110,
    stock: 120,
    description: "Perfect golden organic turmeric processed with utmost hygiene - full of curcumin components.",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=600",
    tag: "New"
  },

  // Nuts & Seeds
  {
    id: "prod-nuts-mixed",
    name: "Premium Mixed Dry Nuts (মিক্সড বাদাম)",
    category: "nuts-seeds",
    subcategory: "Nuts",
    price: 680,
    discountPrice: 590,
    stock: 40,
    description: "Perfect balanced mix formulation of Almonds, Cashew Nuts, Pistachios, Walnuts, and Raisins.",
    image: "https://images.unsplash.com/photo-1608797178974-15b35a61d121?auto=format&fit=crop&q=80&w=600",
    tag: "Featured"
  },
  {
    id: "prod-seeds-chia",
    name: "Raw Organic Chia Seeds (চিয়া সিড)",
    category: "nuts-seeds",
    subcategory: "Seeds",
    price: 340,
    discountPrice: 280,
    stock: 75,
    description: "Superfood organic chia seeds loaded with Omega-3 fatty acids, dietary fibers, and minerals.",
    image: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=600",
    tag: "Flash Sale"
  },

  // Beverage
  {
    id: "prod-bev-blacktea",
    name: "Premium Sylhet Black Tea (সিলেটী ব্ল্যাক টি)",
    category: "beverage",
    subcategory: "Tea",
    price: 190,
    discountPrice: 170,
    stock: 90,
    description: "Finest Orthodox CTC tea leaves picked from tea estates of Sreemangal, Sylhet.",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=600",
    tag: "New"
  },

  // Flours & Lentils
  {
    id: "prod-flour-atta",
    name: "Organic Multigrain Atta (মল্টিগ্রেইন আটা)",
    category: "flours-lentils",
    subcategory: "Atta",
    price: 130,
    discountPrice: 115,
    stock: 65,
    description: "Wholesale nutrition mix of Wheat, Barley, Chickpea, Oats, Maize and Flaxseeds flour.",
    image: "https://images.unsplash.com/photo-1549590143-d5855148a9d5?auto=format&fit=crop&q=80&w=600",
    tag: "New"
  },

  // Pickle
  {
    id: "prod-pickle-mango",
    name: "Spicy Mango Pickle (টক মিষ্টি ঝাল আমের আচার)",
    category: "pickle",
    subcategory: "Mango Pickle",
    price: 190,
    discountPrice: 160,
    stock: 35,
    description: "Traditional homemade recipe pickled green mango slices in organic cold pressed mustard oil.",
    image: "https://images.unsplash.com/photo-1647462417772-5ccf2bca5304?auto=format&fit=crop&q=80&w=600",
    tag: "Featured"
  },

  // Lichi
  {
    id: "prod-lichi-bedana",
    name: "Dinajpur Bedana Lichi Premium (বেদানা লিচু)",
    category: "lichi",
    subcategory: "Dinajpur",
    price: 490,
    discountPrice: 450,
    stock: 100,
    description: "Famous Dinajpur Bedana Litchis. High flesh proportion, tiny seed, sweet premium taste. Price per 100 pieces.",
    image: "https://images.unsplash.com/photo-1628135898808-1cc6868846be?auto=format&fit=crop&q=80&w=600",
    tag: "Preorder"
  },

  // Rice
  {
    id: "prod-rice-nazirshail",
    name: "Premium Sylhet Nazirshail Rice (নাজিরশাইল চাল)",
    category: "rice",
    subcategory: "Nazirshail",
    price: 85,
    discountPrice: 80,
    stock: 200,
    description: "Highest grade long, slender-grain premium polished parboiled Nazirshail rice.",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600",
    tag: "Featured"
  }
];

export const BANGLADESH_DISTRICTS = [
  "Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail",
  "Chattogram", "Cox's Bazar", "Bandarban", "Rangamati", "Khagrachhari", "Cumilla", "Feni", "Brahmanbaria", "Noakhali", "Lakshmipur", "Chandpur",
  "Rajshahi", "Bogura", "Joypurhat", "Naogaon", "Natore", "Nawabganj", "Pabna", "Sirajganj",
  "Khulna", "Bagerhat", "Chuadanga", "Jessore", "Jhenaidah", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira",
  "Barishal", "Barguna", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur",
  "Sylhet", "Habiganj", "Moulvibazar", "Sunamganj",
  "Rangpur", "Dinajpur", "Gaibandha", "Kurigram", " Lalmonirhat", "Nilphamari", "Panchagarh", "Thakurgaon",
  "Mymensingh", "Jamalpur", "Netrokona", "Sherpur"
].sort();

export const DEFAULT_SITE_SETTINGS = {
  siteName: "আম্রপালি",
  tagline: "🚚 ঢাকায় ফ্রি ডেলিভারি ৳৫০০+ অর্ডারে!",
  logoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=150",
  favicon: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=150",
  phone: "01789-123456",
  bkash: "01789-123456",
  nagad: "01823-654321",
  announcement: "💥 ফ্রি ডেলিভারি সারা বাংলাদেশে ৫০০+ টাকার অর্ডারে bKash/Nagad কুপনে!",
  footerText: "Premium Organic grocery directly from local farmers of Bangladesh to your dining table safely.",
  footerLogoUrl: "",
  footerLogoText: ""
};

export const INITIAL_BANNERS = [
  { id: "ban-1", imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200", title: "১০০% অর্গ্যানিক ও তাজা ফলমূল", text: "রাসায়নিক মুক্ত মিষ্টি স্বাদের আম ও দিনাজপুরের সেরা লিচু কিনুন সাশ্রয়ী মূল্যে।" },
  { id: "ban-2", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=1200", title: "ঘানি ভাঙা খাস তেল ও খাঁটি ঘি", text: "আমাদের নিজস্ব তত্ত্বাবধানে কাঠ ভাঙা ঘানির তেল ও ঐতিহ্যবাহী খাঁটি ঘি।" },
  { id: "ban-3", imageUrl: "https://images.unsplash.com/photo-1509223348103-9bb670fd7b31?auto=format&fit=crop&q=80&w=1200", title: "মদিনার প্রিমিয়াম খেজুর ও মধু", text: "আজওয়া খেজুর ও সুন্দরবনের খাটি খলিসা ফুলের মধু সরাসরি আমাদের কাছে স্টকড!" }
];

export const INITIAL_COUPONS = [
  { code: "EID20", type: "percentage", value: 20, description: "ঈদ ধামাকা অফার ২০% ছাড়!" },
  { code: "FREE50", type: "flat", value: 50, description: "৫০ টাকা ফ্ল্যাট ছাড়!" },
  { code: "BKASH10", type: "percentage", value: 10, description: "bKash পেমেন্টে ১০% সাশ্রয়!" }
];
