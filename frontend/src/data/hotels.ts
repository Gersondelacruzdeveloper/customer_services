import "../types/types";
export const hotels: Hotel[] = [
  {
    id: "h1",
    name: "Barceló Bávaro Palace",
    zone: "Bávaro",
    pickupMinutesFromHub: 25,
    pickupTimes: { ex1: "06:50", ex2: "06:30", ex3: "07:10" },
  },
  {
    id: "h2",
    name: "Vista Sol Punta Cana",
    zone: "Bávaro",
    pickupMinutesFromHub: 20,
    pickupTimes: { ex1: "06:40", ex2: "06:20", ex3: "07:00" },
  },
  {
    id: "h3",
    name: "Coral Costa Caribe",
    zone: "Juan Dolio",
    pickupMinutesFromHub: 10,
    pickupTimes: { ex3: "10:15" },
  },
  {
    id: "h4",
    name: "Royalton Bavaro",
    zone: "Arena Gorda",
    pickupMinutesFromHub: 15,
    pickupTimes: { ex1: "06:45", ex2: "06:25", ex3: "07:00" },
  },
];