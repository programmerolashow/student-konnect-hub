export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  department: string;
  faculty: string;
  school: string;
  bio: string;
  online: boolean;
}

export interface VideoPost {
  id: string;
  author: User;
  title: string;
  thumbnail: string;
  videoUrl: string;
  description: string;
  acknowledgedBy: string[];
  comments: number;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isVoiceNote?: boolean;
  image?: string;
}

export interface Chat {
  id: string;
  participant: User;
  lastMessage: string;
  unread: number;
  messages: Message[];
}

export const currentUser: User = {
  id: "u1",
  name: "Amara Johnson",
  username: "amara_j",
  avatar: "",
  department: "Computer Science",
  faculty: "Engineering",
  school: "University of Lagos",
  bio: "Third year CS student. Building the future, one line of code at a time.",
  online: true,
};

export const users: User[] = [
  { id: "u2", name: "David Okafor", username: "dave_ok", avatar: "", department: "Computer Science", faculty: "Engineering", school: "University of Lagos", bio: "AI researcher & coffee addict.", online: true },
  { id: "u3", name: "Fatima Al-Hassan", username: "fatima_h", avatar: "", department: "Electrical Engineering", faculty: "Engineering", school: "University of Lagos", bio: "Circuits and poetry.", online: false },
  { id: "u4", name: "Chen Wei", username: "chen_w", avatar: "", department: "Mathematics", faculty: "Sciences", school: "University of Lagos", bio: "Numbers tell stories.", online: true },
  { id: "u5", name: "Sarah Mensah", username: "sarah_m", avatar: "", department: "English Literature", faculty: "Arts", school: "University of Ghana", bio: "Words are my canvas.", online: false },
  { id: "u6", name: "Kofi Adjei", username: "kofi_a", avatar: "", department: "Physics", faculty: "Sciences", school: "University of Cape Coast", bio: "Exploring the universe.", online: true },
  { id: "u7", name: "Priya Nair", username: "priya_n", avatar: "", department: "Computer Science", faculty: "Engineering", school: "University of Lagos", bio: "Full-stack developer in training.", online: true },
  { id: "u8", name: "James Osei", username: "james_o", avatar: "", department: "Architecture", faculty: "Environmental Design", school: "KNUST", bio: "Designing spaces that breathe.", online: false },
];

export const videoPosts: VideoPost[] = [
  { id: "v1", author: users[0], title: "Introduction to Neural Networks", thumbnail: "", videoUrl: "", description: "A beginner-friendly walkthrough of how neural networks work, with live coding examples.", acknowledgedBy: ["u1", "u3", "u4"], comments: 12, createdAt: "2026-03-10T08:30:00Z" },
  { id: "v2", author: users[2], title: "Calculus III Study Session", thumbnail: "", videoUrl: "", description: "Going through practice problems for the upcoming midterm. Join the study group!", acknowledgedBy: ["u1", "u2"], comments: 8, createdAt: "2026-03-09T15:00:00Z" },
  { id: "v3", author: users[4], title: "Campus Tour - University of Cape Coast", thumbnail: "", videoUrl: "", description: "Showing you guys around UCC! The ocean view from the library is incredible.", acknowledgedBy: ["u5"], comments: 24, createdAt: "2026-03-09T10:00:00Z" },
  { id: "v4", author: users[5], title: "Building a REST API in 20 Minutes", thumbnail: "", videoUrl: "", description: "Speed-coding a full REST API with Node.js and Express. Can I do it?", acknowledgedBy: ["u1", "u2", "u3", "u4", "u6"], comments: 31, createdAt: "2026-03-08T18:00:00Z" },
  { id: "v5", author: users[6], title: "Sustainable Architecture in West Africa", thumbnail: "", videoUrl: "", description: "My thesis presentation on sustainable building materials in tropical climates.", acknowledgedBy: ["u3"], comments: 7, createdAt: "2026-03-08T09:00:00Z" },
  { id: "v6", author: users[1], title: "Lab Report Writing Tips", thumbnail: "", videoUrl: "", description: "How to write lab reports that actually get good grades. Tips from a TA.", acknowledgedBy: ["u1", "u4"], comments: 15, createdAt: "2026-03-07T14:00:00Z" },
];

export const chats: Chat[] = [
  {
    id: "c1", participant: users[0], lastMessage: "Did you submit the assignment?", unread: 2,
    messages: [
      { id: "m1", senderId: "u2", text: "Hey, are you coming to the study group tonight?", timestamp: "2026-03-10T07:00:00Z" },
      { id: "m2", senderId: "u1", text: "Yeah! I'll be there by 7pm.", timestamp: "2026-03-10T07:05:00Z" },
      { id: "m3", senderId: "u2", text: "Did you submit the assignment?", timestamp: "2026-03-10T07:10:00Z" },
    ],
  },
  {
    id: "c2", participant: users[1], lastMessage: "The circuit diagram is ready", unread: 0,
    messages: [
      { id: "m4", senderId: "u3", text: "I finished the circuit diagram for the project.", timestamp: "2026-03-09T20:00:00Z" },
      { id: "m5", senderId: "u1", text: "Amazing! Can you share it?", timestamp: "2026-03-09T20:15:00Z" },
      { id: "m6", senderId: "u3", text: "The circuit diagram is ready", timestamp: "2026-03-09T20:30:00Z" },
    ],
  },
  {
    id: "c3", participant: users[3], lastMessage: "See you at the poetry slam!", unread: 1,
    messages: [
      { id: "m7", senderId: "u5", text: "Have you read the new Chimamanda article?", timestamp: "2026-03-09T12:00:00Z" },
      { id: "m8", senderId: "u1", text: "Not yet, sending the link?", timestamp: "2026-03-09T12:10:00Z" },
      { id: "m9", senderId: "u5", text: "See you at the poetry slam!", timestamp: "2026-03-09T12:30:00Z" },
    ],
  },
  {
    id: "c4", participant: users[5], lastMessage: "Let's pair program tomorrow", unread: 0,
    messages: [
      { id: "m10", senderId: "u7", text: "I'm stuck on the database migration.", timestamp: "2026-03-08T16:00:00Z" },
      { id: "m11", senderId: "u1", text: "What error are you getting?", timestamp: "2026-03-08T16:05:00Z" },
      { id: "m12", senderId: "u7", text: "Let's pair program tomorrow", timestamp: "2026-03-08T16:20:00Z" },
    ],
  },
];

export const departmentGroups = [
  { id: "g1", name: "CS Department", memberCount: 142, faculty: "Engineering" },
  { id: "g2", name: "EE Department", memberCount: 98, faculty: "Engineering" },
  { id: "g3", name: "Math Department", memberCount: 76, faculty: "Sciences" },
];

export const announcements = [
  { id: "a1", title: "Mid-semester exams start March 20", source: "Academic Office", date: "2026-03-10" },
  { id: "a2", title: "Hackathon registration open", source: "CS Department", date: "2026-03-09" },
  { id: "a3", title: "Library hours extended during exams", source: "University Library", date: "2026-03-08" },
];
