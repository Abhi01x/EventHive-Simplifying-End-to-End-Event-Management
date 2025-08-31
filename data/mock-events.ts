export type EventItem = {
  id: string
  title: string
  subtitle?: string
  category: string
  tags: string[]
  status: "registration_open" | "not_open"
  shortDescription: string
  description: string
  dateLabel: string
  dateLong: string
  startsIn: string
  image?: string
  location: { venue: string; city: string; region: string }
  organizer: { name: string; phone?: string; email?: string }
  tickets: { id: string; tier: string; price: number; currency: string; saleEnd: string }[]
}

export const events: EventItem[] = [
  {
    id: "live-music-fest",
    title: "Live Music Festival",
    subtitle: "Experience live music, local food and beverages.",
    category: "Music",
    tags: ["Outdoor", "Family"],
    status: "registration_open",
    shortDescription: "Three-day celebration with bands from classic to modern.",
    description:
      "Here it is, the 12th edition of our Live Musical Festival! Once again we assembled the most legendary bands in Rock history. This is the perfect place for spending a nice time with your friends while listening to some of the most iconic rock songs of all times!",
    dateLabel: "Aug 14",
    dateLong: "Aug 14, 1:30 PM – 5:30 PM",
    startsIn: "2h 30m",
    image: "/live-music-festival.png",
    location: { venue: "Silver Auditorium", city: "Ahmedabad", region: "Gujarat" },
    organizer: { name: "Marc Demo", phone: "+1 555-555-5556", email: "info@yourcompany.com" },
    tickets: [
      { id: "standard", tier: "Standard", price: 0, currency: "INR", saleEnd: "09/08/2025 7:00 AM" },
      { id: "vip", tier: "VIP", price: 500, currency: "INR", saleEnd: "01/09/2025 11:30 PM" },
    ],
  },
  {
    id: "jewelry-exhibition",
    title: "Jewelry Exhibition",
    subtitle: "Showcase from timeless classics to modern treasures.",
    category: "Exhibition",
    tags: ["Indoor"],
    status: "registration_open",
    shortDescription: "An exclusive jewelry showcase of luxury craftsmanship.",
    description: "Join us for an exclusive jewelry showcase where luxury craftsmanship and innovation come together.",
    dateLabel: "Aug 11–12",
    dateLong: "Aug 11, 10:00 AM – Aug 12, 6:00 PM",
    startsIn: "3d",
    image: "/jewelry-exhibition.png",
    location: { venue: "City Expo Hall", city: "Ahmedabad", region: "Gujarat" },
    organizer: { name: "City Events" },
    tickets: [
      { id: "day-pass", tier: "Day Pass", price: 199, currency: "INR", saleEnd: "08/10/2025 11:59 PM" },
      { id: "full", tier: "Full Access", price: 399, currency: "INR", saleEnd: "08/12/2025 11:59 PM" },
    ],
  },
  {
    id: "tennis-tournament",
    title: "Tennis Tournament",
    subtitle: "Local players compete for the title.",
    category: "Sports",
    tags: ["Indoor/Outdoor"],
    status: "not_open",
    shortDescription: "Community tennis tournament.",
    description: "Don’t miss this tournament at our local tennis community. Registration opens soon.",
    dateLabel: "Jun 25",
    dateLong: "Jun 25, 8:00 AM – 5:00 PM",
    startsIn: "—",
    image: "/vibrant-tennis-tournament.png",
    location: { venue: "Greenwood Sports Complex", city: "Ahmedabad", region: "Gujarat" },
    organizer: { name: "Greenwood Sports" },
    tickets: [{ id: "standard-tt", tier: "Standard", price: 250, currency: "INR", saleEnd: "06/20/2025 11:59 PM" }],
  },
]
