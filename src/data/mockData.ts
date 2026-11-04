import { Person, Memory, Album, RoutineItem, Song, DiaryEntry, ActivityCard } from '../types';
import { createSvgPhoto, createSvgAvatar } from '../assets/placeholders';

export const INITIAL_PEOPLE: Person[] = [
  {
    id: 'p-rajiv',
    name: 'Rajiv',
    relationship: 'Self',
    bio: 'Born in 1957. Passionate reader, nature lover, and civil engineer who built cherished bridges and gardens.',
    birthYear: 1957,
    avatarUrl: createSvgAvatar('RK', '#FDEEE4', 'Rajiv'),
    isMainPatient: true,
    confirmedByFamily: true,
    sharedMemoryCount: 14
  },
  {
    id: 'p-anita',
    name: 'Anita',
    relationship: 'Wife',
    bio: 'Married to Rajiv since 1985. Loves morning jasmine tea, gardening, and singing folk songs.',
    birthYear: 1960,
    avatarUrl: createSvgAvatar('AK', '#FADBD8', 'Wife'),
    confirmedByFamily: true,
    sharedMemoryCount: 10
  },
  {
    id: 'p-riya',
    name: 'Riya',
    relationship: 'Daughter',
    bio: 'Rajiv and Anita’s daughter. Architect living nearby who visits every Sunday with homemade sweets.',
    birthYear: 1990,
    avatarUrl: createSvgAvatar('RC', '#D5F5E3', 'Daughter'),
    confirmedByFamily: true,
    sharedMemoryCount: 8
  },
  {
    id: 'p-suresh',
    name: 'Suresh',
    relationship: 'Lifelong Friend',
    bio: 'College friend from St. Stephens batch of 1978. Shared many bicycle adventures and cricket matches.',
    birthYear: 1957,
    avatarUrl: createSvgAvatar('SB', '#E8F8F5', 'Friend'),
    confirmedByFamily: true,
    sharedMemoryCount: 5
  },
  {
    id: 'p-daniel',
    name: 'Daniel',
    relationship: 'Grandson',
    bio: 'Riya’s 6-year-old son. Loved running through tulip fields with Rajiv and listening to his bedtime train stories.',
    birthYear: 2018,
    avatarUrl: createSvgAvatar('DK', '#FEF8E7', 'Grandson'),
    confirmedByFamily: true,
    sharedMemoryCount: 4
  }
];

export const INITIAL_ALBUMS: Album[] = [
  {
    id: 'album-childhood',
    title: 'Childhood & Growing Up',
    coverUrl: createSvgPhoto('childhood', 'Childhood Memories', '1960-1972'),
    colorTheme: 'amber',
    yearRange: '1960 – 1972',
    description: 'Bicycle rides, mango orchards, and school days in Shimla hills.',
    memoryCount: 3
  },
  {
    id: 'album-college',
    title: 'College & Friendships',
    coverUrl: createSvgPhoto('college', 'College Days', '1974-1978'),
    colorTheme: 'blue',
    yearRange: '1974 – 1978',
    description: 'St. Stephens college campus, debates, tea stalls, and friends.',
    memoryCount: 2
  },
  {
    id: 'album-wedding',
    title: 'My Wedding',
    coverUrl: createSvgPhoto('wedding', 'Our Wedding Day', '1985'),
    colorTheme: 'coral',
    yearRange: '1985',
    description: 'The golden day Rajiv married Anita surrounded by marigolds and laughter.',
    memoryCount: 2
  },
  {
    id: 'album-trips',
    title: 'Family Trips & Journeys',
    coverUrl: createSvgPhoto('goa', 'Goa & Travel', '1995-2017'),
    colorTheme: 'gold',
    yearRange: '1995 – 2017',
    description: 'Sunsets in Calangute, Goa beach picnics, and train trips with Anita and Riya.',
    memoryCount: 3
  },
  {
    id: 'album-festivals',
    title: 'Festivals & Celebrations',
    coverUrl: createSvgPhoto('diwali', 'Diwali Lights', '1986-2021'),
    colorTheme: 'sage',
    yearRange: '1986 – 2021',
    description: 'Diwali clay lamps, sweet boxes, and courtyard celebrations.',
    memoryCount: 2
  },
  {
    id: 'album-grandson',
    title: 'Grandson Daniel',
    coverUrl: createSvgPhoto('daniel', 'Joy with Daniel', '2019-2024'),
    colorTheme: 'peach',
    yearRange: '2019 – 2024',
    description: 'Laughing among flower fields, reading picture books, and afternoon walks.',
    memoryCount: 2
  }
];

