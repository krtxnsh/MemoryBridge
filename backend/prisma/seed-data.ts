/**
 * Rich, connected mock life-story dataset for ONE fictional patient.
 *
 * Patient: Gopalakrishna "Gopal" Rao, born 1948 in Thirthahalli, a small town in
 * the Malnad region of Karnataka. A believable, warm life from childhood to the
 * grandparent years. Memories are deliberately connected through shared people,
 * places, objects and recurring rituals (filter coffee, a travelling jasmine
 * plant, badminton passed down the generations, a "Jo Jo" lullaby sung to three
 * generations, a father's fountain pen). Timeline is internally consistent.
 *
 * Nothing distressing (no deaths, illness or conflict). Two negative records are
 * included that must NEVER reach a patient: one PENDING and one REJECTED memory.
 *
 * The seed script resolves the string keys below into database ids so that
 * MemoryLink rows can reference memories by key.
 */

export type MemStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'AI_SUGGESTED';
export type MemSource = 'FAMILY_SUBMITTED' | 'CAREGIVER' | 'AI_DRAFTED';

export interface SeedPerson {
  key: string;
  fullName: string;
  birthYear?: number;
  biography: string;
}

export interface SeedRelationship {
  personOne: string; // key; convention: personTwo is personOne's {relationshipType}
  personTwo: string;
  relationshipType: string;
  description: string;
}

export interface SeedAlbum {
  key: string;
  title: string;
  colorTheme: string;
  yearRange: string;
  description: string;
}

export interface SeedMemory {
  key: string;
  title: string;
  description: string;
  story: string;
  audioDescription?: string;
  approximateYear: number;
  eventDate: string; // ISO date
  location: string;
  era: string;
  eventType: string;
  albumKey: string;
  tags: string[];
  peopleKeys: string[];
  status: MemStatus;
  source: MemSource;
}

export interface SeedLink {
  from: string; // memory key
  to: string; // memory key
  linkType: 'theme' | 'person' | 'place' | 'object' | 'ritual';
  connectionNote: string;
}

export const PATIENT = {
  fullName: 'Gopalakrishna Rao',
  dateOfBirth: '1948-06-12',
  preferredLanguage: 'en',
  biography:
    'Born in 1948 in Thirthahalli, a small town in the Malnad hills of Karnataka. A gentle civil engineer who loved filter coffee, jasmine, badminton and his garden. Raised a family in Bangalore and now delights in his grandchildren.'
};

export const PEOPLE: SeedPerson[] = [
  { key: 'gopal', fullName: 'Gopal', birthYear: 1948, biography: 'The patient. A warm, gentle civil engineer from the Malnad hills who loved coffee, jasmine and badminton.' },
  { key: 'narayana', fullName: 'Narayana Rao', birthYear: 1920, biography: "Gopal's father. A kind village schoolteacher who gifted him his first fountain pen." },
  { key: 'saraswati', fullName: 'Saraswati', birthYear: 1926, biography: "Gopal's mother. Famous for her morning filter coffee, her courtyard jasmine and the 'Jo Jo' lullaby." },
  { key: 'shanta', fullName: 'Shanta', birthYear: 1952, biography: "Gopal's younger sister. They floated paper boats together in the monsoon." },
  { key: 'keshava', fullName: 'Keshava', birthYear: 1948, biography: "Gopal's lifelong friend from Thirthahalli; badminton doubles partner and mango-tree companion." },
  { key: 'subbarao', fullName: 'Master Subbarao', birthYear: 1915, biography: "Gopal's schoolteacher who taught him mathematics and badminton on the school ground." },
  { key: 'lakshmi', fullName: 'Lakshmi', birthYear: 1951, biography: 'Married to Gopal since 1972. Shares the morning coffee ritual and tends the jasmine garden.' },
  { key: 'anil', fullName: 'Anil', birthYear: 1974, biography: "Gopal and Lakshmi's son. Learned badminton from his father." },
  { key: 'meera', fullName: 'Meera', birthYear: 1977, biography: "Gopal and Lakshmi's daughter. Became a teacher and received Gopal's father's fountain pen." },
  { key: 'deepa', fullName: 'Deepa', birthYear: 1979, biography: "Anil's wife, married into the family in 2003. Loves the garden festivals." },
  { key: 'arjun', fullName: 'Arjun', birthYear: 2005, biography: "Anil and Deepa's son. Gopal taught him to froth the coffee decoction and cheered his badminton medal." },
  { key: 'nithya', fullName: 'Nithya', birthYear: 2009, biography: "Meera's daughter. Gopal sang her the same 'Jo Jo' lullaby his mother sang to him." },
  { key: 'bhima', fullName: 'Bhima', birthYear: 1954, biography: "Gopal's cheerful childhood brown dog who followed him to the Tunga river." }
];

