export const ACTIVE_LGAS = ["Osogbo"];

export const OSOGBO_AREAS = [
  "Adeleke Junction", "Agunbelewo", "Alekuwodo", "Amilegbe Road",
  "Ayetoro", "Cathedral Area", "Dada Estate", "Ede Road",
  "Fakunle", "Farm Center", "GRA Osogbo", "Gbodofon", "Gbonmi",
  "Ido-Osun Road", "Igbona", "Ilesa Garage", "Isale Osun",
  "Ita-Olokan", "Obalende", "Obate", "Oja-Oba", "Okefia Ontario",
  "Oke-Arungbo", "Oke-Ayepe", "Oke-Baale", "Oke-Fia", "Oke-Oniti",
  "Old Garage", "Owode", "Powerline", "Ring Road", "Sabo",
  "Stadium Area", "Testing Ground", "Odewale Junction",
].sort();

export const OSUN_LGAS = [
  "Boripe", "Boluwaduro", "Ifelodun", "Odo-Otin", "Olorunda",
  "Osogbo", "Ila", "Ifedayo", "Irepodun", "Orolu",
  "Atakumosa East", "Atakumosa West", "Ife Central", "Ife East", "Ife North",
  "Ife South", "Ilesa East", "Ilesa West", "Obokun", "Oriade",
  "Iwo", "Irewole", "Aiyedade", "Aiyedire", "Ede North",
  "Ede South", "Egbedore", "Ejigbo", "Isokan", "Ola Oluwa",
].sort();

export const CATEGORIES = [
  "Phones & Tablets", "Electronics", "Fashion", "Home & Furniture",
  "Vehicles", "Food & Groceries", "Services", "Beauty & Perfumes",
  "Jewelry & Gold", "Health & Wellness", "Baby & Kids", "Sports & Fitness",
  "Books & Stationery", "Pets & Animals", "Building Materials", "Other",
];

export const CATEGORY_ICONS = {
  "Phones & Tablets": "\uD83D\uDCF1",
  "Electronics": "\uD83D\uDCBB",
  "Fashion": "\uD83D\uDC57",
  "Home & Furniture": "\uD83D\uDECB",
  "Vehicles": "\uD83D\uDE97",
  "Food & Groceries": "\uD83C\uDF72",
  "Services": "\uD83D\uDEE0",
  "Beauty & Perfumes": "\uD83D\uDC84",
  "Jewelry & Gold": "\uD83D\uDC8D",
  "Health & Wellness": "\uD83D\uDC8A",
  "Baby & Kids": "\uD83D\uDC76",
  "Sports & Fitness": "\u26BD",
  "Books & Stationery": "\uD83D\uDCDA",
  "Pets & Animals": "\uD83D\uDC15",
  "Building Materials": "\uD83E\uDDF1",
  "Other": "\uD83D\uDCE6",
};

export const CATEGORY_FIELDS = {
  "Phones & Tablets": [
    { key: "storage", label: "Storage", type: "select", options: ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB+"] },
    { key: "brand", label: "Brand", type: "text" },
  ],
  "Vehicles": [
    { key: "year", label: "Year", type: "number" },
    { key: "mileage", label: "Mileage (km)", type: "number" },
    { key: "fuelType", label: "Fuel Type", type: "select", options: ["Petrol", "Diesel", "Electric", "Hybrid"] },
  ],
  "Electronics": [
    { key: "brand", label: "Brand", type: "text" },
    { key: "warranty", label: "Warranty", type: "select", options: ["No warranty", "Under 6 months", "6-12 months", "1 year+"] },
  ],
  "Fashion": [
    { key: "size", label: "Size", type: "text" },
    { key: "gender", label: "For", type: "select", options: ["Men", "Women", "Unisex", "Kids"] },
  ],
  "Home & Furniture": [
    { key: "material", label: "Material", type: "text" },
  ],
};

export const ARTISAN_SKILLS = [
  "Baker", "Bricklayer/Mason", "CCTV Installer", "Carpenter", "Caterer",
  "Cleaner", "Content Creator", "Cook/Chef", "DJ/MC", "Dispatch Rider",
  "Driver", "Electrician", "Event Planner", "Fashion Designer",
  "Fumigation Service", "Generator Repairer", "Graphic Designer",
  "Gardener", "Hairdresser/Barber", "Interior Decorator",
  "Laundry Service", "Makeup Artist", "Mechanic", "Nanny/Babysitter",
  "Network/Cable Installer", "Painter", "Phone/Laptop Repairer",
  "Photographer", "Plumber", "POS Agent", "Printing Services",
  "Real Estate Agent", "Refrigeration Technician", "Security Guard",
  "Shoe Cobbler", "Signage/Branding Specialist", "Software Developer",
  "Solar Installer", "Tailor", "Tiler", "Tutor", "Upholstery Repairer",
  "Videographer", "Welder", "Other Skill",
].sort();