export const INITIAL_MEMORIES: Memory[] = [
  {
    id: 'mem-1960',
    title: 'The Red Bicycle on Hill Road',
    year: 1960,
    dateStr: 'August 14, 1960',
    location: 'Shimla Hills',
    albumId: 'album-childhood',
    peopleIds: ['p-rajiv'],
    media: [
      {
        id: 'med-1',
        url: createSvgPhoto('childhood', 'Rajiv learning to cycle on sunny slope', '1960'),
        type: 'image',
        caption: 'Rajiv learning to balance on his first red bicycle'
      }
    ],
    story: 'Rajiv received his first red bicycle on his 3rd birthday from his father. He would race down the gentle hill road with the wind in his face, feeling completely free.',
    audioDescription: 'This was your first bicycle in Shimla hills, Rajiv. You loved riding it down the garden path.',
    status: 'verified',
    source: 'family_submitted',
    approvedBy: 'Anita',
    era: 'Childhood',
    tags: ['Bicycle', 'Shimla', 'Childhood', 'Summer'],
    mapCoordinates: { x: 340, y: 120, label: 'Shimla 1960' }
  },
  {
    id: 'mem-1966',
    title: 'First Day at St. Xavier’s School',
    year: 1966,
    dateStr: 'July 5, 1966',
    location: 'Delhi',
    albumId: 'album-childhood',
    peopleIds: ['p-rajiv'],
    media: [
      {
        id: 'med-2',
        url: createSvgPhoto('school', 'School courtyard bell tower', '1966'),
        type: 'image',
        caption: 'The old brick courtyard where Rajiv played marbles'
      }
    ],
    story: 'A bright July morning when Rajiv wore his new navy blue blazer and carried a wooden pencil box. He made his first friends during the recess bell.',
    status: 'verified',
    source: 'family_submitted',
    approvedBy: 'Anita',
    era: 'First School',
    tags: ['School', 'Books', 'Uniform'],
    mapCoordinates: { x: 330, y: 180, label: 'Delhi 1966' }
  },
  {
    id: 'mem-1978',
    title: 'Graduation Day with Suresh',
    year: 1978,
    dateStr: 'May 20, 1978',
    location: 'St. Stephens College Campus',
    albumId: 'album-college',
    peopleIds: ['p-rajiv', 'p-suresh'],
    media: [
      {
        id: 'med-3',
        url: createSvgPhoto('college', 'Rajiv and Suresh holding degree rolls', '1978'),
        type: 'image',
        caption: 'Rajiv and Suresh on the college lawn after receiving degrees'
      }
    ],
    story: 'Rajiv graduated with honors in Civil Engineering alongside his closest buddy Suresh. They celebrated with samosas and cardamom tea at the university canteen.',
    audioDescription: 'Here is your college graduation with Suresh in 1978. You both looked so proud and happy.',
    status: 'verified',
    source: 'family_submitted',
    approvedBy: 'Anita',
    era: 'College',
    tags: ['College', 'Engineering', 'Suresh', 'Tea'],
    songId: 'song-college'
  },
  {
    id: 'mem-1985',
    title: 'Wedding Day with Anita',
    year: 1985,
    dateStr: 'November 22, 1985',
    location: 'Rose Garden Mandap, Delhi',
    albumId: 'album-wedding',
    peopleIds: ['p-rajiv', 'p-anita'],
    media: [
      {
        id: 'med-4',
        url: createSvgPhoto('wedding', 'Rajiv & Anita exchanging garlands', '1985'),
        type: 'image',
        caption: 'Rajiv and Anita smiling during the sacred vows'
      }
    ],
    story: 'On a cool November evening, Rajiv and Anita were married under a canopy of fresh orange marigolds and jasmine. Anita wore a deep red silk saree, and Rajiv couldn’t stop smiling all evening.',
    audioDescription: 'Your wedding day with Anita on November 22, 1985. The flowers smelled wonderful and everyone danced.',
    status: 'verified',
    source: 'family_submitted',
    approvedBy: 'Anita',
    era: 'Wedding & Family',
    tags: ['Wedding', 'Anita', 'Marigolds', 'Love'],
    songId: 'song-wedding',
    mapCoordinates: { x: 335, y: 190, label: 'Rose Garden 1985' }
  },
  {
    id: 'mem-1988',
    title: 'First Bridge Project at ABC Company',
    year: 1988,
    dateStr: 'March 10, 1988',
    location: 'Yamuna River Crossing',
    albumId: 'album-trips',
    peopleIds: ['p-rajiv'],
    media: [
      {
        id: 'med-5',
        url: createSvgPhoto('school', 'Engineering blueprints and bridge arches', '1988'),
        type: 'image',
        caption: 'The foundation stone ceremony for the Yamuna River Bridge'
      }
    ],
    story: 'Rajiv led the structural planning team at ABC Company for the new river flyover. He kept a miniature brass ruler in his pocket for good luck.',
    status: 'verified',
    source: 'family_submitted',
    approvedBy: 'Anita',
    era: 'Career',
    tags: ['Work', 'Engineering', 'Bridge', 'Yamuna']
  },
  {
    id: 'mem-1998',
    title: 'Goa Golden Beach Picnic',
    year: 1998,
    dateStr: 'April 13, 1998',
    location: 'Calangute, Goa',
    albumId: 'album-trips',
    peopleIds: ['p-rajiv', 'p-anita', 'p-riya'],
    media: [
      {
        id: 'med-6',
        url: createSvgPhoto('goa', 'Family sitting on golden sand with coconuts', '1998'),
        type: 'image',
        caption: 'Rajiv, Anita, and little Riya enjoying coconut water at sunset'
      }
    ],
    story: 'Your family visited Goa in April 1998. Anita and little Riya were with you. You built sandcastles together and Rajiv tasted fresh coconut water while watching the orange sun dip into the ocean.',
    audioDescription: 'Of course, Rajiv! Your family visited Goa in 1998. Anita and Riya were with you. Would you like to see the photographs from that trip?',
    status: 'verified',
    source: 'family_submitted',
    approvedBy: 'Anita',
    era: 'Wedding & Family',
    tags: ['Goa', 'Beach', 'Anita', 'Riya', 'Sunset', 'Picnic'],
    songId: 'song-goa',
    mapCoordinates: { x: 280, y: 280, label: 'Goa 1998' }
  },
  {
    id: 'mem-2001',
    title: 'Diwali Courtyard with Little Riya',
    year: 2001,
    dateStr: 'November 4, 2001',
    location: 'Family Courtyard, Delhi',
    albumId: 'album-festivals',
    peopleIds: ['p-rajiv', 'p-anita', 'p-riya'],
    media: [
      {
        id: 'med-7',
        url: createSvgPhoto('diwali', 'Warm clay diyas lit in row', '2001'),
        type: 'image',
        caption: 'Riya and Rajiv placing clay lamps on the verandah'
      }
    ],
    story: 'Rajiv and 11-year-old Riya arranged over 50 clay oil lamps around the verandah railing. Anita made warm almond halwa, filling the entire house with sweet cardamom aroma.',
    status: 'verified',
    source: 'family_submitted',
    approvedBy: 'Anita',
    era: 'Wedding & Family',
    tags: ['Diwali', 'Lights', 'Family', 'Halwa']
  },
  {
    id: 'mem-2019',
    title: 'Picnic in Tulip Field with Grandson Daniel',
    year: 2019,
    dateStr: 'April 21, 2019',
    location: 'Tulip Meadows Park',
    albumId: 'album-grandson',
    peopleIds: ['p-rajiv', 'p-daniel', 'p-riya'],
    media: [
      {
        id: 'med-8',
        url: createSvgPhoto('daniel', 'Daniel giggling holding a yellow flower', '2019'),
        type: 'image',
        caption: 'Daniel running through the flower meadow towards Grandpa Rajiv'
      }
    ],
    story: 'A warm sunny morning in spring. Little Daniel held Rajiv’s hand while discovering butterflies. Rajiv showed him how to whistle with a leaf.',
    audioDescription: 'Grandpa Rajiv and Daniel laughing in the tulip garden. A sunny day filled with smiles.',
    status: 'verified',
    source: 'family_submitted',
    approvedBy: 'Riya',
    era: 'Golden Years',
    tags: ['Daniel', 'Grandson', 'Flowers', 'Spring', 'Tulips'],
    mapCoordinates: { x: 350, y: 150, label: 'Tulip Park 2019' }
  },
  // DELIBERATE PENDING MEMORY FOR VERIFICATION DEMO
  {
    id: 'mem-pending-nepal',
    title: 'Trip to Kathmandu with Mountain Views',
    year: 1994,
    dateStr: 'October 12, 1994',
    location: 'Kathmandu, Nepal',
    albumId: 'album-trips',
    peopleIds: ['p-rajiv', 'p-suresh'],
    media: [
      {
        id: 'med-pending-1',
        url: createSvgPhoto('nepal', 'Himalayan sunrise overlooking stupa', '1994'),
        type: 'image',
        caption: 'Suresh took this photo of Rajiv looking at the mountain peaks'
      }
    ],
    story: 'AI Suggested draft from Suresh: Rajiv and Suresh took a bus to Kathmandu in autumn 1994, staying at a quiet guesthouse near Boudhanath Stupa.',
    status: 'pending',
    source: 'ai_drafted',
    era: 'Career',
    tags: ['Nepal', 'Mountains', 'Suresh', 'Travel']
  },
  // DELIBERATE AI SUGGESTED MEMORY
  {
    id: 'mem-ai-guitar',
    title: 'Rajiv’s First Acoustic Guitar',
    year: 1975,
    dateStr: 'September 1975',
    location: 'St. Stephens Hostel',
    albumId: 'album-college',
    peopleIds: ['p-rajiv'],
    media: [
      {
        id: 'med-pending-2',
        url: createSvgPhoto('college', 'Acoustic guitar propped on wicker chair', '1975'),
        type: 'image',
        caption: 'Old photograph found in album sleeve'
      }
    ],
    story: 'AI Draft suggestion: Rajiv learned 3 chords on a borrowed guitar during monsoon evenings.',
    status: 'ai-suggested',
    source: 'ai_drafted',
    era: 'College',
    tags: ['Music', 'Guitar', 'Hostel']
  }
];

