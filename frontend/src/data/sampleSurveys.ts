export type SurveyRecord = {
  id: string;
  excursion: string;
  hotel: string;
  date: string;
  participants: number;
  clientName: string;
  roomNo: string;
  tourOperator: string;
  guideName: string;
  punctuality: number;
  transport: number;
  guide: number;
  food: number;
  comments: string;
  createdAt: string;
};

export const sampleSurveys: SurveyRecord[] = [
  {
    id: "1",
    excursion: "Saona Island",
    hotel: "Riu Bambu",
    date: "2026-03-15",
    participants: 2,
    clientName: "John Smith",
    roomNo: "1204",
    tourOperator: "Eco Adventures",
    guideName: "Carlos",
    punctuality: 4,
    transport: 4,
    guide: 4,
    food: 3,
    comments: "Very good experience and friendly guide.",
    createdAt: "2026-03-15T10:00:00.000Z",
  },
  {
    id: "2",
    excursion: "Saona Island",
    hotel: "Riu Bambu",
    date: "2026-03-16",
    participants: 4,
    clientName: "Maria Lopez",
    roomNo: "2210",
    tourOperator: "Eco Adventures",
    guideName: "Carlos",
    punctuality: 3,
    transport: 4,
    guide: 4,
    food: 3,
    comments: "Guide was excellent.",
    createdAt: "2026-03-16T10:00:00.000Z",
  },
  {
    id: "3",
    excursion: "Samana",
    hotel: "Hard Rock",
    date: "2026-03-16",
    participants: 2,
    clientName: "Anna Brown",
    roomNo: "803",
    tourOperator: "Eco Adventures",
    guideName: "Luis",
    punctuality: 2,
    transport: 3,
    guide: 4,
    food: 2,
    comments: "Trip was nice but transport was late.",
    createdAt: "2026-03-16T11:00:00.000Z",
  },
  {
    id: "4",
    excursion: "Buggies",
    hotel: "Majestic",
    date: "2026-03-17",
    participants: 3,
    clientName: "Kevin White",
    roomNo: "340",
    tourOperator: "Eco Adventures",
    guideName: "Luis",
    punctuality: 3,
    transport: 3,
    guide: 3,
    food: 0,
    comments: "Great excursion.",
    createdAt: "2026-03-17T09:00:00.000Z",
  },
  {
    id: "5",
    excursion: "Samana",
    hotel: "Hard Rock",
    date: "2026-03-18",
    participants: 5,
    clientName: "Sophie Green",
    roomNo: "910",
    tourOperator: "Eco Adventures",
    guideName: "Maria",
    punctuality: 4,
    transport: 4,
    guide: 4,
    food: 4,
    comments: "Everything was excellent.",
    createdAt: "2026-03-18T08:30:00.000Z",
  },
];