export const RELATIONSHIPS: SeedRelationship[] = [
  { personOne: 'gopal', personTwo: 'narayana', relationshipType: 'Father', description: "Gopal's father, the schoolteacher who gave him his green fountain pen." },
  { personOne: 'gopal', personTwo: 'saraswati', relationshipType: 'Mother', description: "Gopal's mother; the coffee, the jasmine and the lullaby all began with her." },
  { personOne: 'gopal', personTwo: 'shanta', relationshipType: 'Sister', description: 'Younger sister and monsoon paper-boat companion.' },
  { personOne: 'gopal', personTwo: 'keshava', relationshipType: 'Friend', description: 'Lifelong friend and badminton doubles partner.' },
  { personOne: 'gopal', personTwo: 'subbarao', relationshipType: 'Teacher', description: 'Schoolteacher who taught mathematics and badminton.' },
  { personOne: 'gopal', personTwo: 'lakshmi', relationshipType: 'Spouse', description: 'Wife since 1972; shares the morning coffee and the jasmine garden.' },
  { personOne: 'gopal', personTwo: 'anil', relationshipType: 'Son', description: 'Son who learned badminton from his father.' },
  { personOne: 'gopal', personTwo: 'meera', relationshipType: 'Daughter', description: "Daughter and teacher who received Gopal's father's pen." },
  { personOne: 'gopal', personTwo: 'deepa', relationshipType: 'Daughter-in-law', description: "Anil's wife." },
  { personOne: 'gopal', personTwo: 'arjun', relationshipType: 'Grandson', description: "Anil and Deepa's son; the coffee and badminton passed to him." },
  { personOne: 'gopal', personTwo: 'nithya', relationshipType: 'Granddaughter', description: "Meera's daughter; the lullaby passed to her." },
  { personOne: 'gopal', personTwo: 'bhima', relationshipType: 'Pet dog', description: 'Cheerful childhood dog.' },
  { personOne: 'anil', personTwo: 'deepa', relationshipType: 'Spouse', description: 'Married in 2003.' },
  { personOne: 'anil', personTwo: 'arjun', relationshipType: 'Son', description: "Anil and Deepa's son." },
  { personOne: 'meera', personTwo: 'nithya', relationshipType: 'Daughter', description: "Meera's daughter." }
];

export const ALBUMS: SeedAlbum[] = [
  { key: 'childhood', title: 'Malnad Childhood', colorTheme: 'amber', yearRange: '1950 – 1963', description: 'Red-oxide floors, monsoon paper boats, areca gardens, coffee and a brown dog in Thirthahalli.' },
  { key: 'school', title: 'School & Playing Fields', colorTheme: 'sage', yearRange: '1959 – 1963', description: "Master Subbarao's badminton lessons, a green fountain pen and a mango-tree friendship." },
  { key: 'college', title: 'Mysore College & First Job', colorTheme: 'blue', yearRange: '1966 – 1970', description: "Maharaja's College, a travelling jasmine cutting, badminton doubles and the first pay register." },
  { key: 'family', title: 'Marriage & Young Family', colorTheme: 'coral', yearRange: '1972 – 1984', description: 'A Thirthahalli wedding, morning coffee with Lakshmi, first steps, lullabies and the move to Bangalore.' },
  { key: 'bangalore', title: 'Bangalore Working Years', colorTheme: 'gold', yearRange: '1986 – 2008', description: 'A water-tank project, Deepavali lamps, a son and daughter growing up, and a retirement garden bench.' },
  { key: 'grandparent', title: 'Grandparent Years', colorTheme: 'peach', yearRange: '2012 – 2018', description: 'Coffee, jasmine, lullabies and badminton, all passed gently to Arjun and Nithya.' }
];

const V: MemSource = 'FAMILY_SUBMITTED';