export const INITIAL_ROUTINE: RoutineItem[] = [
  {
    id: 'rout-1',
    title: 'Morning Garden Walk & Tea',
    time: '08:30 AM',
    period: 'Morning',
    category: 'walk',
    notes: 'Gentle 15-minute stroll in the courtyard. Fresh air and jasmine tea with Anita.',
    completed: true,
    reminderStatus: 'Active'
  },
  {
    id: 'rout-2',
    title: 'Colouring & Memory Album',
    time: '10:00 AM',
    period: 'Morning',
    category: 'activity',
    notes: 'A relaxing, lighthearted activity before lunch.',
    completed: false,
    reminderStatus: 'Active'
  },
  {
    id: 'rout-3',
    title: 'Lunch with Chickpea Stew',
    time: '12:30 PM',
    period: 'Afternoon',
    category: 'meal',
    notes: 'Warm chickpea bowl in the pink container in the refrigerator.',
    completed: false,
    reminderStatus: 'Active'
  },
  {
    id: 'rout-4',
    title: 'Afternoon Caregiver Reminder',
    time: '01:30 PM',
    period: 'Afternoon',
    category: 'medication',
    notes: 'Caregiver reminder: check white pillbox.',
    completed: false,
    reminderStatus: 'Active'
  },
  {
    id: 'rout-5',
    title: 'Listen to Favorite Melodies',
    time: '04:00 PM',
    period: 'Afternoon',
    category: 'activity',
    notes: 'Enjoy 20 minutes of calming music in the sunroom.',
    completed: false,
    reminderStatus: 'Active'
  },
  {
    id: 'rout-6',
    title: 'Evening Video Call with Riya & Daniel',
    time: '06:00 PM',
    period: 'Evening',
    category: 'family_call',
    notes: 'Daniel wants to show his drawing of a green steam train.',
    completed: false,
    reminderStatus: 'Active'
  }
];

