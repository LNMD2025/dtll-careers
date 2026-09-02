export type PageKey = "home" | "pizza" | "pasta" | "coffee" | "cookies" | "careers";

export interface SlotDef {
  slot_key: string;
  page: PageKey;
  page_label: string;
  label: string;
  sort: number;
  default_url: string;
  overlay_title: string;
  overlay_subtitle: string;
  overlay_body: string;
}

const HOME = "Home";
const PIZZA = "Pizza";
const PASTA = "Pasta";
const COFFEE = "Coffee";
const COOKIES = "Cookies";
const CAREERS = "Careers";

function slot(
  page: PageKey,
  pageLabel: string,
  n: number,
  slot_key: string,
  default_url: string,
  overlay_title = "",
  overlay_subtitle = "",
  overlay_body = "",
): SlotDef {
  return {
    slot_key,
    page,
    page_label: pageLabel,
    label: `${pageLabel} page image ${n}`,
    sort: n * 10,
    default_url,
    overlay_title,
    overlay_subtitle,
    overlay_body,
  };
}

export const SLOT_CATALOG: SlotDef[] = [
  slot("home", HOME, 1, "home-1", "/media/hero-spread.jpg", "DTLL Group", "Dough Bros · Paradise · Nalou", "Three rooms. One standard. Mount Gambier."),
  slot("home", HOME, 2, "home-2", "/media/doughbros-shop-01.jpg", "Food people come back for.", "The rooms", ""),
  slot("home", HOME, 3, "home-3", "/media/paradise-shop-02.jpg"),
  slot("home", HOME, 4, "home-4", "/media/pizza-card.jpg", "Pizza", "Dough Bros & Paradise", "Slow rise. Loaded. Built to disappear."),
  slot("home", HOME, 5, "home-5", "/media/pasta-card.jpg", "Pasta", "House sauce", "Carbonara. Bolognese. Chilli penne."),
  slot("home", HOME, 6, "home-6", "/media/nalou-coffee-01.jpg", "Coffee", "Nalou Kitchen", "Long coffees. Damn good food by day."),
  slot("home", HOME, 7, "home-7", "/media/doughbros-cookie-01.jpg", "Cookies", "Dough Bros", "Too much. On purpose."),

  slot("pizza", PIZZA, 1, "pizza-1", "/media/pizza-hero.jpg", "Pizza.", "Dough Bros & Paradise", "Slow rise. Loaded. Built to disappear."),
  slot("pizza", PIZZA, 2, "pizza-2", "/media/pizza-hero.jpg", "Better inputs. Bigger pies.", "", ""),
  slot("pizza", PIZZA, 3, "pizza-3", "/media/pizza-card.jpg"),
  slot("pizza", PIZZA, 4, "pizza-4", "/media/doughbros-shop-01.jpg", "Dough Bros", "Marketplace", "Pink neon. Slow dough. Pizza and pasta under one roof."),
  slot("pizza", PIZZA, 5, "pizza-5", "/media/doughbros-shop-02.jpg"),
  slot("pizza", PIZZA, 6, "pizza-6", "/media/paradise-pizza-01.jpg", "Paradise", "205 Commercial St W", "Pizza Lovers Club. Hot from the warmer."),
  slot("pizza", PIZZA, 7, "pizza-7", "/media/paradise-shop-02.jpg"),
  slot("pizza", PIZZA, 8, "pizza-8", "/media/pizza-slice.jpg", "Take the slice.", "", ""),

  slot("pasta", PASTA, 1, "pasta-1", "/media/pasta-hero.jpg", "Pasta.", "Dough Bros & Paradise", "House sauce. Italian pasta."),
  slot("pasta", PASTA, 2, "pasta-2", "/media/gallery-spread.jpg", "Carbonara. Bolognese. Chilli penne.", "", ""),
  slot("pasta", PASTA, 3, "pasta-3", "/media/pasta-lasagna.jpg", "Lasagna.", "The bake", "Layers. Sauce. The slice that holds."),
  slot("pasta", PASTA, 4, "pasta-4", "/media/doughbros-shop-01.jpg", "Same kitchens. Same obsession.", "", ""),

  slot("coffee", COFFEE, 1, "coffee-1", "/media/nalou-coffee-01.jpg", "Coffee.", "Nalou Kitchen", "Long coffees. 82 Commercial Street West."),
  slot("coffee", COFFEE, 2, "coffee-2", "/media/nalou-coffee-01.jpg", "Toasted. Tall. First.", "", ""),
  slot("coffee", COFFEE, 3, "coffee-3", "/media/nalou-coffee-02.jpg"),
  slot("coffee", COFFEE, 4, "coffee-4", "/media/nalou-brunch-01.jpg", "Brunch that earns the coffee.", "By day", ""),
  slot("coffee", COFFEE, 5, "coffee-5", "/media/gallery-nalou-brunch.jpg"),
  slot("coffee", COFFEE, 6, "coffee-6", "/media/nalou-food-01.jpg", "Damn good food.", "The pass", ""),
  slot("coffee", COFFEE, 7, "coffee-7", "/media/nalou-kitchen.jpg"),
  slot("coffee", COFFEE, 8, "coffee-8", "/media/careers-team.jpg", "Stay a while.", "", ""),

  slot("cookies", COOKIES, 1, "cookies-1", "/media/doughbros-cookie-01.jpg", "Cookies.", "Loaded NY cookies · Dough Bros", "Too much. On purpose."),
  slot("cookies", COOKIES, 2, "cookies-2", "/media/doughbros-cookie-02.jpg", "Biscoff. Reese’s. Nutella M&M.", "", ""),
  slot("cookies", COOKIES, 3, "cookies-3", "/media/cookies-hero.jpg", "Marble top deck.", "The counter", "Pick it up warm. Don’t share."),
  slot("cookies", COOKIES, 4, "cookies-4", "/media/doughbros-shop-02.jpg", "Dough Bros.", "", ""),

  slot("careers", CAREERS, 1, "careers-1", "/media/careers-team.jpg", "Work across DTLL Group", "DTLL Group careers", "Apply across Dough Bros, Paradise Pizzas and Nalou Kitchen. Attach a resume and cover letter."),
  slot("careers", CAREERS, 2, "careers-2", "/media/careers-line.jpg"),
];

export const SLOT_BY_KEY = new Map(SLOT_CATALOG.map((s) => [s.slot_key, s]));

export const PAGE_ORDER: PageKey[] = ["home", "pizza", "pasta", "coffee", "cookies", "careers"];
