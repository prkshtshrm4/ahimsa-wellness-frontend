import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, openPdf } from '../api.js';
import { c, font, s, rupees } from '../theme.js';
import { Spinner, Logo, Toast } from '../components/ui.jsx';

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.get(`/invoices/${id}`).then(setInvoice).catch((e) => setToast(e.message));
  }, [id]);

  async function email() {
    try {
      await api.post(`/invoices/${id}/email`);
      setToast('A copy is on its way to your email.');
    } catch (e) {
      setToast(e.message);
    }
  }

  if (!invoice) return <Spinner center />;

  const issued = new Date(invoice.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '34px 30px 80px' }} className="ah-fade">
      {toast && <Toast onClose={() => setToast(null)}>{toast}</Toast>}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
        <button onClick={() => navigate('/dashboard')} style={{ ...s.btnGhost, fontSize: 13 }}>← Back</button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={email} style={{ ...s.btnGhost, fontSize: 13 }}>Email a copy</button>
          <button onClick={() => openPdf(`/invoices/${id}/pdf`)} style={{ ...s.btnPrimary, fontSize: 13, padding: '11px 16px' }}>Download PDF ↓</button>
        </div>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: 14, padding: '40px 44px', boxShadow: '0 10px 40px rgba(28,75,67,.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 26, borderBottom: `1px solid ${c.borderSoft}` }}>
          <Logo size={52} showWord sub="WELLNESS CENTRE · GURUGRAM" />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: font.serif, fontSize: 24 }}>Invoice</div>
            <div style={{ fontSize: 12, color: c.muted, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{invoice.invoiceNumber}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 30, padding: '24px 0' }}>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: '.14em', color: c.mutedWarm, fontWeight: 700, marginBottom: 7 }}>BILLED TO</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{invoice.billedTo?.name}</div>
            {invoice.billedTo?.phone && <div style={{ fontSize: 13, color: c.muted, marginTop: 2 }}>{invoice.billedTo.phone}</div>}
            {invoice.billedTo?.email && <div style={{ fontSize: 13, color: c.muted }}>{invoice.billedTo.email}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10.5, letterSpacing: '.14em', color: c.mutedWarm, fontWeight: 700, marginBottom: 7 }}>ISSUED</div>
            <div style={{ fontSize: 14 }}>{issued}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 999, marginTop: 10, color: invoice.status === 'paid' ? c.teal : c.amberText, background: invoice.status === 'paid' ? c.greenSoft : c.amberBg, border: `1px solid ${invoice.status === 'paid' ? c.greenBorder : c.amberBorder}` }}>
              ● {invoice.status === 'paid' ? 'PAID' : 'DUE'}
            </div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6 }}>
          <thead>
            <tr style={{ borderBottom: `1.5px solid ${c.border}` }}>
              <th style={{ textAlign: 'left', fontSize: 10.5, letterSpacing: '.1em', color: c.mutedWarm, fontWeight: 700, padding: '8px 0' }}>SERVICE</th>
              <th style={{ textAlign: 'left', fontSize: 10.5, letterSpacing: '.1em', color: c.mutedWarm, fontWeight: 700, padding: '8px 0' }}>DATE</th>
              <th style={{ textAlign: 'right', fontSize: 10.5, letterSpacing: '.1em', color: c.mutedWarm, fontWeight: 700, padding: '8px 0' }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((it, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F5F0E6' }}>
                <td style={{ padding: '14px 0', fontSize: 14 }}>{it.description}</td>
                <td style={{ padding: '14px 0', fontSize: 13, color: c.muted }}>{fmtDate(it.date)}</td>
                <td style={{ padding: '14px 0', fontSize: 14, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>₹{rupees(it.amountInPaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <div style={{ width: 240 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: c.muted, padding: '5px 0' }}>
              <span>Subtotal</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>₹{rupees(invoice.subtotalInPaise)}</span>
            </div>
            {invoice.discountInPaise > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: c.muted, padding: '5px 0' }}>
                <span>Discount</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>− ₹{rupees(invoice.discountInPaise)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `1.5px solid ${c.border}`, marginTop: 8, paddingTop: 12 }}>
              <span style={{ fontWeight: 600 }}>{invoice.status === 'paid' ? 'Total paid' : 'Total due'}</span>
              <span style={{ fontFamily: font.serif, fontSize: 24, color: c.teal, fontVariantNumeric: 'tabular-nums' }}>₹{rupees(invoice.totalInPaise)}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 34, paddingTop: 22, borderTop: `1px solid ${c.borderSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
          <div style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: 14.5, color: c.greenText, maxWidth: 340, lineHeight: 1.5 }}>
            Thank you for letting us care for you. May you leave lighter than you came.
          </div>
          <div style={{ fontSize: 11, color: c.mutedWarm, textAlign: 'right', lineHeight: 1.6 }}>
            World Peace Centre, Sector 39<br />Gurugram, Haryana · India<br />care@ahimsawellnesscentre.com
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
