/**
 * MONROE CLOSET STUDIO — PRODUCT DATABASE
 * High-end curated items with rich descriptions, specs, condition reports & multi-angle photography.
 */

const MONROE_PRODUCTS = [{
    "brandName": "Monroe Closet",
    "currency": "UAH",
    "items": [
      {
        "id": "blazer-blue-001",
        "brand": "H&M",
        "title": "Classic Light Blue Loose Blazer",
        "category": "Women's Clothing",
        "subcategory": "Blazers & Jackets",
        "price": 1450,
        "originalPrice": 2200,
        "condition": "Excellent",
        "rentalAvailable": true,
        "rentalPrice": 400,
        "images": [
          "img/dresses.png",
          "img/outerwear.png"
        ],
        "description": "Stylish women's loose-fit blazer in a delicate pastel blue color. Holds shape well, features a classic lapel collar and single-button closure, with practical flap pockets. Ideal for both office looks and casual stylings with jeans or dresses.",
        "details": {
          "composition": "70% polyester, 25% viscose, 5% elastane; lining: 100% polyester",
          "size": "M / EU 38",
          "measurements": "Back length: 72 cm, shoulder width: 41 cm, half-chest: 49 cm, sleeve length: 61 cm",
          "origin": "Cambodia",
          "conditionNotes": "Like-new condition, no visible defects, pills, or stains. Worn a few times for a photoshoot.",
          "authenticity": "Original, branded inner label"
        }
      },
      {
        "id": "earrings-silver-002",
        "brand": "Swarovski",
        "title": "Long Evening Silver Drop Earrings with Crystals",
        "category": "Accessories",
        "subcategory": "Earrings",
        "price": 1950,
        "originalPrice": 3400,
        "condition": "Great",
        "rentalAvailable": true,
        "rentalPrice": 350,
        "images": [
          "img/jewelry.png",
          "img/jewelry2,2.png"
        ],
        "description": "Exquisite long earrings with geometric moving pendants adorned with shimmering small crystals. Features a secure push-back closure. Creates a stunning accent for evening or festive looks, catching the light with every movement.",
        "details": {
          "composition": "925 Sterling Silver, rhodium plating (prevents tarnishing), jewelry crystals",
          "size": "One Size",
          "measurements": "Length: 5.5 cm, maximum width: 1.2 cm",
          "origin": "Austria",
          "conditionNotes": "All stones intact, clasps work perfectly, natural shine preserved. Professionally cleaned and sanitized.",
          "authenticity": "Original, hallmark on the back"
        }
      },
      {
        "id": "shoes-mesh-003",
        "brand": "Zara",
        "title": "Black Mesh High Heel Mules",
        "category": "Shoes",
        "subcategory": "Sandals",
        "price": 1200,
        "originalPrice": 1999,
        "condition": "Very Good",
        "rentalAvailable": true,
        "rentalPrice": 300,
        "images": [
          "img/jewelry2.png",
          "img/shoes6.png"
        ],
        "description": "Trendy black mule sandals featuring a textile mesh upper that softly hugs the foot. Open square toe design on a slender yet stable heel. Adds modern edge and sophistication to any evening or cocktail outfit.",
        "details": {
          "composition": "Upper: 100% polyester (mesh), insole: 100% polyurethane (eco-leather), sole: tunit",
          "size": "38",
          "measurements": "Insole length: 24.5 cm, heel height: 9 cm",
          "origin": "Vietnam",
          "conditionNotes": "Minor natural wear on the sole. Mesh is intact without snags, original heel taps in good condition.",
          "authenticity": "Original, brand marked on the insole"
        }
      },
      {
        "id": "bag-animal-004",
        "brand": "Guess",
        "title": "Snake-Pattern Animal Print Tote Bag",
        "category": "Accessories",
        "subcategory": "Bags",
        "price": 2800,
        "originalPrice": 4700,
        "condition": "Very Good",
        "rentalAvailable": true,
        "rentalPrice": 500,
        "images": [
          "img/jewelry2,3.png",
          "img/jewelry2,2.png"
        ],
        "description": "Striking and spacious structured tote bag made of grainy eco-leather with a black-and-white python print. Contrast black handles, gold-tone hardware, and a signature twist-lock closure. Features a large main compartment, inner zipper pocket, and open slots for small items.",
        "details": {
          "composition": "100% eco-leather (polyurethane), lining: textile (cotton/polyester)",
          "size": "Medium",
          "measurements": "Width: 32 cm, height (excluding handles): 21 cm, depth: 12 cm, handle drop: 13 cm",
          "origin": "China",
          "conditionNotes": "Hardware has micro-scratches unnoticeable during wear. Corners and handles are free of scuffs. Clean interior.",
          "authenticity": "Original, branded hardware and inner lining with logos"
        }
      },
      {
        "id": "decor-book-005",
        "brand": "No Brand",
        "title": "Decorative Book / Safe 'FASHIONable culture'",
        "category": "Home & Interior",
        "subcategory": "Decor & Accessories",
        "price": 450,
        "originalPrice": 650,
        "condition": "New",
        "rentalAvailable": false,
        "rentalPrice": null,
        "images": [
          "img/jewelry2,1.png",
          "img/jewelry2.png"
        ],
        "description": "Stylish interior book prop in a contrasting black-and-white color scheme with a bold 'FASHION' inscription. Ideal for decorating open shelves, coffee tables, showrooms, salons, or as a prop for photo shoots.",
        "details": {
          "composition": "Dense matte cardboard, internal frame",
          "size": "One Size",
          "measurements": "Height: 27 cm, width: 17.5 cm, thickness: 4.5 cm",
          "origin": "Ukraine",
          "conditionNotes": "Brand new condition, corners intact, no scuffs or dents.",
          "authenticity": "Decorative item"
        }
      },
      {
        "id": "eyewear-black-006",
        "brand": "Prada",
        "title": "Oversized Black Frame Sunglasses",
        "category": "Accessories",
        "subcategory": "Sunglasses",
        "price": 4900,
        "originalPrice": 9200,
        "condition": "Excellent",
        "rentalAvailable": true,
        "rentalPrice": 700,
        "images": [
          "img/jewelry2,2.png",
          "img/jewelry2,1.png"
        ],
        "description": "Legendary sunglasses in a thick black acetate frame. Classic shape with a slight cat-eye hint that flatters most face shapes. Dark lenses provide 100% UVA/UVB protection.",
        "details": {
          "composition": "Frame: 100% acetate, lenses: nylon with UV filter",
          "size": "Standard (53-19-140)",
          "measurements": "Frame width: 145 mm, lens height: 48 mm, temple length: 140 mm",
          "origin": "Italy",
          "conditionNotes": "No scratches on lenses or frame. Hinges are tight, temples move smoothly. Original hard case included.",
          "authenticity": "Original, serial number on inner temple and brand engraving"
        }
      },
      {
        "id": "decor-vase-007",
        "brand": "Handmade",
        "title": "Plaster Vase 'Female Body'",
        "category": "Home & Interior",
        "subcategory": "Decor & Accessories",
        "price": 680,
        "originalPrice": 950,
        "condition": "New",
        "rentalAvailable": false,
        "rentalPrice": null,
        "images": [
          "img/jewelry2,4.png",
          "img/jewelry2,3.png"
        ],
        "description": "Modern sculptural plaster vase/planter in the shape of an aesthetic female torso. Decorated with a pearl bead necklace. Can be used for dried flowers, artificial flowers, makeup brushes, or simply as an independent art object.",
        "details": {
          "composition": "High-strength sculptural plaster, protective matte finish, plastic pearls",
          "size": "One Size",
          "measurements": "Height: 20 cm, shoulder width: 12 cm, depth: 9 cm",
          "origin": "Ukraine",
          "conditionNotes": "Handmade product, no chips or defects.",
          "authenticity": "Original handmade art"
        }
      },
      {
        "id": "brand-logo-008",
        "brand": "Monroe Closet",
        "title": "Gift Certificate / Showroom Branding",
        "category": "Other Services",
        "subcategory": "Gift Cards & Certificates",
        "price": 0,
        "originalPrice": 0,
        "condition": "New",
        "rentalAvailable": false,
        "rentalPrice": null,
        "images": [
          "img/monroe-logo.png",
          "img/естетика.png"
        ],
        "description": "Brand logo of the premium segment showroom 'Monroe Closet'. Can be used as a cover for branded showroom gift certificates granting rights to rent or purchase exclusive clothing, shoes, and accessories.",
        "details": {
          "composition": "Digital design / branding",
          "size": "Square (for social media and print)",
          "measurements": "Not applicable",
          "origin": "Ukraine",
          "conditionNotes": "Exclusive corporate identity.",
          "authenticity": "Registered trademark 'Monroe Closet'"
        }
      },
      {
        "id": "look-lilac-009",
        "brand": "Zara / Intervallo",
        "title": "Set: Lilac Blazer & Purple Flats",
        "category": "Women's Clothing",
        "subcategory": "Suits & Sets",
        "price": 2700,
        "originalPrice": 4500,
        "condition": "Excellent",
        "rentalAvailable": true,
        "rentalPrice": 650,
        "images": [
          "img/outerwear.png",
          "img/shoes1.png"
        ],
        "description": "Bright and bold set for special occasions. Single-breasted oversized Zara blazer in a gentle lilac color paired with saturated purple leather pointed-toe flats from the Intervallo brand. A wonderful combo for creating a color-block look.",
        "details": {
          "composition": "Blazer: 100% polyester; Shoes: 100% genuine leather, leather insole",
          "size": "Blazer: M (EU 38), Shoes: 38 (24.5 cm)",
          "measurements": "Blazer: length 74 cm, shoulders 40 cm; Shoes: heel 1.5 cm",
          "origin": "Spain (blazer), Ukraine (shoes)",
          "conditionNotes": "Paper tag preserved on the blazer. Shoes have slight, barely noticeable natural leather creasing at the toe bend.",
          "authenticity": "Original (Zara) and original Ukrainian brand (Intervallo)"
        }
      },
      {
        "id": "sandals-pearls-010",
        "brand": "Jimmy Choo",
        "title": "Evening Heels with Pearls and Crystals",
        "category": "Shoes",
        "subcategory": "Sandals",
        "price": 8500,
        "originalPrice": 32000,
        "condition": "Very Good",
        "rentalAvailable": true,
        "rentalPrice": 1200,
        "images": [
          "img/shoes1.png",
          "img/shoes2.png",
          "img/shoes3.png",
          "img/shoes4.png"
        ],
        "description": "Elegant white/cream evening sandals on slender heels. The standout feature is the delicate ankle strap and upper strap adorned with large faux pearls and shimmering crystal metal beads. Features a thin strap and closed heel for secure foot support.",
        "details": {
          "composition": "Upper: 100% genuine leather (nappa), embellishments: faux pearls, crystals, metal hardware; sole: 100% leather",
          "size": "38",
          "measurements": "Insole length: 24.8 cm, heel height: 9.5 cm",
          "origin": "Italy",
          "conditionNotes": "Natural wear on the leather sole, preventative sole protection installed. All pearls and crystals are securely fixed, metal hardware is free of oxidation.",
          "authenticity": "Original, brand stamped on insole and sole, branded hardware markings"
        }
      }
    ]
  }
];

function getProductItems() {
  if (Array.isArray(MONROE_PRODUCTS)) {
    if (MONROE_PRODUCTS.length > 0 && Array.isArray(MONROE_PRODUCTS[0]?.items)) {
      return MONROE_PRODUCTS[0].items;
    }
    return MONROE_PRODUCTS;
  }
  if (MONROE_PRODUCTS && Array.isArray(MONROE_PRODUCTS.items)) {
    return MONROE_PRODUCTS.items;
  }
  return [];
}

function getProductById(id) {
  const items = getProductItems();
  if (!id) return items[0];
  const found = items.find(p => p.id === id);
  return found || items[0];
}

if (typeof window !== "undefined") {
  window.MONROE_PRODUCTS = MONROE_PRODUCTS;
  window.getProductItems = getProductItems;
  window.getProductById = getProductById;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MONROE_PRODUCTS, getProductItems, getProductById };
}
