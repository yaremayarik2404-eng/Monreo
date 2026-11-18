/**
 * MONROE CLOSET STUDIO — PRODUCT DATABASE
 * High-end curated items with rich descriptions, specs, condition reports & multi-angle photography.
 */

const MONROE_PRODUCTS = [
  // =========================================================================
  // 1. CLOTHING: OUTERWEAR
  // =========================================================================
  {
    id: "max-mara-coat",
    brand: "MAX MARA",
    title: "Manuela Iconic Camel Hair Coat",
    category: "Clothing",
    subcategory: "Outerwear",
    price: 3450,
    originalPrice: 4890,
    condition: "Pristine",
    rentalAvailable: true,
    rentalPrice: 380,
    images: [
      "https://images.unsplash.com/photo-1539533018447-63fcce667823?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=85"
    ],
    description: "The epitome of timeless quiet luxury. Designed in 1998, the Manuela coat is tailored from pure brushed camel hair that offers incomparable warmth, lightweight drape, and subtle sheen. Featuring a relaxed wrap silhouette with matching self-tie belt, notched lapels, and custom monogram cupro lining.",
    details: {
      composition: "100% Beaver-Finish Camel Hair; Lining: 100% Cupro",
      size: "IT 40 (Fits True to Size S / Small)",
      measurements: "Bust: 98 cm | Shoulder: 42 cm | Total Length: 115 cm | Sleeve: 60 cm",
      origin: "Made in Italy",
      conditionNotes: "Pristine condition. Flawless fabric with no signs of wear, fabric pilling or odor. Includes original Max Mara garment travel bag.",
      authenticity: "Certified authentic with verified brand serial tags."
    }
  },
  {
    id: "burberry-trench",
    brand: "BURBERRY",
    title: "Heritage Kensington Gabardine Trench Coat",
    category: "Clothing",
    subcategory: "Outerwear",
    price: 1850,
    originalPrice: 3150,
    condition: "Excellent",
    rentalAvailable: true,
    rentalPrice: 220,
    images: [
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=85"
    ],
    description: "The iconic British classic crafted from water-repellent cotton gabardine invented by Thomas Burberry. Designed with double-breasted closure, signature shoulder epaulets, storm flap, horn buttons, and Vintage Check archive cotton lining.",
    details: {
      composition: "100% Weatherproof Cotton Gabardine; Lining: 100% Vintage Check Cotton",
      size: "UK 8 / US 4 (Small)",
      measurements: "Chest: 94 cm | Length: 105 cm | Raglan Sleeve: 72 cm",
      origin: "Made in Castleford, England",
      conditionNotes: "Excellent condition. Belt buckle leather and buttons fully intact. Minor hairline crease consistent with light wear.",
      authenticity: "Original Burberry London serial label and hardware engravings present."
    }
  },

  // =========================================================================
  // 2. CLOTHING: BLAZERS
  // =========================================================================
  {
    id: "balmain-blazer",
    brand: "BALMAIN",
    title: "Double-Breasted Wool Blazer with Embossed Gold Buttons",
    category: "Clothing",
    subcategory: "Blazers",
    price: 1750,
    originalPrice: 2995,
    condition: "Pristine",
    rentalAvailable: true,
    rentalPrice: 250,
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&w=1200&q=85"
    ],
    description: "Balmain's definitive power silhouette. Precision cut from dense twill virgin wool, featuring structured padded architectural shoulders, peak lapels, and signature lion-embossed crest buttons in polished gold hardware.",
    details: {
      composition: "100% Virgin Wool; Full Twill Viscose Lining",
      size: "FR 36 (Fits XS - Small)",
      measurements: "Shoulder to Shoulder: 39 cm | Waist: 74 cm | Length: 64 cm",
      origin: "Made in France",
      conditionNotes: "Pristine archival piece. Shows no signs of use; spare button included in inner pocket.",
      authenticity: "Verified authentic Balmain Paris heritage label."
    }
  },
  {
    id: "saint-laurent-tuxedo",
    brand: "SAINT LAURENT",
    title: "Le Smoking Grain de Poudre Tuxedo Jacket",
    category: "Clothing",
    subcategory: "Blazers",
    price: 2100,
    originalPrice: 3650,
    condition: "Pristine",
    rentalAvailable: true,
    rentalPrice: 320,
    images: [
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1200&q=85"
    ],
    description: "A permanent tribute to Yves Saint Laurent’s groundbreaking 1966 'Le Smoking'. Cut from textured grain de poudre wool with glossy satin silk peak lapels and covered single-button closure.",
    details: {
      composition: "100% Grain de Poudre Virgin Wool; 100% Silk Lapels & Satin Lining",
      size: "FR 38 (Small/Medium)",
      measurements: "Shoulder: 40 cm | Chest: 90 cm | Length: 68 cm",
      origin: "Made in Italy",
      conditionNotes: "Pristine condition. Flawless silk satin lapels without scratches or pulls.",
      authenticity: "Yves Saint Laurent Paris authentic signature label."
    }
  },

  // =========================================================================
  // 3. CLOTHING: DRESSES
  // =========================================================================
  {
    id: "dior-silk-dress",
    brand: "DIOR",
    title: "Sunray Pleated Silk Georgette Evening Dress",
    category: "Clothing",
    subcategory: "Dresses",
    price: 2650,
    originalPrice: 5400,
    condition: "Pristine",
    rentalAvailable: true,
    rentalPrice: 390,
    images: [
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1200&q=85"
    ],
    description: "An ethereal runway evening dress tailored from lightweight 100% silk georgette with delicate micro sunray pleating. Features a crossover V-neckline, subtly defined waistline, and fluid floor-sweeping movement.",
    details: {
      composition: "100% Silk Georgette; 100% Silk Crepe Underslip",
      size: "FR 36 (Fits US 2 - 4)",
      measurements: "Bust: 86 cm | Waist: 68 cm | Length from shoulder: 135 cm",
      origin: "Made in France",
      conditionNotes: "Pristine. Professional eco-luxury dry cleaned and ready to wear for gala or red carpet.",
      authenticity: "Christian Dior Paris Haute Couture tag intact."
    }
  },
  {
    id: "chanel-tweed-dress",
    brand: "CHANEL",
    title: "Archival Autumn Monochrome Tweed Shift Dress",
    category: "Clothing",
    subcategory: "Dresses",
    price: 3200,
    originalPrice: 6200,
    condition: "Excellent",
    rentalAvailable: true,
    rentalPrice: 450,
    images: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=85"
    ],
    description: "Karl Lagerfeld-era vintage Chanel masterpiece. Woven from heavyweight fantasy tweed in black and ivory with silver metallic threads, finished with CC Camellia button detailing at the back and pure silk Camellia jacquard lining.",
    details: {
      composition: "Wool, Mohair & Polyamide Fantasy Tweed; 100% Silk Camellia Lining",
      size: "FR 38 (Small)",
      measurements: "Bust: 88 cm | Waist: 76 cm | Hips: 94 cm | Length: 88 cm",
      origin: "Made in France",
      conditionNotes: "Excellent archival condition with firm tweed weave and lustrous silver hardware.",
      authenticity: "Chanel Boutique label with serial authenticity numbers."
    }
  },

  // =========================================================================
  // 4. CLOTHING: TOPS / T-SHIRTS
  // =========================================================================
  {
    id: "celine-tee",
    brand: "CELINE",
    title: "Triomphe Classic Logo Cotton Jersey T-Shirt",
    category: "Clothing",
    subcategory: "Tops/ T-shirts",
    price: 520,
    originalPrice: 790,
    condition: "Pristine",
    rentalAvailable: false,
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=85"
    ],
    description: "Cut from ultra-soft combed organic cotton jersey in an off-white hue with vintage enzyme wash finish. Adorned with the archival Celine Paris Triomphe graphic across the chest.",
    details: {
      composition: "100% Combed Organic Cotton",
      size: "Size S (Slightly relaxed fit)",
      measurements: "Chest: 96 cm | Shoulder: 41 cm | Length: 63 cm",
      origin: "Made in Portugal",
      conditionNotes: "Pristine condition. Fresh and unwashed after boutique purchase.",
      authenticity: "Verified Celine internal wash and serial codes."
    }
  },

  // =========================================================================
  // 5. CLOTHING: SHIRTS / BLOUSES
  // =========================================================================
  {
    id: "ysl-silk-blouse",
    brand: "SAINT LAURENT",
    title: "Lavallière Tie-Neck Silk Chiffon Blouse",
    category: "Clothing",
    subcategory: "Shirts/ Blouses",
    price: 1150,
    originalPrice: 2100,
    condition: "Pristine",
    rentalAvailable: true,
    rentalPrice: 190,
    images: [
      "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=1200&q=85"
    ],
    description: "Sensual and refined sheer black silk chiffon blouse featuring a fluid lavallière pussy-bow necktie, buttoned French cuffs, and draped shoulders. Pairs effortlessly under tailored jackets.",
    details: {
      composition: "100% Mulberry Silk Chiffon",
      size: "FR 36 (Fits XS / S)",
      measurements: "Bust: 92 cm | Length: 66 cm | Tie Length: 80 cm",
      origin: "Made in Italy",
      conditionNotes: "Pristine. Fabric is crisp with no snags or pulls.",
      authenticity: "Original Saint Laurent Paris neck label and tag."
    }
  },

  // =========================================================================
  // 6. CLOTHING: PANTS
  // =========================================================================
  {
    id: "the-row-trousers",
    brand: "THE ROW",
    title: "Igor Wide-Leg Pleated Virgin Wool Trousers",
    category: "Clothing",
    subcategory: "Pants",
    price: 1290,
    originalPrice: 2250,
    condition: "Pristine",
    rentalAvailable: false,
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=85"
    ],
    description: "The quintessential slouchy luxury trouser from The Row. Spun from lightweight virgin wool with deep front pleats, hidden zip fly, and a languid fluid drape down to the ankles.",
    details: {
      composition: "100% Virgin Wool; Horn Button details",
      size: "US 4 (Small)",
      measurements: "Waist: 72 cm | Rise: 34 cm | Inseam: 82 cm | Leg Opening: 28 cm",
      origin: "Made in Italy",
      conditionNotes: "Pristine condition. Hemline unaltered, like new.",
      authenticity: "Guaranteed authentic The Row signature label."
    }
  },

  // =========================================================================
  // 7. CLOTHING: JEANS
  // =========================================================================
  {
    id: "loewe-jeans",
    brand: "LOEWE",
    title: "Anagram Embroidered High-Rise Wide-Leg Denim",
    category: "Clothing",
    subcategory: "Jeans",
    price: 890,
    originalPrice: 1450,
    condition: "Pristine",
    rentalAvailable: false,
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?auto=format&fit=crop&w=1200&q=85"
    ],
    description: "Rigid stonewashed blue organic cotton denim with signature Loewe leather Anagram patch on the back and laser-cut knee detailing. Modern high-waisted cut with wide relaxed legs.",
    details: {
      composition: "100% Rigid Organic Cotton; Calfskin Leather Trim",
      size: "Size 36 (US 26 Waist)",
      measurements: "Waist: 68 cm | Rise: 31 cm | Inseam: 80 cm",
      origin: "Made in Italy",
      conditionNotes: "Pristine. Worn once for editorial studio photoshoot.",
      authenticity: "Loewe embossed leather patch and interior authentication tag."
    }
  },

  // =========================================================================
  // 8. CLOTHING: SKIRTS
  // =========================================================================
  {
    id: "prada-skirt",
    brand: "PRADA",
    title: "Re-Nylon Pleated Mini Skirt with Belt",
    category: "Clothing",
    subcategory: "Skirts",
    price: 1190,
    originalPrice: 1950,
    condition: "Pristine",
    rentalAvailable: true,
    rentalPrice: 180,
    images: [
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1577900232427-18219b9166a0?auto=format&fit=crop&w=1200&q=85"
    ],
    description: "Crafted from Prada’s signature sustainable Re-Nylon fabric, produced from recycled oceanic plastic. Features crisp knife pleating, side zip closure, and an adjustable belt adorned with the enameled metal triangle logo.",
    details: {
      composition: "100% Regenerated Polyamide (Re-Nylon)",
      size: "IT 38 (XS / Small)",
      measurements: "Waist: 66 cm | Total Length: 42 cm",
      origin: "Made in Italy",
      conditionNotes: "Pristine condition. Triangle plaque unscratched.",
      authenticity: "Prada Milano triangular enamel plaque and authenticity RFID chip."
    }
  },

  // =========================================================================
  // 9. BAGS
  // =========================================================================
  {
    id: "chanel-double-flap",
    brand: "CHANEL",
    title: "Medium Classic Double Flap Bag in Black Caviar with Gold Hardware",
    category: "Bags",
    subcategory: "Bags",
    price: 9850,
    originalPrice: 12400,
    condition: "Pristine",
    rentalAvailable: true,
    rentalPrice: 750,
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=85"
    ],
    description: "The undisputed crown jewel of luxury fashion. Quilted durable black caviar calfskin with 24-karat gold-plated turnlock CC closure and interwoven leather-chain strap. Features double flap interior compartments lined in burgundy lambskin with double CC embroidery.",
    details: {
      composition: "Grained Caviar Calfskin; Burgundy Smooth Lambskin Interior",
      measurements: "25.5 cm × 15.5 cm × 6.5 cm | Shoulder Strap Drop: 43 cm (Single) / 24 cm (Double)",
      origin: "Made in France",
      conditionNotes: "Pristine archival condition. Sturdy structure, sharp corners, hardware retains mirror shine with no tarnishing. Includes original magnetic boutique box, dust bag, booklet, and Entrupy certification card.",
      authenticity: "100% Entrupy AI Authenticated with verifiable digital certificate."
    }
  },
  {
    id: "hermes-birkin-30",
    brand: "HERMÈS",
    title: "Birkin 30 Togo Leather in Gold with Palladium Hardware",
    category: "Bags",
    subcategory: "Bags",
    price: 24500,
    originalPrice: 28000,
    condition: "Pristine",
    rentalAvailable: false,
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85"
    ],
    description: "The pinnacle of leather craftsmanship. Hand-stitched in France from fine-grained Togo calfskin in Hermès’s most famous signature 'Gold' caramel hue, accentuated by crisp white contrast saddle stitching and gleaming Palladium hardware.",
    details: {
      composition: "100% Veau Togo Calfskin; Chevre Mysore Goatskin Lining",
      measurements: "30 cm × 22 cm × 16 cm | Handle Drop: 10 cm",
      origin: "Made in France (Craftsman Stamp Verified)",
      conditionNotes: "Pristine collector condition with protective plastics on select hardware plates. Full boutique set including clochette, lock, two keys, felt protector, rain kit, dust bags, and orange box.",
      authenticity: "Complete Hermès provenance with physical authentication report."
    }
  },
  {
    id: "lv-pochette-metis",
    brand: "LOUIS VUITTON",
    title: "Pochette Métis Monogram Crossbody Bag",
    category: "Bags",
    subcategory: "Bags",
    price: 2450,
    originalPrice: 3350,
    condition: "Excellent",
    rentalAvailable: false,
    images: [
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=1200&q=85"
    ],
    description: "The effortlessly chic satchel in heritage Monogram coated canvas. Featuring natural cowhide leather handle, iconic golden S-lock closure, exterior zippered pocket, and removable adjustable shoulder strap.",
    details: {
      composition: "Monogram Coated Canvas; Natural Vachetta Cowhide; Brown Microfiber Lining",
      measurements: "25 cm × 19 cm × 7 cm",
      origin: "Made in France",
      conditionNotes: "Excellent condition. Hardware shines bright with light surface hairlines. Vachetta leather has developed an even, light honey patina.",
      authenticity: "Authentic Louis Vuitton microchip/date code verified."
    }
  },

  // =========================================================================
  // 10. SHOES
  // =========================================================================
  {
    id: "chanel-slingbacks",
    brand: "CHANEL",
    title: "Two-Tone Cap-Toe Slingback Pumps in Beige & Black",
    category: "Shoes",
    subcategory: "Shoes",
    price: 1150,
    originalPrice: 1650,
    condition: "Pristine",
    rentalAvailable: false,
    images: [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=1200&q=85"
    ],
    description: "The shoe that Gabrielle Chanel famously proclaimed 'the height of elegance'. Supple beige lambskin visually lengthens the leg, while the black grosgrain cap-toe shortens the foot and protects from scuffs. Set on a wearable 65mm block heel with subtle CC emblem.",
    details: {
      composition: "Lambskin Leather & Grosgrain Fabric; Full Leather Sole",
      size: "EU 38 (Fits True to Size)",
      heelHeight: "65 mm",
      origin: "Made in Italy",
      conditionNotes: "Pristine condition. Includes dust bags and box.",
      authenticity: "Engraved CC logo on heel and serial imprint on insole."
    }
  },
  {
    id: "hermes-oran-sandals",
    brand: "HERMÈS",
    title: "Oran Sandals in Gold Epsom Calfskin",
    category: "Shoes",
    subcategory: "Shoes",
    price: 890,
    originalPrice: 1150,
    condition: "Pristine",
    rentalAvailable: false,
    images: [
      "https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=85"
    ],
    description: "The summer icon designed in 1997. Defined by the clean geometric 'H' strap in textured Gold Epsom leather with natural raw hazelnut leather sole and ecru saddle stitching.",
    details: {
      composition: "100% Epsom Calfskin Leather; Leather Sole & Lining",
      size: "EU 38.5",
      origin: "Made in Italy",
      conditionNotes: "Pristine. Protective sole covers attached.",
      authenticity: "Hermès Paris gold foil stamp on insole."
    }
  },

  // =========================================================================
  // 11. ACCESSORIES / JEWELRY
  // =========================================================================
  {
    id: "cartier-love-bracelet",
    brand: "CARTIER",
    title: "LOVE Bracelet in 18k Yellow Gold (Size 17)",
    category: "Accessories / jewelry",
    subcategory: "Accessories / jewelry",
    price: 7450,
    originalPrice: 9650,
    condition: "Pristine",
    rentalAvailable: true,
    rentalPrice: 500,
    images: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1611591475152-478311399767?auto=format&fit=crop&w=1200&q=85"
    ],
    description: "An icon of modern design conceived in 1969 New York by Aldo Cipullo. Crafted from solid 750/1000 18k yellow gold and punctuated by Cartier’s legendary screw motifs. Designed to be worn day and night as a permanent symbol of devoted love.",
    details: {
      composition: "18k Yellow Gold (750/1000)",
      size: "Cartier Size 17 (Fits wrist circumference up to 16.5 cm)",
      weight: "Approx. 31.4 grams",
      origin: "Handcrafted in Switzerland",
      conditionNotes: "Pristine condition. Professionally cleaned by master jeweler. Complete with original screwdriver, inner red presentation box, outer box, and Cartier certificate.",
      authenticity: "Individual serial number engraved and matched to official certificate."
    }
  }
];

function getProductById(id) {
  if (!id) return MONROE_PRODUCTS[0];
  const found = MONROE_PRODUCTS.find(p => p.id === id);
  return found || MONROE_PRODUCTS[0];
}

if (typeof window !== "undefined") {
  window.MONROE_PRODUCTS = MONROE_PRODUCTS;
  window.getProductById = getProductById;
}
