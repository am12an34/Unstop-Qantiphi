// Fallback events used when no Ticketmaster API key is configured or the API is unreachable.
// Dates are generated relative to today so the calendar always has data.

const templates = [
  ['Arijit Singh Live in Concert', 'Music', 'Jawaharlal Nehru Stadium', 'Delhi', '19:00'],
  ['Stand-up Night with Zakir Khan', 'Comedy', 'NCPA Tata Theatre', 'Mumbai', '20:00'],
  ['IPL Fan Park Screening', 'Sports', 'Chinnaswamy Stadium', 'Bengaluru', '18:30'],
  ['Sunburn Arena ft. Martin Garrix', 'Music', 'Mahalaxmi Race Course', 'Mumbai', '17:00'],
  ['Hamlet – A Modern Retelling', 'Arts & Theatre', 'Prithvi Theatre', 'Mumbai', '19:30'],
  ['Indie Music Showcase', 'Music', 'Hard Rock Cafe', 'Bengaluru', '21:00'],
  ['Tech Founders Meetup', 'Miscellaneous', 'IIT Delhi Auditorium', 'Delhi', '17:30'],
  ['Kolkata Jazz Evening', 'Music', 'The Park Hotel', 'Kolkata', '20:00'],
  ['Pro Kabaddi League: Delhi vs Patna', 'Sports', 'Thyagaraj Stadium', 'Delhi', '19:00'],
  ['Classical Carnatic Recital', 'Music', 'Music Academy', 'Chennai', '18:00'],
  ['Food & Culture Festival', 'Miscellaneous', 'Hitex Exhibition Centre', 'Hyderabad', '12:00'],
  ['Northeast Rock Fest', 'Music', 'Swami Vivekananda Stadium', 'Agartala', '16:00'],
  ['Improv Comedy Jam', 'Comedy', 'Canvas Laugh Club', 'Delhi', '20:30'],
  ['ISL: Mumbai City vs Kerala Blasters', 'Sports', 'Mumbai Football Arena', 'Mumbai', '19:30'],
  ['Bharatanatyam Dance Drama', 'Arts & Theatre', 'Kalakshetra', 'Chennai', '18:30'],
  ['Electronic Sunset Sessions', 'Music', 'Vagator Beach', 'Goa', '17:00'],
  ['Tripura Heritage Walk & Folk Night', 'Arts & Theatre', 'Ujjayanta Palace', 'Agartala', '17:30'],
  ['Hackathon Demo Day', 'Miscellaneous', 'T-Hub', 'Hyderabad', '10:00'],
  ['Bollywood Retro Night', 'Music', 'Phoenix Marketcity', 'Pune', '20:00'],
  ['Marathon Expo & Run', 'Sports', 'Marine Drive', 'Mumbai', '06:00'],
];

function pad(n) {
  return String(n).padStart(2, '0');
}

function toLocalDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildMockEvents() {
  const start = new Date();
  start.setDate(1);
  const events = [];
  // Spread each template across ~3 months so every month has events.
  for (let round = 0; round < 3; round++) {
    templates.forEach(([title, category, venue, city, time], i) => {
      const d = new Date(start);
      d.setMonth(start.getMonth() + round);
      d.setDate(1 + ((i * 3 + round * 5) % 28));
      events.push({
        id: `mock-${round}-${i}`,
        title,
        category,
        venue,
        city,
        date: toLocalDate(d),
        time,
        image: `https://picsum.photos/seed/event${round}${i}/640/360`,
        url: null,
        source: 'mock',
      });
    });
  }
  return events.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

module.exports = buildMockEvents;