export const MEMORIES: SeedMemory[] = [
  // ---------- Childhood (Thirthahalli) ----------
  {
    key: 'm_house', title: 'The House with the Red-Oxide Floor', approximateYear: 1950, eventDate: '1950-06-12',
    location: 'Thirthahalli, Karnataka', era: 'Childhood', eventType: 'home', albumKey: 'childhood',
    tags: ['home', 'Thirthahalli', 'Malnad', 'childhood'], peopleKeys: ['gopal', 'narayana', 'saraswati'],
    status: 'VERIFIED', source: V,
    description: 'The family home where Gopal grew up.',
    story: 'You grew up in a small house with cool red-oxide floors and a tiled roof that sang in the rain. Your father Narayana read by the window while your mother Saraswati kept the kitchen warm. It was a gentle, happy beginning.',
    audioDescription: 'This is the Thirthahalli home where you grew up, with the red floor you loved to walk on barefoot.'
  },
  {
    key: 'm_lullaby_mother', title: "Amma's Jo Jo Lullaby", approximateYear: 1953, eventDate: '1953-01-20',
    location: 'Thirthahalli, Karnataka', era: 'Childhood', eventType: 'ritual', albumKey: 'childhood',
    tags: ['lullaby', 'Jo Jo', 'mother', 'night', 'song'], peopleKeys: ['gopal', 'saraswati'],
    status: 'VERIFIED', source: V,
    description: "Mother Saraswati's gentle night-time lullaby.",
    story: 'Every night your mother Saraswati sang you a soft "Jo Jo" lullaby until your eyes grew heavy. Her voice was low and warm, like the last light of evening. You never forgot that tune.',
    audioDescription: 'Your mother sang you the Jo Jo lullaby every night. It was the calmest sound in the world.'
  },
  {
    key: 'm_coffee_mother', title: "Amma's Morning Filter Coffee", approximateYear: 1954, eventDate: '1954-02-10',
    location: 'Thirthahalli, Karnataka', era: 'Childhood', eventType: 'ritual', albumKey: 'childhood',
    tags: ['coffee', 'filter coffee', 'mother', 'morning', 'ritual'], peopleKeys: ['gopal', 'saraswati'],
    status: 'VERIFIED', source: V,
    description: "The morning filter-coffee ritual, begun by Gopal's mother.",
    story: 'Each morning your mother Saraswati made filter coffee in a shining steel filter, and the whole house woke to its aroma. She let you watch the dark decoction drip, drop by drop. That smell always meant home.',
    audioDescription: 'Your mother made filter coffee every morning. You loved watching the decoction drip slowly.'
  },
  {
    key: 'm_jasmine_courtyard', title: 'The Jasmine in the Courtyard', approximateYear: 1955, eventDate: '1955-04-05',
    location: 'Thirthahalli, Karnataka', era: 'Childhood', eventType: 'home', albumKey: 'childhood',
    tags: ['jasmine', 'mallige', 'courtyard', 'flowers', 'mother'], peopleKeys: ['gopal', 'saraswati'],
    status: 'VERIFIED', source: V,
    description: "The mallige jasmine creeper in the family courtyard.",
    story: 'A mallige jasmine creeper grew along your mother’s courtyard wall, and on festival mornings she strung the flowers into garlands. You helped her pick the buds before the sun warmed them. The scent filled the whole courtyard.',
    audioDescription: 'Your mother grew jasmine in the courtyard. You helped her pick the flowers in the morning.'
  },
  {
    key: 'm_malnad_rain', title: 'First Monsoon Paper Boats', approximateYear: 1956, eventDate: '1956-07-18',
    location: 'Thirthahalli, Karnataka', era: 'Childhood', eventType: 'play', albumKey: 'childhood',
    tags: ['monsoon', 'rain', 'paper boats', 'areca', 'Shanta'], peopleKeys: ['gopal', 'shanta'],
    status: 'VERIFIED', source: V,
    description: 'Monsoon games with little sister Shanta.',
    story: 'When the Malnad monsoon poured down, you and your little sister Shanta folded paper boats and raced them in the water channels of the areca garden. You cheered when yours sailed the farthest. You both came home soaked and laughing.',
    audioDescription: 'You and Shanta floated paper boats in the monsoon rain. Yours always sailed the farthest.'
  },
  {
    key: 'm_dog_bhima', title: 'Bhima the Brown Dog', approximateYear: 1957, eventDate: '1957-09-09',
    location: 'Thirthahalli, Karnataka', era: 'Childhood', eventType: 'pet', albumKey: 'childhood',
    tags: ['dog', 'Bhima', 'pet', 'river'], peopleKeys: ['gopal', 'bhima', 'shanta'],
    status: 'VERIFIED', source: V,
    description: 'The cheerful childhood dog Bhima.',
    story: 'Your brown dog Bhima followed you everywhere, his tail wagging like a flag. He waited by the gate each evening and walked you home from the river. He was the happiest member of the family.',
    audioDescription: 'Bhima was your cheerful brown dog. He followed you everywhere, wagging his tail.'
  },
  {
    key: 'm_river_tunga', title: 'Swimming in the Tunga River', approximateYear: 1958, eventDate: '1958-05-02',
    location: 'Tunga River, Thirthahalli', era: 'Childhood', eventType: 'play', albumKey: 'childhood',
    tags: ['river', 'Tunga', 'swimming', 'Keshava', 'summer'], peopleKeys: ['gopal', 'keshava', 'shanta'],
    status: 'VERIFIED', source: V,
    description: 'Summer swims in the Tunga with friend Keshava.',
    story: 'On warm afternoons you and your friend Keshava swam in the cool Tunga river while Shanta watched from the bank. You skipped flat stones across the water and dried off in the sun. The river was your favourite place.',
    audioDescription: 'You swam in the Tunga river with your friend Keshava on warm afternoons.'
  },

  // ---------- School & Playing Fields ----------
  {
    key: 'm_pen_father', title: "Father's Green Fountain Pen", approximateYear: 1959, eventDate: '1959-06-15',
    location: 'Thirthahalli School', era: 'School', eventType: 'gift', albumKey: 'school',
    tags: ['pen', 'fountain pen', 'father', 'school', 'gift'], peopleKeys: ['gopal', 'narayana'],
    status: 'VERIFIED', source: V,
    description: "A green fountain pen gifted by father Narayana.",
    story: 'When you did well in your lessons, your father Narayana gave you his own green fountain pen. He showed you how to fill it and wipe the nib clean. You carried that pen for many years.',
    audioDescription: 'Your father gave you his green fountain pen when you did well at school.'
  },
  {
    key: 'm_badminton_subbarao', title: "Master Subbarao's Badminton Lessons", approximateYear: 1960, eventDate: '1960-08-20',
    location: 'Thirthahalli School Ground', era: 'School', eventType: 'sport', albumKey: 'school',
    tags: ['badminton', 'shuttle', 'Subbarao', 'school', 'sport'], peopleKeys: ['gopal', 'subbarao'],
    status: 'VERIFIED', source: V,
    description: 'Learning badminton from the schoolteacher Master Subbarao.',
    story: 'Master Subbarao taught you badminton on the school ground after class, drawing the court lines with chalk powder. He showed you how to flick your wrist for a clean serve. You practised until the evening bell.',
    audioDescription: 'Master Subbarao taught you to play badminton after school. You practised your serve every evening.'
  },
  {
    key: 'm_keshava_mango', title: 'The Mango Pact with Keshava', approximateYear: 1961, eventDate: '1961-05-12',
    location: 'Thirthahalli', era: 'School', eventType: 'friendship', albumKey: 'school',
    tags: ['mango', 'Keshava', 'friends', 'summer'], peopleKeys: ['gopal', 'keshava'],
    status: 'VERIFIED', source: V,
    description: 'A summer of mangoes with best friend Keshava.',
    story: 'You and Keshava climbed the big mango tree behind the temple and promised to stay friends for life. You shared every ripe mango exactly in half. It was a promise you both kept.',
    audioDescription: 'You and Keshava climbed the mango tree and promised to be friends for life.'
  },
  {
    key: 'm_math_prize', title: 'The District Mathematics Prize', approximateYear: 1962, eventDate: '1962-12-01',
    location: 'Shivamogga', era: 'School', eventType: 'achievement', albumKey: 'school',
    tags: ['mathematics', 'prize', 'school', 'father', 'Subbarao'], peopleKeys: ['gopal', 'narayana', 'subbarao'],
    status: 'VERIFIED', source: V,
    description: 'Winning a district mathematics prize.',
    story: 'You won the district mathematics prize, and Master Subbarao clapped the loudest. Your father Narayana pinned the certificate on the wall by the window. You felt very proud that day.',
    audioDescription: 'You won the district mathematics prize. Your father pinned the certificate on the wall.'
  },
  {
    key: 'm_shanta_rakhi', title: "Shanta's Rakhi Morning", approximateYear: 1963, eventDate: '1963-08-15',
    location: 'Thirthahalli, Karnataka', era: 'School', eventType: 'festival', albumKey: 'school',
    tags: ['rakhi', 'Shanta', 'sister', 'festival'], peopleKeys: ['gopal', 'shanta'],
    status: 'VERIFIED', source: V,
    description: 'A warm Raksha Bandhan morning with sister Shanta.',
    story: 'Each year your sister Shanta tied a bright thread around your wrist and you promised to look after her. She gave you an extra ladoo every time. You always kept the thread until it faded.',
    audioDescription: 'Your sister Shanta tied a rakhi on your wrist every year, and you promised to look after her.'
  },

  // ---------- Mysore College & First Job ----------
  {
    key: 'm_mysore_college', title: "Maharaja's College, Mysore", approximateYear: 1966, eventDate: '1966-06-10',
    location: "Maharaja's College, Mysore", era: 'College', eventType: 'education', albumKey: 'college',
    tags: ['college', 'Mysore', 'train', 'study'], peopleKeys: ['gopal'],
    status: 'VERIFIED', source: V,
    description: 'Leaving home for college in Mysore.',
    story: 'You took your first long train journey to study at Maharaja’s College in Mysore. The city lights amazed you after the quiet of Thirthahalli. You studied hard and wrote home every week.',
    audioDescription: 'You went to Maharaja’s College in Mysore on your first long train journey.'
  },
  {
    key: 'm_jasmine_mysore', title: 'A Jasmine Cutting to Mysore', approximateYear: 1967, eventDate: '1967-07-22',
    location: 'Mysore Hostel', era: 'College', eventType: 'home', albumKey: 'college',
    tags: ['jasmine', 'mallige', 'Mysore', 'hostel', 'mother'], peopleKeys: ['gopal'],
    status: 'VERIFIED', source: V,
    description: "A cutting of mother's jasmine, carried to the Mysore hostel.",
    story: 'You carried a small cutting of your mother’s courtyard jasmine and planted it in a tin by your hostel window. When it flowered, your room smelled of home. It reminded you of Thirthahalli every morning.',
    audioDescription: 'You planted a cutting of your mother’s jasmine by your hostel window in Mysore.'
  },
  {
    key: 'm_badminton_college', title: 'College Badminton Doubles with Keshava', approximateYear: 1968, eventDate: '1968-09-14',
    location: 'Mysore', era: 'College', eventType: 'sport', albumKey: 'college',
    tags: ['badminton', 'doubles', 'Keshava', 'college', 'trophy'], peopleKeys: ['gopal', 'keshava'],
    status: 'VERIFIED', source: V,
    description: 'Winning the inter-college badminton doubles with Keshava.',
    story: 'You and your old friend Keshava, now both in Mysore, won the inter-college badminton doubles. All those school-ground lessons from Master Subbarao had paid off. You lifted the little brass trophy together.',
    audioDescription: 'You and Keshava won the college badminton doubles. Your school practice had paid off.'
  },
  {
    key: 'm_first_job', title: 'First Job at the Survey Office', approximateYear: 1970, eventDate: '1970-03-02',
    location: 'Shivamogga', era: 'Early Career', eventType: 'work', albumKey: 'college',
    tags: ['work', 'engineer', 'survey', 'first job'], peopleKeys: ['gopal'],
    status: 'VERIFIED', source: V,
    description: 'The first job as a junior engineer.',
    story: 'You began your first job as a junior engineer at the survey office in Shivamogga. You wore a pressed shirt and carried your measuring tape with pride. It was the start of a long, steady career.',
    audioDescription: 'You started your first job as a junior engineer in Shivamogga.'
  },
  {
    key: 'm_pen_firstjob', title: 'Signing the First Pay Register', approximateYear: 1970, eventDate: '1970-03-31',
    location: 'Shivamogga', era: 'Early Career', eventType: 'work', albumKey: 'college',
    tags: ['pen', 'pay', 'work', 'register', 'father'], peopleKeys: ['gopal'],
    status: 'VERIFIED', source: V,
    description: "Signing the first salary register with father's pen.",
    story: 'On your first pay day you signed the office register with your father’s green fountain pen. You bought sweets for the whole office. That pen had come a long way with you.',
    audioDescription: 'You signed your first pay register with your father’s green fountain pen.'
  },

  // ---------- Marriage & Young Family ----------
  {
    key: 'm_wedding', title: 'The Wedding in Thirthahalli', approximateYear: 1972, eventDate: '1972-05-14',
    location: 'Thirthahalli, Karnataka', era: 'Marriage', eventType: 'wedding', albumKey: 'family',
    tags: ['wedding', 'Lakshmi', 'marriage', 'banana leaf', 'family'], peopleKeys: ['gopal', 'lakshmi', 'narayana', 'saraswati'],
    status: 'VERIFIED', source: V,
    description: 'Marrying Lakshmi in the temple town of Thirthahalli.',
    story: 'You married Lakshmi in Thirthahalli, with a feast served on banana leaves and the temple bells ringing. Your parents, Narayana and Saraswati, blessed you both. It was the happiest day your town had seen that year.',
    audioDescription: 'You married Lakshmi in Thirthahalli with a big banana-leaf feast. Everyone celebrated.'
  },
  {
    key: 'm_coffee_lakshmi', title: 'Morning Coffee with Lakshmi', approximateYear: 1973, eventDate: '1973-02-11',
    location: 'Shivamogga', era: 'Marriage', eventType: 'ritual', albumKey: 'family',
    tags: ['coffee', 'filter coffee', 'Lakshmi', 'morning', 'ritual'], peopleKeys: ['gopal', 'lakshmi'],
    status: 'VERIFIED', source: V,
    description: 'Continuing the coffee ritual with Lakshmi.',
    story: 'Just as your mother once did, you and Lakshmi began every morning with filter coffee, sharing the first cup by the window. You taught her your mother’s exact way with the decoction. It became your own quiet ritual.',
    audioDescription: 'You and Lakshmi started every morning with filter coffee, just like your mother used to make.'
  },
  {
    key: 'm_anil_steps', title: "Anil's First Steps", approximateYear: 1975, eventDate: '1975-10-08',
    location: 'Shivamogga', era: 'Young Family', eventType: 'family', albumKey: 'family',
    tags: ['Anil', 'son', 'first steps', 'courtyard'], peopleKeys: ['gopal', 'lakshmi', 'anil'],
    status: 'VERIFIED', source: V,
    description: "Son Anil's first steps.",
    story: 'Your son Anil took his first wobbling steps across the courtyard straight into your arms. Lakshmi clapped and you lifted him high. You both laughed until your eyes watered.',
    audioDescription: 'Your son Anil took his first steps into your arms in the courtyard.'
  },
  {
    key: 'm_lullaby_children', title: 'Singing Jo Jo to Anil and Meera', approximateYear: 1981, eventDate: '1981-01-15',
    location: 'Shivamogga', era: 'Young Family', eventType: 'ritual', albumKey: 'family',
    tags: ['lullaby', 'Jo Jo', 'Anil', 'Meera', 'song', 'night'], peopleKeys: ['gopal', 'anil', 'meera'],
    status: 'VERIFIED', source: V,
    description: "Singing mother's lullaby to the children.",
    story: 'At night you sang little Anil and Meera the same "Jo Jo" lullaby your mother had sung to you. Their eyes closed slowly, just as yours once did. The old tune lived on in your home.',
    audioDescription: 'You sang Anil and Meera the same Jo Jo lullaby your mother sang to you.'
  },
  {
    key: 'm_meera_boats', title: 'Paper Boats with Meera', approximateYear: 1983, eventDate: '1983-07-20',
    location: 'Shivamogga', era: 'Young Family', eventType: 'play', albumKey: 'family',
    tags: ['paper boats', 'Meera', 'rain', 'daughter'], peopleKeys: ['gopal', 'lakshmi', 'meera'],
    status: 'VERIFIED', source: V,
    description: 'Teaching daughter Meera to fold paper boats.',
    story: 'When the rains came, you taught your daughter Meera to fold paper boats, just as you had done as a boy with Shanta. She floated them down the wet verandah and squealed with joy. Some things are too good not to pass on.',
    audioDescription: 'You taught Meera to fold paper boats in the rain, just like you did as a boy.'
  },
  {
    key: 'm_move_bangalore', title: 'The Move to Bangalore', approximateYear: 1983, eventDate: '1983-11-03',
    location: 'Bangalore', era: 'Young Family', eventType: 'home', albumKey: 'family',
    tags: ['Bangalore', 'move', 'city', 'family', 'new home'], peopleKeys: ['gopal', 'lakshmi', 'anil', 'meera'],
    status: 'VERIFIED', source: V,
    description: 'Moving the family to Bangalore for a bigger post.',
    story: 'You moved the family to Bangalore for a bigger engineering post, packing your lives into a lorry. Anil and Meera pressed their faces to the window the whole way. A new chapter began in the big city.',
    audioDescription: 'You moved the family to Bangalore for a new job. The children watched the road the whole way.'
  },
  {
    key: 'm_jasmine_garden', title: 'Planting Jasmine in the Bangalore Garden', approximateYear: 1984, eventDate: '1984-06-25',
    location: 'Bangalore', era: 'Young Family', eventType: 'home', albumKey: 'family',
    tags: ['jasmine', 'mallige', 'garden', 'Bangalore', 'Lakshmi'], peopleKeys: ['gopal', 'lakshmi'],
    status: 'VERIFIED', source: V,
    description: 'Replanting the travelled jasmine in the new city garden.',
    story: 'In your first Bangalore garden you planted the jasmine that had travelled from your mother’s courtyard to your Mysore hostel and now to your own home. You and Lakshmi watered it together each evening. Soon the whole lane smelled of mallige.',
    audioDescription: 'You planted your mother’s jasmine in your Bangalore garden. Soon the whole lane smelled of it.'
  },

  // ---------- Bangalore Working Years / Middle Life ----------
  {
    key: 'm_badminton_anil', title: 'Teaching Anil Badminton', approximateYear: 1986, eventDate: '1986-09-19',
    location: 'Bangalore', era: 'Middle Life', eventType: 'sport', albumKey: 'bangalore',
    tags: ['badminton', 'Anil', 'son', 'court', 'sport'], peopleKeys: ['gopal', 'anil'],
    status: 'VERIFIED', source: V,
    description: 'Teaching son Anil to play badminton.',
    story: 'On the colony court you taught your son Anil badminton, showing him the same wrist flick Master Subbarao once taught you. He grew quick on his feet. The game had passed to the next pair of hands.',
    audioDescription: 'You taught Anil badminton on the colony court, the same way you were taught.'
  },
  {
    key: 'm_career_tank', title: 'The Vidyanagar Water-Tank Project', approximateYear: 1990, eventDate: '1990-04-17',
    location: 'Bangalore', era: 'Middle Life', eventType: 'work', albumKey: 'bangalore',
    tags: ['work', 'engineer', 'water tank', 'project', 'bridge'], peopleKeys: ['gopal'],
    status: 'VERIFIED', source: V,
    description: 'Leading a proud civil engineering project.',
    story: 'You led the team that built the big Vidyanagar water tank that still serves the neighbourhood. You kept your father’s habit of checking every measurement twice. The day it was commissioned, you felt deeply proud.',
    audioDescription: 'You led the building of the Vidyanagar water tank. You were very proud the day it opened.'
  },
  {
    key: 'm_diwali_garden', title: 'Deepavali Lamps in the Garden', approximateYear: 1995, eventDate: '1995-10-23',
    location: 'Bangalore', era: 'Middle Life', eventType: 'festival', albumKey: 'bangalore',
    tags: ['Deepavali', 'lamps', 'festival', 'jasmine', 'family'], peopleKeys: ['gopal', 'lakshmi', 'anil', 'meera'],
    status: 'VERIFIED', source: V,
    description: 'A warm Deepavali in the jasmine garden.',
    story: 'Every Deepavali the family lit rows of clay lamps along the garden wall where the jasmine grew. Lakshmi made sweets while Anil and Meera burst sparklers. The little flames and the mallige scent filled the evening.',
    audioDescription: 'Every Deepavali you lit clay lamps in the garden by the jasmine. The children loved the sparklers.'
  },
  {
    key: 'm_anil_wedding', title: "Anil and Deepa's Wedding", approximateYear: 2003, eventDate: '2003-02-09',
    location: 'Bangalore', era: 'Middle Life', eventType: 'wedding', albumKey: 'bangalore',
    tags: ['wedding', 'Anil', 'Deepa', 'family', 'celebration'], peopleKeys: ['gopal', 'lakshmi', 'anil', 'deepa'],
    status: 'VERIFIED', source: V,
    description: "Son Anil marries Deepa.",
    story: 'Your son Anil married Deepa in a bright Bangalore hall, and you welcomed a new daughter into the family. You strung jasmine from your own garden for the occasion. The whole family danced that night.',
    audioDescription: "Your son Anil married Deepa. You strung jasmine from your garden for the wedding."
  },
  {
    key: 'm_meera_teacher', title: 'Meera Becomes a Teacher', approximateYear: 2004, eventDate: '2004-06-07',
    location: 'Bangalore', era: 'Middle Life', eventType: 'achievement', albumKey: 'bangalore',
    tags: ['Meera', 'teacher', 'pen', 'father', 'daughter'], peopleKeys: ['gopal', 'meera'],
    status: 'VERIFIED', source: V,
    description: "Giving daughter Meera the family fountain pen.",
    story: 'When your daughter Meera became a schoolteacher, you gave her your father’s green fountain pen to mark the day. You told her how it had passed from his hand to yours. She promised to keep it carefully.',
    audioDescription: 'When Meera became a teacher, you gave her your father’s green fountain pen.'
  },
  {
    key: 'm_retirement', title: 'Retirement and the Garden Bench', approximateYear: 2008, eventDate: '2008-07-01',
    location: 'Bangalore', era: 'Retirement', eventType: 'milestone', albumKey: 'bangalore',
    tags: ['retirement', 'garden', 'bench', 'jasmine', 'Lakshmi'], peopleKeys: ['gopal', 'lakshmi'],
    status: 'VERIFIED', source: V,
    description: 'Retiring and building a bench under the jasmine.',
    story: 'When you retired after many steady years, you built a small wooden bench under the jasmine in your garden. Each evening you and Lakshmi sat there with coffee as the flowers opened. It was a calm, well-earned rest.',
    audioDescription: 'When you retired, you built a bench under the jasmine where you and Lakshmi sit each evening.'
  },

  // ---------- Grandparent Years ----------
  {
    key: 'm_lullaby_nithya', title: 'Jo Jo for Little Nithya', approximateYear: 2012, eventDate: '2012-03-18',
    location: 'Bangalore', era: 'Grandparent Years', eventType: 'ritual', albumKey: 'grandparent',
    tags: ['lullaby', 'Jo Jo', 'Nithya', 'granddaughter', 'song'], peopleKeys: ['gopal', 'nithya', 'meera'],
    status: 'VERIFIED', source: V,
    description: "Singing the family lullaby to granddaughter Nithya.",
    story: 'You rocked your little granddaughter Nithya and sang her the same "Jo Jo" lullaby your mother sang to you long ago. Three generations had now fallen asleep to that tune. Meera watched from the doorway, smiling.',
    audioDescription: 'You sang little Nithya the Jo Jo lullaby, the same one your mother sang to you.'
  },
  {
    key: 'm_coffee_arjun', title: 'Teaching Arjun to Froth the Coffee', approximateYear: 2013, eventDate: '2013-05-26',
    location: 'Bangalore', era: 'Grandparent Years', eventType: 'ritual', albumKey: 'grandparent',
    tags: ['coffee', 'filter coffee', 'Arjun', 'grandson', 'ritual'], peopleKeys: ['gopal', 'arjun'],
    status: 'VERIFIED', source: V,
    description: 'Passing the coffee ritual to grandson Arjun.',
    story: 'One morning you showed your grandson Arjun how to pour the decoction from cup to cup to raise a good froth, exactly as your mother taught you. He giggled when the bubbles rose. The coffee ritual had reached a third generation.',
    audioDescription: 'You taught your grandson Arjun to froth the filter coffee, just as your mother taught you.'
  },
  {
    key: 'm_jasmine_grandkids', title: 'Stringing Jasmine with Arjun and Nithya', approximateYear: 2016, eventDate: '2016-08-11',
    location: 'Bangalore', era: 'Grandparent Years', eventType: 'home', albumKey: 'grandparent',
    tags: ['jasmine', 'mallige', 'Arjun', 'Nithya', 'garden'], peopleKeys: ['gopal', 'arjun', 'nithya'],
    status: 'VERIFIED', source: V,
    description: 'Grandchildren string the garden jasmine.',
    story: 'On festival mornings your grandchildren Arjun and Nithya picked the garden jasmine and you taught them to string it into garlands. It was the same jasmine that began in your mother’s courtyard so long ago. Its scent tied the generations together.',
    audioDescription: 'You taught Arjun and Nithya to string the garden jasmine, the same jasmine from your mother’s courtyard.'
  },
  {
    key: 'm_badminton_arjun', title: "Arjun's School Badminton Medal", approximateYear: 2018, eventDate: '2018-12-15',
    location: 'Bangalore', era: 'Grandparent Years', eventType: 'sport', albumKey: 'grandparent',
    tags: ['badminton', 'Arjun', 'medal', 'school', 'grandson'], peopleKeys: ['gopal', 'arjun', 'anil'],
    status: 'VERIFIED', source: V,
    description: 'Grandson Arjun wins a school badminton medal.',
    story: 'Your grandson Arjun won his school badminton medal, and you cheered from the front row beside his father Anil. The same game Master Subbarao taught you had now reached a third generation of winners. You clapped until your hands ached.',
    audioDescription: 'Your grandson Arjun won a school badminton medal. You cheered from the front row.'
  },

  // ---------- Negative records (must NEVER reach the patient) ----------
  {
    key: 'm_pending_goa', title: 'A Goa Beach Trip', approximateYear: 1999, eventDate: '1999-04-10',
    location: 'Goa', era: 'Middle Life', eventType: 'travel', albumKey: 'bangalore',
    tags: ['Goa', 'beach', 'trip', 'sea'], peopleKeys: ['gopal', 'lakshmi'],
    status: 'PENDING', source: 'AI_DRAFTED',
    description: 'Unconfirmed draft of a Goa beach trip.',
    story: 'Draft suggestion awaiting family review: the family may have taken a trip to a Goa beach in 1999. This has not been confirmed by the family yet.',
    audioDescription: undefined
  },
  {
    key: 'm_rejected_car', title: 'Winning a Car in a Lucky Draw', approximateYear: 2006, eventDate: '2006-01-05',
    location: 'Bangalore', era: 'Middle Life', eventType: 'other', albumKey: 'bangalore',
    tags: ['car', 'lucky draw', 'prize'], peopleKeys: ['gopal'],
    status: 'REJECTED', source: 'AI_DRAFTED',
    description: 'Rejected draft — did not actually happen.',
    story: 'Draft that the family reviewed and rejected as inaccurate: it was suggested that Gopal won a car in a lucky draw, but this never happened.',
    audioDescription: undefined
  }
];

