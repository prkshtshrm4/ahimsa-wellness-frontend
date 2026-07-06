import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { c, font, rupees } from '../theme.js';
import { Spinner } from '../components/ui.jsx';

export default function Home() {
  const navigate = useNavigate();
  const therapiesRef = useRef(null);
  const [services, setServices] = useState(null);

  useEffect(() => {
    api.get('/services', { auth: false }).then((d) => setServices(d.services)).catch(() => setServices([]));
  }, []);

  const book = (serviceId) => navigate(serviceId ? `/book?service=${serviceId}` : '/book');
  const scrollTherapies = () => therapiesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="ah-fade">
      {/* Hero — centred copy with decorative rings */}
      <section className="ah-hero-section">
        <div className="ah-hero-rings" aria-hidden="true" />
        <div className="ah-hero-inner">
          <div style={{ fontSize: 12, letterSpacing: '.18em', color: c.gold, fontWeight: 700, marginBottom: 16 }}>
            NATUROPATHY · AYURVEDA · YOGA
          </div>
          <h1
            style={{
              fontFamily: font.serif,
              fontWeight: 500,
              fontSize: 'clamp(36px, 5vw, 52px)',
              lineHeight: 1.08,
              margin: '0 0 18px',
              color: c.charcoal,
            }}
          >
            Healing, the way nature intended.
          </h1>
          <p
            style={{
              fontSize: 15.5,
              color: c.bodyText,
              lineHeight: 1.65,
              maxWidth: 520,
              margin: '0 auto 28px',
            }}
          >
            A calm sanctuary in the heart of Gurugram. Book mud therapy, hydrotherapy, Ayurveda, yoga and clinical
            consultations — in a few taps, at real available times.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => book()} className="ah-btn-primary-lg">
              Book a session
            </button>
            <button type="button" onClick={scrollTherapies} className="ah-btn-outline-lg">
              Explore therapies
            </button>
          </div>

          <div className="ah-stats-bar">
            <Stat value="10+" label="therapies offered" />
            <Stat value="Honest" label="real-time capacity" divider />
            <Stat value="Free" label="cancel up to 12h" divider />
          </div>
        </div>
      </section>

      {/* Therapies grid */}
      <section ref={therapiesRef} id="services" style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 30px 20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 14,
            marginBottom: 22,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: 12, letterSpacing: '.14em', color: c.gold, fontWeight: 700, marginBottom: 6 }}>
              OUR THERAPIES
            </div>
            <h2 style={{ fontFamily: font.serif, fontWeight: 500, fontSize: 28, margin: 0, color: c.charcoal }}>
              Choose what your body needs
            </h2>
          </div>
          <div style={{ fontSize: 13, color: c.muted }}>Tap any therapy to book it directly.</div>
        </div>

        {!services ? (
          <Spinner center />
        ) : (
          <div className="ah-therapy-grid">
            {services.map((svc) => (
              <div
                key={svc._id}
                onClick={() => book(svc._id)}
                className="ah-card-hover ah-therapy-card"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && book(svc._id)}
              >
                <div className="ah-therapy-cat">{svc.category}</div>
                <div className="ah-therapy-name">{svc.name}</div>
                <div className="ah-therapy-blurb">{svc.blurb}</div>
                <div className="ah-therapy-footer">
                  <div className="ah-therapy-price">₹{rupees(svc.priceInPaise)}</div>
                  <div className="ah-therapy-book">{svc.durationMin} min · Book →</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ background: c.teal, color: '#EAF1EC', marginTop: 48, padding: '44px 0' }}>
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            padding: '0 30px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 30,
          }}
        >
          <Promise icon="◈" title="Honest capacity" body="Only two mud-bath tubs exist — so we only sell two. Every slot you see is genuinely free." />
          <Promise icon="✦" title="First-visit care" body="New here? Arrive ten minutes early for a gentle intake with our naturopath. We build the time in." />
          <Promise icon="◷" title="Free cancellation" body="Life happens. Cancel or reschedule free up to twelve hours before your session — no questions." />
        </div>
      </section>

      <footer
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '34px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: 12.5, color: c.muted, lineHeight: 1.7 }}>
          World Peace Centre, Sector 39
          <br />
          Gurugram, Haryana · India
          <br />
          care@ahimsawellnesscentre.com · +91 124 456 7890
        </div>
        <div style={{ fontSize: 12, color: c.mutedWarm, textAlign: 'right' }}>
          © 2026 Ahimsa Wellness Centre
          <br />
          Open daily · 7:00 AM – 8:00 PM
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label, divider }) {
  return (
    <div className={`ah-stat${divider ? ' ah-stat-divider' : ''}`}>
      <div className="ah-stat-value">{value}</div>
      <div className="ah-stat-label">{label}</div>
    </div>
  );
}

function Promise({ icon, title, body }) {
  return (
    <div>
      <div style={{ fontSize: 22, color: c.gold, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontFamily: font.serif, fontSize: 18, color: c.ivory, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#A9C4B7', lineHeight: 1.55 }}>{body}</div>
    </div>
  );
}
