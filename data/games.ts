export type GamePackage = {
  name: string;
  price: string;
};

export type GameItem = {
  name: string;
  slug: string;
  desc: string;
  image: string;
  packages: GamePackage[];
};

export const games: GameItem[] = [
  {
    name: "Free Fire",
    slug: "free-fire",
    desc: "Fast diamond topup for Free Fire players.",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80",
    packages: [
      { name: "100 Diamonds", price: "Rs. 110" },
      { name: "310 Diamonds", price: "Rs. 320" },
      { name: "520 Diamonds", price: "Rs. 540" },
      { name: "1060 Diamonds", price: "Rs. 1080" },
    ],
  },
  {
    name: "PUBG Mobile",
    slug: "pubg-mobile",
    desc: "Buy UC quickly and securely.",
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80",
    packages: [
      { name: "60 UC", price: "Rs. 120" },
      { name: "325 UC", price: "Rs. 600" },
      { name: "660 UC", price: "Rs. 1150" },
      { name: "1800 UC", price: "Rs. 2950" },
    ],
  },
  {
    name: "Mobile Legends",
    slug: "mobile-legends",
    desc: "Recharge diamonds instantly.",
    image:
      "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200&q=80",
    packages: [
      { name: "86 Diamonds", price: "Rs. 180" },
      { name: "172 Diamonds", price: "Rs. 350" },
      { name: "257 Diamonds", price: "Rs. 520" },
      { name: "706 Diamonds", price: "Rs. 1350" },
    ],
  },
  {
    name: "Valorant",
    slug: "valorant",
    desc: "Topup Valorant Points with easy checkout.",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80",
    packages: [
      { name: "475 VP", price: "Rs. 550" },
      { name: "1000 VP", price: "Rs. 1050" },
      { name: "2050 VP", price: "Rs. 2100" },
      { name: "3650 VP", price: "Rs. 3650" },
    ],
  },
];