export const INITIAL_SONGS: Song[] = [
  {
    id: 'song-goa',
    title: 'Calangute Ocean Waves',
    artist: 'Gentle Acoustic Guitar Ensemble',
    era: '1998',
    coverGradient: 'from-amber-400 to-sky-300',
    duration: '3:15',
    relatedMemoryId: 'mem-1998',
    note: 'The song playing at the beachside cafe in Goa with Anita and Riya.'
  },
  {
    id: 'song-wedding',
    title: 'Here Comes the Golden Sun',
    artist: 'Acoustic Strings & Flute',
    era: '1985',
    coverGradient: 'from-orange-300 to-rose-300',
    duration: '2:48',
    relatedMemoryId: 'mem-1985',
    note: 'The gentle melody Rajiv and Anita listened to on their honeymoon.'
  },
  {
    id: 'song-college',
    title: 'St. Stephens Morning Melody',
    artist: 'Warm Piano & Cello',
    era: '1978',
    coverGradient: 'from-emerald-300 to-teal-400',
    duration: '3:40',
    relatedMemoryId: 'mem-1978',
    note: 'Reminds Rajiv of college study sessions with Suresh.'
  },
  {
    id: 'song-tea',
    title: 'Peaceful Jasmine Tea Breeze',
    artist: 'Harmonium & Soft Chimes',
    era: '1965',
    coverGradient: 'from-yellow-200 to-amber-300',
    duration: '4:10',
    relatedMemoryId: 'mem-1960',
    note: 'Calming instrumental music for a peaceful afternoon.'
  }
];

