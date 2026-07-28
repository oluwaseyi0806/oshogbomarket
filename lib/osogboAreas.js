export const ACTIVE_LGAS = ["Osogbo"];

export const OSOGBO_AREAS = [
  "Oke-Fia", "Igbona", "Alekuwodo", "Stadium Area", "Oke-Baale",
  "Dada Estate", "Ayetoro", "Farm Center", "Old Garage", "Isale Osun",
  "Sabo", "Powerline", "Oke-Arungbo", "Odewale Junction", "Oke-Ayepe",
  "Gbonmi", "Obalende", "Obate", "Oke-Oniti", "Ido-Osun Road",
  "Ilesa Garage", "Ede Road", "Fakunle", "Okefia Ontario",
  "Adeleke Junction", "Okinni", "Ring Road", "Gbodofon", "Owode",
  "Ita-Olokan", "Testing Ground", "GRA Osogbo", "Amilegbe Road",
  "Cathedral Area", "Oja-Oba",
];

export const CATEGORIES = [
  "Phones & Tablets", "Electronics", "Fashion", "Home & Furniture",
  "Vehicles", "Food & Groceries", "Services", "Beauty & Perfumes",
  "Jewelry & Gold", "Health & Wellness", "Baby & Kids", "Sports & Fitness",
  "Books & Stationery", "Pets & Animals", "Building Materials", "Other",
];
export const ARTISAN_SKILLS = [
  "Plumber", "Electrician", "Painter", "Carpenter", "Mechanic",
  "AC Repair Technician", "Tailor", "Hairdresser/Barber", "Generator Repairer",
  "Tiler", "Welder", "Cleaner", "Photographer", "DJ/MC", "Caterer",
  "Bricklayer/Mason", "Phone/Laptop Repairer", "Solar Installer",
  "Cook/Chef", "Nanny/Babysitter", "Driver", "Security Guard", "Gardener",
  "Fashion Designer", "Makeup Artist", "Event Planner", "Interior Decorator",
  "Software Developer", "Graphic Designer", "Content Creator", "Videographer",
  "Tutor", "Laundry Service", "Fumigation Service", "POS Agent",
  "Real Estate Agent", "Dispatch Rider", "Shoe Cobbler", "Upholstery Repairer",
  "Refrigeration Technician", "CCTV Installer", "Network/Cable Installer",
  "Signage/Branding Specialist", "Printing Services", "Other Skill",
];
export const CATEGORY_ICONS = {
  "Phones & Tablets": "\uD83D\uDCF1",
  "Electronics": "\uD83D\uDCBB",
  "Fashion": "\uD83D\uDC57",
  "Home & Furniture": "\uD83D\uDECB",
  "Vehicles": "\uD83D\uDE97",
  "Food & Groceries": "\uD83C\uDF72",
  "Services": "\uD83D\uDEE0",
  "Other": "\uD83D\uDCE6",
  "Beauty & Perfumes": "\uD83D\uDC84",
  "Jewelry & Gold": "\uD83D\uDC8D",
  "Health & Wellness": "\uD83D\uDC8A",
  "Baby & Kids": "\uD83D\uDC76",
  "Sports & Fitness": "\u26BD",
  "Books & Stationery": "\uD83D\uDCDA",
  "Pets & Animals": "\uD83D\uDC15",
  "Building Materials": "\uD83E\uDDF1",
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