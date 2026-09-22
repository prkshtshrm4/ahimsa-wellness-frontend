import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import NatureScene from '../components/NatureScene.jsx';
import BackgroundFilm from '../components/BackgroundFilm.jsx';
import { Brand } from '../components/WellnessHeader.jsx';

const asset = (name) => `/assets/wellness/${name}.webp`;
const therapies = [
  {name:'Ayurveda & Panchkarma',category:'Ayurveda',image:'ayurveda',tag:'TRADITIONAL CARE',description:'Discover a thoughtful approach to Ayurvedic care, with treatments selected following an individual consultation.',detail:'Explore traditional treatments such as herbal compresses and body therapies. Your practitioner will discuss the approach, preparation and suitability with you.'},
  {name:'Hydrotherapy',category:'Naturopathy',image:'hydrotherapy',tag:'THE ELEMENT OF WATER',description:'Water-based therapies, with the time and space to slow down.',detail:'A consultation helps determine which water-based treatment is appropriate for you. Discuss temperature, comfort and any medical considerations before your session.'},
  {name:'Yoga & mindful movement',category:'Movement',image:'yoga',tag:'BREATHE. MOVE. CONNECT.',description:'Make room for breath, movement and a more mindful everyday rhythm.',detail:'Explore guided movement, breathing and relaxation. Let your practitioner know about your experience and mobility needs so the session can be adapted.'},
  {name:'Physiotherapy',category:'Movement',image:'physiotherapy',tag:'MOVEMENT WITH SUPPORT',description:'Individual attention to the way you move, with practitioner-guided care.',detail:'Start with a discussion of your mobility, discomfort and goals. Your practitioner will assess your needs and explain a suitable plan.'},
  {name:'Acupuncture',category:'Naturopathy',image:'acupuncture',tag:'A CONSIDERED APPROACH',description:'Learn about acupuncture and discuss its suitability with a practitioner.',detail:'Ask about the procedure, practitioner qualifications and any relevant precautions during your consultation. Treatment is based on an individual assessment.'},
  {name:'Sauna & air therapy',category:'Naturopathy',image:'sauna',tag:'WARMTH & STILLNESS',description:'A quiet pause, with heat-based sessions tailored to your comfort.',detail:'Heat-based treatments are not appropriate for everyone. Discuss your health history, hydration and suitable session duration with the team first.'},
  {name:'OPD consultation',category:'Consultation',image:'consultation',tag:'YOUR FIRST STEP',description:'A conversation about you, your health history and your wellness goals.',detail:'Bring your relevant reports and a list of current medicines. The consultation is a chance to ask questions and decide on the next steps together.'},
];
const additionalTherapies = [
  { name: 'Mud therapy', tag: 'EARTH & REST', detail: 'Discuss mud-based treatments with the team, including preparation, comfort and whether a session is appropriate for you.' },
  { name: 'Magnetotherapy', tag: 'EXPLORE YOUR OPTIONS', detail: 'Ask the practitioner about the proposed treatment, its evidence, limitations and suitability for your circumstances before choosing a session.' },
  { name: 'Sun & chromotherapy', tag: 'LIGHT & WELLBEING', detail: 'Discuss the specific light-based approach offered by the centre, including precautions and suitability, during your consultation.' },
];
const faqs=[
  ['Where should I start?', 'If you are new to Ahimsa or unsure which therapy to choose, begin with an OPD consultation. Discuss your health history and goals with the team before deciding on a treatment.'],
  ['Can I book a session online?', 'Yes. Choose “Book a visit” to see the services, prices and appointment availability in our booking system. You can also access your existing appointments through “My bookings”.'],
  ['What should I bring to my first visit?', 'Bring any relevant medical reports and a list of your current medicines. Wear comfortable clothing, and share any health conditions or accessibility needs with your practitioner.'],
  ['Should I continue my regular medical care?', 'Yes. Discuss any complementary therapy with your treating clinician, and continue prescribed medicines unless they advise otherwise. Our team can discuss whether a therapy is suitable for your circumstances.'],
];