export const INITIAL_DIARY: DiaryEntry = {
  id: 'diary-today',
  dateStr: 'November 1, 2026',
  weather: 'Sunny & Pleasant · 24°C',
  greeting: 'Have a sweet dream, Rajiv',
  morningNote: 'Rajiv enjoyed a warm cup of jasmine tea with toast by the verandah window. He smiled as the morning sunlight touched his hands, noting how peaceful the sparrow birds sounded.',
  afternoonNote: 'Looked through the 1998 Goa trip photograph album. Rajiv pointed at the ocean waves and remembered the chilled fresh coconut water.',
  eveningNote: 'Finished a simple jigsaw puzzle with Daniel’s smiling photo. Ready for a calm, restful sleep surrounded by family love.',
  caregiverSign: 'Written with care by Anita & Riya'
};

export const COGNITIVE_ACTIVITIES: ActivityCard[] = [
  {
    id: 'act-jigsaw',
    title: 'Photo Jigsaw Puzzle',
    description: 'Piece together a warm family photo piece by piece at your own pace.',
    duration: '5 - 10 min',
    type: 'puzzle',
    icon: 'Puzzle',
    badge: 'Gentle & Relaxing'
  },
  {
    id: 'act-coloring',
    title: 'Warm Colouring Canvas',
    description: 'Add cheerful colors to a cozy drawing with soft brushes and crayons.',
    duration: 'Any time',
    type: 'coloring',
    icon: 'Palette',
    badge: 'Creative'
  },
  {
    id: 'act-matching',
    title: 'Family Photo Matching',
    description: 'Find matching friendly faces from your family album with helpful hints.',
    duration: '5 min',
    type: 'matching',
    icon: 'Grid',
    badge: 'Memory Fun'
  }
];