export const LINKS: SeedLink[] = [
  // Coffee ritual across three generations
  { from: 'm_coffee_mother', to: 'm_coffee_lakshmi', linkType: 'ritual', connectionNote: "The morning filter-coffee ritual your mother Saraswati began, you carried into your own marriage with Lakshmi." },
  { from: 'm_coffee_lakshmi', to: 'm_coffee_arjun', linkType: 'ritual', connectionNote: 'The same coffee ritual was handed down again, from you to your grandson Arjun.' },
  // Jasmine that travels with the family
  { from: 'm_jasmine_courtyard', to: 'm_jasmine_mysore', linkType: 'object', connectionNote: "A cutting of your mother's courtyard jasmine travelled with you to your hostel window in Mysore." },
  { from: 'm_jasmine_mysore', to: 'm_jasmine_garden', linkType: 'object', connectionNote: 'That same jasmine was replanted in your first Bangalore garden.' },
  { from: 'm_jasmine_garden', to: 'm_jasmine_grandkids', linkType: 'object', connectionNote: "The jasmine that began in your mother's courtyard now blooms for your grandchildren to string." },
  // Badminton passed down the generations
  { from: 'm_badminton_subbarao', to: 'm_badminton_college', linkType: 'theme', connectionNote: "Master Subbarao's school-ground lessons led to your college doubles title with Keshava." },
  { from: 'm_badminton_college', to: 'm_badminton_anil', linkType: 'theme', connectionNote: 'The badminton you learned you later taught to your son Anil.' },
  { from: 'm_badminton_anil', to: 'm_badminton_arjun', linkType: 'theme', connectionNote: 'The game reached a third generation when your grandson Arjun won his school medal.' },
  // "Jo Jo" lullaby sung to three generations
  { from: 'm_lullaby_mother', to: 'm_lullaby_children', linkType: 'ritual', connectionNote: "Your mother's Jo Jo lullaby, you sang to your own children Anil and Meera." },
  { from: 'm_lullaby_children', to: 'm_lullaby_nithya', linkType: 'ritual', connectionNote: 'The same lullaby reached a third generation with your granddaughter Nithya.' },
  // Father's fountain pen
  { from: 'm_pen_father', to: 'm_pen_firstjob', linkType: 'object', connectionNote: "Your father's green fountain pen signed your very first pay register." },
  { from: 'm_pen_firstjob', to: 'm_meera_teacher', linkType: 'object', connectionNote: 'You later gave that same pen to your daughter Meera when she became a teacher.' },
  // Paper boats
  { from: 'm_malnad_rain', to: 'm_meera_boats', linkType: 'theme', connectionNote: 'The paper boats you floated as a boy with Shanta, you taught your daughter Meera to fold.' }
];