export default function Home() {
  const [filter,setFilter]=useState('All therapies');
  const [selected,setSelected]=useState(null);
  const [paused,setPaused]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [film,setFilm]=useState(false);
  const dialog=useRef(null);
  const video=useRef(null);
  const lastFocus=useRef(null);
  useEffect(()=> { if(selected || film){lastFocus.current=document.activeElement;dialog.current?.showModal();} else if(dialog.current?.open){dialog.current.close();lastFocus.current?.focus();} },[selected,film]);
  const close=()=>{setSelected(null);setFilm(false);};
  const visible=filter==='All therapies'?therapies:therapies.filter(t=>t.category===filter);
  return <div className="wellness-home">
    <section className="wellness-hero" aria-labelledby="hero-title">
      <BackgroundFilm className="hero-film" paused={paused || film || !!selected} />
      <div className="hero-copy"><p className="wellness-eyebrow"><span className="tiny-sun" aria-hidden="true">✳</span> ROOTED IN NATURE. CENTRED ON YOU.</p><h1 id="hero-title">A gentler way<br/>to feel <em>like<br className="desktop-break"/> yourself.</em></h1><p className="hero-description">Naturopathy, Ayurveda and mindful movement.<br/>Thoughtful care for your everyday wellbeing,<br className="desktop-break"/> at Ahimsa Wellness Centre, Gurugram.</p><div className="hero-actions"><Link to="/book" className="wellness-button">Begin your journey <span aria-hidden="true">↗</span></Link><a href="#therapies" className="wellness-text-link">Explore therapies <span aria-hidden="true">↓</span></a></div><div className="hero-location"><span className="location-dot"/> WORLD PEACE CENTRE · GURUGRAM</div></div>
      <div className="hero-visual"><div className="hero-halo"/><NatureScene paused={paused || film || !!selected}/><figure className="founder-portrait"><img src={asset('dr-pandey')} alt="Dr S. N. Pandey" fetchpriority="high" width="900" height="1075"/><figcaption><span>EXPERIENCE THAT GUIDES US</span><strong>Dr S. N. Pandey</strong><p>Naturopathy educator & practitioner</p></figcaption></figure><div className="portrait-note"><span>Since</span><strong>1980</strong><span>A life devoted<br/>to natural care</span></div><button className="motion-toggle" onClick={()=>setPaused(!paused)} aria-pressed={paused}>{paused?'▶ Resume atmosphere':'Ⅱ Pause atmosphere'}</button></div>
      <div className="hero-bottom"><span>THE ART OF LIVING WELL</span><a href="#our-story">Take a moment. Discover Ahimsa. <span aria-hidden="true">↓</span></a><span>01 — A NEW BEGINNING</span></div>
    </section>

    <section id="our-story" className="wellness-story section-wrap"><div className="section-kicker"><span className="wellness-eyebrow">01 / OUR STORY</span><span>A lifetime of learning. A human approach.</span></div><div className="story-grid"><h2>Rooted in knowledge.<br/>Guided by <em>care.</em></h2><div className="story-copy"><p className="large-copy">Good care begins with listening.<br/>To your body. To your story. To you.</p><p>Dr S. N. Pandey’s work brings together naturopathy, education and lifestyle intervention. His career at the Central Council for Research in Yoga and Naturopathy began in 1980 and spanned more than 27 years.</p><p>At Ahimsa, that perspective shapes a simple starting point: understand the person, then explore a thoughtful path forward.</p><a className="wellness-text-link" href="https://drsnpandey.net/about-drsnp/" target="_blank" rel="noreferrer">Meet Dr Pandey <span aria-hidden="true">↗</span></a></div></div><div className="career-strip"><article><span>1980 — 2008</span><h3>Research & practice</h3><p>A career at CCRYN, beginning as a Research Assistant in naturopathy.</p></article><article><span>1982 — 1985</span><h3>Shaping education</h3><p>Principal, Government Naturopathic Medical College, Hyderabad.</p></article><article><span>A LIFELONG FOCUS</span><h3>Living well, every day</h3><p>Teaching and writing on lifestyle, yoga and naturopathy.</p></article></div></section>

    <section id="therapies" className="wellness-therapies section-wrap"><div className="section-kicker"><span className="wellness-eyebrow">02 / WAYS TO WELLBEING</span><span>A little more balance. A little more you.</span></div><div className="section-heading"><h2>Different paths.<br/>One <em>whole you.</em></h2><p>Explore our approaches to care.<br/>Begin with a conversation to find<br/>what is right for you.</p></div><div className="therapy-filters" role="group" aria-label="Filter therapies">{['All therapies','Naturopathy','Ayurveda','Movement','Consultation'].map(f=><button key={f} onClick={()=>setFilter(f)} aria-pressed={filter===f}>{f}</button>)}</div><div className="therapy-grid" aria-live="polite">{visible.map((t)=><button className="therapy-card" key={t.name} onClick={()=>setSelected(t)} aria-label={`Explore ${t.name}`}><div className="therapy-image"><img src={asset(t.image)} srcSet={`${asset(`${t.image}-480`)} 480w, ${asset(t.image)} 1000w`} sizes="(max-width: 420px) 88vw, (max-width: 780px) 43vw, 29vw" alt={`${t.name} — illustrative therapy photograph`} loading="lazy" width="700" height="520"/><span className="therapy-open" aria-hidden="true">↗</span></div><div className="therapy-meta"><span>{t.tag}</span><span>{String(therapies.indexOf(t)+1).padStart(2,'0')}</span></div><h3>{t.name}</h3><p>{t.description}</p></button>)}</div><div className="additional-therapies"><p className="wellness-eyebrow">ALSO EXPLORE</p>{additionalTherapies.map(t=><button key={t.name} onClick={()=>setSelected(t)}>{t.name}<span aria-hidden="true">↗</span></button>)}</div><div className="therapy-footnote"><span>Therapy photographs are illustrative. Your care is individual.</span><Link to="/book" className="wellness-text-link">View availability & prices <span aria-hidden="true">↗</span></Link></div></section>

    <section className="wellness-philosophy"><span className="philosophy-symbol" aria-hidden="true">✳</span><p className="wellness-eyebrow">THE AHIMSA PHILOSOPHY</p><h2>Less rush.<br/>More <em>rhythm.</em></h2><p>Space to breathe. Time to be heard.<br/>Care that considers your everyday life.</p><a href="#visit" className="wellness-text-link">Find your moment <span aria-hidden="true">↗</span></a><span className="philosophy-word" aria-hidden="true">ahimsa</span></section>

    <section id="the-centre" className="centre-cinema" aria-labelledby="centre-title">
      <BackgroundFilm paused={paused || film || !!selected} />
      <div className="cinema-shade" aria-hidden="true" />
      <div className="cinema-topline"><span>03 / YOUR SPACE TO PAUSE</span><span>GURUGRAM, INDIA</span></div>
      <div className="cinema-content">
        <p className="wellness-eyebrow">WELCOME TO AHIMSA</p>
        <h2 id="centre-title">A little closer<br/>to <em>calm.</em></h2>
        <p>A space to slow down, be heard, and begin again.<br/>Find your own rhythm at the World Peace Centre.</p>
        <div className="cinema-actions">
          <Link to="/book" className="wellness-button">Plan your visit <span aria-hidden="true">↗</span></Link>
          <button className="cinema-watch" onClick={()=>setFilm(true)}><span className="cinema-play" aria-hidden="true">▷</span> Step inside the story</button>
        </div>
      </div>
      <div className="cinema-bottomline"><a href="https://www.google.com/maps/search/?api=1&query=World+Peace+Centre+Sector+39+Gurugram" target="_blank" rel="noreferrer"><span className="location-dot"/> WORLD PEACE CENTRE · SECTOR 39 <span aria-hidden="true">↗</span></a><button className="cinema-motion" onClick={()=>setPaused(!paused)} aria-pressed={paused}>{paused?'▶ Resume atmosphere':'Ⅱ Pause atmosphere'}</button></div>
    </section>

    <section className="wellness-faq section-wrap"><div><p className="wellness-eyebrow">A LITTLE REASSURANCE</p><h2>Before your<br/><em>first visit.</em></h2></div><div className="faq-list">{faqs.map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>

    <section id="visit" className="wellness-visit section-wrap"><p className="wellness-eyebrow">YOUR NEXT CHAPTER</p><h2>Make time<br/>for <em>yourself.</em></h2><p>One conversation is a lovely place to start.</p><Link to="/book" className="wellness-button">Book your first visit <span aria-hidden="true">↗</span></Link><span className="visit-orbit" aria-hidden="true"/></section>
    <footer className="wellness-footer section-wrap"><div className="footer-top"><div><Brand/><p>A gentler approach to living well.</p></div><div><span className="wellness-eyebrow">FIND US</span><p>World Peace Centre, Sector 39<br/>Gurugram, Haryana, India</p><a href="https://www.google.com/maps/search/?api=1&query=World+Peace+Centre+Sector+39+Gurugram" target="_blank" rel="noreferrer">Get directions ↗</a></div><div><span className="wellness-eyebrow">STAY CONNECTED</span><a href="https://www.instagram.com/ahimsawellnesscentre/" target="_blank" rel="noreferrer">Instagram ↗</a><a href="https://www.facebook.com/AhimsaAyurveda" target="_blank" rel="noreferrer">Facebook ↗</a><Link to="/login">My bookings ↗</Link></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Ahimsa Wellness Centre</span><span>NATUROPATHY · AYURVEDA · YOGA</span><Link to="/staff/login">Staff sign in ↗</Link></div></footer>
    <dialog ref={dialog} className="wellness-dialog" aria-label={selected?.name || "A glimpse of Ahimsa"} onCancel={close} onClose={close} onClick={e=>{if(e.target===dialog.current)close();}}><button className="dialog-close" onClick={close} aria-label="Close dialog" autoFocus>✕</button>{selected&&<>{selected.image&&<img className="dialog-image" src={asset(selected.image)} alt={`${selected.name} illustrative photograph`}/>}<div className="dialog-copy"><p className="wellness-eyebrow">{selected.tag}</p><h2>{selected.name}</h2><p>{selected.detail}</p><Link to="/book" className="wellness-button" onClick={close}>Explore appointments <span aria-hidden="true">↗</span></Link><small>Available treatments and prices are listed in booking.</small></div></>}{film&&<div className="film-dialog"><h2>A glimpse of Ahimsa</h2><video ref={video} src="/assets/wellness/centre.mp4" poster={asset('film-poster')} controls playsInline autoPlay muted/><p>World Peace Centre, Gurugram · Exterior film</p></div>}</dialog>
  </div>;
}
