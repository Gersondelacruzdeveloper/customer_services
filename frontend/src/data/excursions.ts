import "../types/types";
export const excursions: Excursion[] = [
  {
    id: "ex1",
    name: "Saona Island",
    defaultStartTime: "08:00",
    meetingPoint: "Cabeza de Toro Gas Station",
    providerOptions: [
      { providerId: "p1", defaultPrice: 42 },
      { providerId: "p2", defaultPrice: 0 },
    ],
    active: true,
  },
  {
    id: "ex2",
    name: "Catalina Island",
    defaultStartTime: "07:30",
    meetingPoint: "Cabeza de Toro Gas Station",
    providerOptions: [{ providerId: "p2", defaultPrice: 38 }],
    active: true,
  },
  {
    id: "ex3",
    name: "Santo Domingo City Tour",
    defaultStartTime: "07:00",
    meetingPoint: "Downtown Departure Point",
    providerOptions: [{ providerId: "p3", defaultPrice: 35 }],
    active: true,
  },
];