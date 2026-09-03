import { FormEvent, useEffect, useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Compass,
  LocateFixed,
  MapPin,
  MessageCircle,
  Navigation,
  Search,
  Send,
  Sparkles,
  SunMedium,
  Wind,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

type Place = {
  name: string;
  type: string;
  description: string;
  image: string;
};

type Destination = {
  name: string;
  country: string;
  region: string;
  tagline: string;
  description: string;
  bestFor: string;
  bestTime: string;
  image: string;
  coordinates: { lat: number; lon: number };
  places: Place[];
};

type Itinerary = {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
};

type Message = { role: "assistant" | "user"; content: string };

const destinations: Destination[] = [
  {
    name: "Lisbon",
    country: "Portugal",
    region: "Europe",
    tagline: "Light, tiles, and the long way home.",
    description:
      "A sun-washed city of steep streets, tiled facades, and Atlantic air. Lisbon rewards an unhurried rhythm: one neighbourhood, one viewpoint, one long lunch at a time.",
    bestFor: "Food · design · slow days",
    bestTime: "May — October",
    image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1800&q=85",
    coordinates: { lat: 38.7223, lon: -9.1393 },
    places: [
      { name: "Alfama", type: "Neighbourhood", description: "Wander the oldest quarter's lanes as the city warms up below you.", image: "https://images.unsplash.com/photo-1558370781-d6196949e317?auto=format&fit=crop&w=900&q=80" },
      { name: "Belém Tower", type: "Landmark", description: "A riverside icon best paired with custard tarts and a late afternoon walk.", image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=80" },
      { name: "Miradouro da Senhora", type: "Viewpoint", description: "Find a quiet terrace for one of Lisbon's most generous city views.", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=900&q=80" },
    ],
  },
  {
    name: "Kyoto",
    country: "Japan",
    region: "Asia",
    tagline: "Quiet rituals, hidden gardens.",
    description:
      "A city where centuries-old tea houses sit beside precise contemporary details. Kyoto is best experienced early, on foot, and with space left in the day.",
    bestFor: "Culture · gardens · craft",
    bestTime: "March — May",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1800&q=85",
    coordinates: { lat: 35.0116, lon: 135.7681 },
    places: [
      { name: "Fushimi Inari", type: "Shrine", description: "Follow the vermilion gates uphill before the crowds arrive.", image: "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?auto=format&fit=crop&w=900&q=80" },
      { name: "Arashiyama", type: "Landscape", description: "Pair the bamboo grove with river light and a quiet temple garden.", image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=900&q=80" },
      { name: "Gion", type: "Neighbourhood", description: "Lantern-lit lanes, machiya houses, and the soft hush of evening.", image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=900&q=80" },
    ],
  },
  {
    name: "Cape Town",
    country: "South Africa",
    region: "Africa",
    tagline: "Mountain air meets the open ocean.",
    description:
      "Cape Town holds a whole landscape in one frame: mountain, sea, vineyards, and neighbourhoods with their own tempo. Make room for weather-led detours.",
    bestFor: "Outdoors · wine · coastline",
    bestTime: "November — March",
    image: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1800&q=85",
    coordinates: { lat: -33.9249, lon: 18.4241 },
    places: [
      { name: "Table Mountain", type: "Outdoors", description: "Take the cableway up or earn the view on one of the marked trails.", image: "https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?auto=format&fit=crop&w=900&q=80" },
      { name: "Bo-Kaap", type: "Neighbourhood", description: "Colourful facades, Cape Malay cooking, and a history worth hearing.", image: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=900&q=80" },
      { name: "Clifton Beach", type: "Coastline", description: "A sheltered pocket of sand for the golden hour between swims.", image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=80" },
    ],
  },
  {
    name: "Mexico City",
    country: "Mexico",
    region: "Americas",
    tagline: "Big energy, deep history, brilliant food.",
    description:
      "Mexico City is a layered, living metropolis where art, architecture, markets, and late dinners all belong to the same day.",
    bestFor: "Art · food · city life",
    bestTime: "March — May",
    image: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1800&q=85",
    coordinates: { lat: 19.4326, lon: -99.1332 },
    places: [
      { name: "Roma Norte", type: "Neighbourhood", description: "Tree-lined streets, galleries, and a cafe for every kind of morning.", image: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=900&q=80" },
      { name: "Museo Frida Kahlo", type: "Museum", description: "A blue house that makes the artist's life feel startlingly close.", image: "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=900&q=80" },
      { name: "Chapultepec", type: "Park", description: "A green, generous pause in the middle of the city's momentum.", image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=900&q=80" },
    ],
  },
  {
    name: "Reykjavík",
    country: "Iceland",
    region: "Europe",
    tagline: "Small-city calm at the edge of everything.",
    description:
      "Use Reykjavík as a soft landing for big landscapes: geothermal water, black-sand coastlines, and a sky that changes its mind by the hour.",
    bestFor: "Nature · design · reset",
    bestTime: "June — August",
    image: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1800&q=85",
    coordinates: { lat: 64.1466, lon: -21.9426 },
    places: [
      { name: "Hallgrímskirkja", type: "Architecture", description: "A striking landmark with a wide view over the colourful rooftops.", image: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=900&q=80" },
      { name: "Harpa", type: "Culture", description: "Walk the harbour and let the geometric glass facade catch the weather.", image: "https://images.unsplash.com/photo-1520769945061-0a448c463865?auto=format&fit=crop&w=900&q=80" },
      { name: "Sky Lagoon", type: "Wellness", description: "A warm, sea-facing ritual for the day you arrive or leave.", image: "https://images.unsplash.com/photo-1520769945061-0a448c463865?auto=format&fit=crop&w=900&q=80" },
    ],
  },
  {
    name: "Marrakech",
    country: "Morocco",
    region: "Africa",
    tagline: "Rose walls, tiled courtyards, open skies.",
    description:
      "Marrakech is a sensory city of shadows and colour. Let the medina set the pace, then retreat to a quiet riad when the afternoon heat arrives.",
    bestFor: "Markets · architecture · warmth",
    bestTime: "October — April",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1800&q=85",
    coordinates: { lat: 31.6295, lon: -7.9811 },
    places: [
      { name: "Jardin Majorelle", type: "Garden", description: "Cobalt blue, sculptural planting, and a slower hour away from the souks.", image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=80" },
      { name: "Jemaa el-Fnaa", type: "Market square", description: "Come for the movement, stay for the evening food stalls and stories.", image: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=900&q=80" },
      { name: "Bahia Palace", type: "Architecture", description: "A maze of mosaics, courtyards, and the best kind of visual overload.", image: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=900&q=80" },
    ],
  },
  {
    name: "Jaipur",
    country: "India",
    region: "Asia",
    tagline: "Rose-pink streets, royal courtyards, bold flavours.",
    description:
      "Jaipur moves between grand palaces, artisan workshops, and warm evening markets. Follow the colour through the old city, then slow down for chai and a sunset over the Aravalli hills.",
    bestFor: "Heritage · craft · food",
    bestTime: "October — March",
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1800&q=85",
    coordinates: { lat: 26.9124, lon: 75.7873 },
    places: [
      { name: "Amber Fort", type: "Heritage", description: "Climb through honey-coloured courtyards and look out across the hills beyond the city.", image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=900&q=80" },
      { name: "Hawa Mahal", type: "Landmark", description: "See Jaipur's famous pink facade glow at first light, before the old city wakes up.", image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=900&q=80" },
      { name: "City Palace", type: "Architecture", description: "A living royal complex of painted doors, textiles, and quiet museum rooms.", image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=900&q=80" },
    ],
  },
];

const regions = ["All regions", "Europe", "Asia", "Africa", "Americas"];

const starterItinerary = (destination: Destination): Itinerary[] => [
  { day: 1, title: `Arrive & find your bearings`, morning: `Settle into ${destination.name} and take a slow first walk.`, afternoon: `Start with ${destination.places[0].name}, keeping the rest of the day open.`, evening: "Choose a neighbourhood restaurant and order one thing you cannot pronounce." },
  { day: 2, title: `The essential rhythm`, morning: `Begin early at ${destination.places[1].name} before the day gets busy.`, afternoon: "Make time for a long lunch, then wander without a checklist.", evening: `Watch the light change from ${destination.places[2].name}.` },
  { day: 3, title: "A little further out", morning: "Take the scenic route and let the city edge into landscape.", afternoon: "Leave room for a market, gallery, or an unplanned second coffee.", evening: "Return to the place that surprised you most." },
  { day: 4, title: "One last beautiful detail", morning: "Sleep in, then revisit a favourite street or view.", afternoon: "Pick up something made locally and take one final, aimless walk.", evening: "A slow dinner, then pack for the next chapter." },
];

function formatWeatherTime(value?: string) {
  if (!value) return "Live now";
  return new Intl.DateTimeFormat("en", { weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export default function Home() {
  const [selected, setSelected] = useState<Destination>(destinations[0]);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("All regions");
  const [locationState, setLocationState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [locationMessage, setLocationMessage] = useState("");
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: `I'm your ${selected.name} guide. Ask me how long to stay, what to see, or when to go.` },
  ]);
  const [days, setDays] = useState(4);
  const [itinerary, setItinerary] = useState<Itinerary[]>(starterItinerary(selected));

  const filteredDestinations = useMemo(() => destinations.filter((destination) => {
    const matchesQuery = `${destination.name} ${destination.country} ${destination.region}`.toLowerCase().includes(query.toLowerCase());
    const matchesRegion = region === "All regions" || destination.region === region;
    return matchesQuery && matchesRegion;
  }), [query, region]);

  const weatherInput = useMemo(() => userCoords ?? selected.coordinates, [selected.coordinates, userCoords]);
  const weather = trpc.weather.current.useQuery(weatherInput, { refetchInterval: 300000 });
  const askAssistant = trpc.assistant.ask.useMutation({
    onSuccess: (data) => {
      setMessages((current) => [...current, { role: "assistant", content: data.answer }]);
    },
    onError: () => {
      setMessages((current) => [...current, { role: "assistant", content: "I couldn't reach the guide just now. Try again in a moment." }]);
    },
  });
  const makeItinerary = trpc.assistant.plan.useMutation({
    onSuccess: (data) => setItinerary(data.days),
    onError: () => setLocationMessage("The itinerary guide is taking a pause. Please try again.")
  });

  useEffect(() => {
    setMessages([{ role: "assistant", content: `I'm your ${selected.name} guide. Ask me how long to stay, what to see, or when to go.` }]);
    setItinerary(starterItinerary(selected));
    setUserCoords(null);
    setLocationState("idle");
    setLocationMessage("");
  }, [selected]);

  const selectDestination = (destination: Destination) => {
    setSelected(destination);
    document.getElementById("destination-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationState("error");
      setLocationMessage("Location is not available in this browser. Search for a destination instead.");
      return;
    }
    setLocationState("loading");
    setLocationMessage("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
        setLocationState("success");
        setLocationMessage("Weather updated for your location.");
      },
      () => {
        setLocationState("error");
        setLocationMessage("Location permission was declined. You can still search any destination above.");
      },
      { enableHighAccuracy: false, timeout: 7000 },
    );
  };

  const submitQuestion = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || askAssistant.isPending) return;
    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setQuestion("");
    askAssistant.mutate({ destination: selected.name, country: selected.country, question: trimmed });
  };

  const generateItinerary = () => {
    setLocationMessage("");
    makeItinerary.mutate({ destination: selected.name, country: selected.country, days });
  };

  return (
    <div className="app-shell">
      <header className="hero" id="top">
        <video className="hero-video" autoPlay muted loop playsInline poster="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=85" aria-hidden="true">
          <source src="https://videos.pexels.com/video-files/857195/857195-hd_1920_1080_30fps.mp4" type="video/mp4" />
        </video>
        <div className="hero-scrim" />
        <nav className="site-nav" aria-label="Primary navigation">
          <a className="wordmark" href="#top" aria-label="Roamfield home"><span>roam</span>field<span className="wordmark-dot">.</span></a>
          <div className="nav-links">
            <a href="#explore">Explore</a>
            <a href="#places">Places</a>
            <a href="#planner">Planner</a>
          </div>
          <a className="nav-pill" href="#planner"><Sparkles size={15} /> Plan a trip</a>
        </nav>
        <div className="hero-content page-width">
          <div className="hero-copy">
            <p className="eyebrow light">Field notes for the curious</p>
            <h1>Take the scenic<br /><em>way through.</em></h1>
            <p className="hero-subtitle">Travel by feeling, not by checklist. Find the landscape, local detail, and weather that make a place worth the miles.</p>
            <a className="primary-button light-button" href="#explore">Start exploring <ArrowRight size={18} /></a>
          </div>
          <div className="hero-aside">
            <div className="hero-aside-line" />
            <p>06 field notes</p>
            <span>For the road less ordinary</span>
          </div>
        </div>
        <a className="scroll-cue" href="#explore"><span>Scroll to wander</span><ChevronDown size={18} /></a>
      </header>

      <main>
        <section className="explorer-section page-width" id="explore">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">01 / Pick a trailhead</p>
              <h2>Where does the<br /><em>road feel alive?</em></h2>
            </div>
            <p className="section-intro">Search the shortlist, filter by region, and open a place when something catches your eye.</p>
          </div>

          <div className="explorer-toolbar" role="search">
            <label className="search-field">
              <Search size={18} aria-hidden="true" />
              <span className="sr-only">Search destinations</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a destination" />
              {query && <button type="button" className="clear-search" aria-label="Clear search" onClick={() => setQuery("")}><X size={15} /></button>}
            </label>
            <div className="filter-list" aria-label="Filter by region">
              {regions.map((item) => <button type="button" key={item} className={`filter-chip ${region === item ? "active" : ""}`} onClick={() => setRegion(item)}>{item}</button>)}
            </div>
          </div>

          {filteredDestinations.length ? (
            <div className="destination-grid">
              {filteredDestinations.map((destination, index) => (
                <button type="button" className={`destination-card ${selected.name === destination.name ? "selected" : ""}`} key={destination.name} onClick={() => selectDestination(destination)}>
                  <div className="destination-image-wrap">
                    <img src={destination.image} alt={`${destination.name}, ${destination.country}`} className="destination-image" />
                    <span className="card-index">0{index + 1}</span>
                    {selected.name === destination.name && <span className="selected-mark"><Check size={14} /></span>}
                  </div>
                  <div className="destination-card-copy">
                    <div><h3>{destination.name}</h3><p>{destination.country}</p></div>
                    <ArrowRight size={18} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state"><Compass size={24} /><h3>No places found</h3><p>Try another city or clear the region filter.</p></div>
          )}
        </section>

        <section className="detail-section page-width" id="destination-detail">
          <div className="detail-image-column">
            <img src={selected.image} alt={`${selected.name} landscape`} />
            <div className="image-caption"><MapPin size={14} /> {selected.name}, {selected.country}</div>
          </div>
          <div className="detail-copy-column">
            <p className="eyebrow">02 / Read the landscape</p>
            <h2>{selected.name}<span>,</span><br /><em>{selected.tagline}</em></h2>
            <p className="body-copy">{selected.description}</p>
            <div className="detail-facts">
              <div><span className="fact-label">Best for</span><strong>{selected.bestFor}</strong></div>
              <div><span className="fact-label">Best time</span><strong>{selected.bestTime}</strong></div>
            </div>
            <div className="weather-card" aria-live="polite">
              <div className="weather-topline"><span className="fact-label"><SunMedium size={15} /> Live weather {userCoords ? "· your location" : `· ${selected.name}`}</span><span className="weather-time">{formatWeatherTime(weather.data?.time)}</span></div>
              {weather.isLoading ? <div className="weather-loading"><span className="loading-dot" /> Reading the sky…</div> : weather.isError ? <div className="weather-error">Live weather is unavailable right now. The rest of the guide is still open.</div> : <div className="weather-reading"><strong>{Math.round(weather.data?.temperature ?? 0)}°</strong><div><b>{weather.data?.summary}</b><span>Feels like {Math.round(weather.data?.apparentTemperature ?? 0)}° · {weather.data?.humidity}% humidity</span></div><Wind size={19} /></div>}
              <button type="button" className="location-button" onClick={useMyLocation} disabled={locationState === "loading"}><LocateFixed size={15} /> {locationState === "loading" ? "Finding you…" : "Use my location"}</button>
              {locationMessage && <p className={`location-message ${locationState}`}>{locationMessage}</p>}
            </div>
          </div>
        </section>

        <section className="places-section page-width" id="places">
          <div className="section-heading split-heading places-heading">
            <div><p className="eyebrow">03 / Pin the quiet spots</p><h2>Three ways into<br /><em>{selected.name}.</em></h2></div>
            <p className="section-intro">Not a checklist. Just the places that give the city its shape.</p>
          </div>
          <div className="places-grid">
            {selected.places.map((place, index) => <article className="place-card" key={place.name}><div className="place-image-wrap"><img src={place.image} alt={place.name} /><span>0{index + 1}</span></div><div className="place-card-copy"><p className="place-type">{place.type}</p><h3>{place.name}</h3><p>{place.description}</p></div></article>)}
          </div>
        </section>

        <section className="planner-section page-width" id="planner">
          <div className="planner-grid">
            <div className="planner-intro"><p className="eyebrow light">04 / Talk to the trail guide</p><h2>Leave room for<br /><em>the unexpected.</em></h2><p>Ask about pace, seasons, or the one thing you should not miss in {selected.name}.</p><div className="prompt-suggestions"><button type="button" onClick={() => setQuestion(`How many days should I spend in ${selected.name}?`)}>How long should I stay?</button><button type="button" onClick={() => setQuestion("What should I see beyond the obvious?")}>What is worth the detour?</button></div></div>
            <div className="chat-panel"><div className="chat-header"><div><span className="online-dot" /> Roamfield trail guide</div><MessageCircle size={18} /></div><div className="message-list" aria-live="polite">{messages.map((message, index) => <div className={`message ${message.role}`} key={`${message.role}-${index}`}><div className="message-avatar">{message.role === "assistant" ? <Sparkles size={13} /> : "you"}</div><div className="message-bubble">{message.role === "assistant" ? <Streamdown>{message.content}</Streamdown> : message.content}</div></div>)}{askAssistant.isPending && <div className="message assistant"><div className="message-avatar"><Sparkles size={13} /></div><div className="message-bubble typing"><span /><span /><span /></div></div>}</div><form className="chat-form" onSubmit={submitQuestion}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={`Ask about ${selected.name}…`} aria-label={`Ask about ${selected.name}`} /><button type="submit" aria-label="Send question" disabled={!question.trim() || askAssistant.isPending}><Send size={17} /></button></form></div>
          </div>

          <div className="itinerary-area">
            <div className="itinerary-header"><div><p className="eyebrow">05 / Lay out the miles</p><h2>Your {selected.name}<br /><em>in a few good days.</em></h2></div><div className="itinerary-controls"><label>Days <select value={days} onChange={(event) => setDays(Number(event.target.value))}><option value={3}>3 days</option><option value={4}>4 days</option><option value={5}>5 days</option><option value={6}>6 days</option></select></label><button type="button" className="primary-button dark-button" onClick={generateItinerary} disabled={makeItinerary.isPending}><CalendarDays size={17} /> {makeItinerary.isPending ? "Planning…" : "Generate itinerary"}</button></div></div>
            <div className="itinerary-list">{itinerary.slice(0, days).map((item) => <article className="itinerary-day" key={item.day}><div className="day-number">{String(item.day).padStart(2, "0")}</div><div className="day-title"><span>Day {item.day}</span><h3>{item.title}</h3></div><div className="day-stops"><div><span>Morning</span><p>{item.morning}</p></div><div><span>Afternoon</span><p>{item.afternoon}</p></div><div><span>Evening</span><p>{item.evening}</p></div></div></article>)}</div>
          </div>
        </section>
      </main>
      <footer className="site-footer page-width"><a className="wordmark dark-wordmark" href="#top"><span>roam</span>field<span className="wordmark-dot">.</span></a><p>Take the long way. Keep the good parts.</p><a href="#top" className="back-top">Back to top <Navigation size={14} /></a></footer>
    </div>
  );
}

export { destinations };
