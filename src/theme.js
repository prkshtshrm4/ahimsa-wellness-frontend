// Palette read from the AHIMSA mark. Kept in one place so screens stay coherent.
export const c = {
  teal: '#1B3C35',
  sage: '#7FA88F',
  gold: '#B89355',
  charcoal: '#1A1F2B',
  ivory: '#FDFBF7',
  card: '#FFFFFF',
  cardTint: '#FCFAF5',
  border: '#ECE6DA',
  borderSoft: '#F1ECE1',
  line: '#E2DBCC',
  muted: '#8C9490',
  mutedWarm: '#A9A192',
  bodyText: '#5B615E',
  greenSoft: '#EDF3EE',
  greenBorder: '#CFE2D5',
  greenText: '#5E8B72',
  navActive: '#E8EEF3',
  amberBg: '#FCF6E4',
  amberBorder: '#EBD9A2',
  amberText: '#8A7420',
  dangerText: '#A8543A',
  dangerBorder: '#E8D3C9',
};

export const font = {
  serif: "'Newsreader', Georgia, serif",
  sans: "'Public Sans', system-ui, sans-serif",
};

// Small reusable style fragments.
export const s = {
  page: { maxWidth: 1120, margin: '0 auto', padding: '34px 30px 80px', width: '100%' },
  h1: { fontFamily: font.serif, fontWeight: 500, fontSize: 30, margin: 0, lineHeight: 1.1 },
  eyebrow: { fontSize: 12, letterSpacing: '.14em', color: c.gold, fontWeight: 700 },
  sectionLabel: { fontSize: 11, letterSpacing: '.14em', fontWeight: 700, color: '#9AA29C' },
  cardBox: { background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, padding: 20 },
  input: {
    display: 'block',
    width: '100%',
    padding: '11px 12px',
    border: `1px solid ${c.line}`,
    borderRadius: 9,
    fontSize: 14,
    background: c.cardTint,
    color: c.charcoal,
    marginTop: 6,
    boxSizing: 'border-box',
  },
  label: { fontSize: 12, fontWeight: 600, color: '#59615f' },
  btnPrimary: {
    padding: '12px 22px',
    borderRadius: 10,
    border: 'none',
    background: c.teal,
    color: c.ivory,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
  btnGhost: {
    padding: '11px 18px',
    borderRadius: 10,
    border: `1px solid ${c.line}`,
    background: c.card,
    color: c.charcoal,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
};

export function rupees(paise) {
  if (paise == null) return '—';
  return (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
