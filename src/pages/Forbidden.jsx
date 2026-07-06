import { useNavigate } from 'react-router-dom';
import { c } from '../theme.js';
import { EmptyState } from '../components/ui.jsx';
import { s } from '../theme.js';

export default function Forbidden({ module }) {
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 30px' }}>
      <EmptyState
        icon="⌀"
        title="This module isn't in your view"
        sub={`Your account doesn't have access to “${module}”. Ask an admin to enable it under Staff & permissions.`}
        action={<button onClick={() => navigate(-1)} style={s.btnPrimary}>Go back</button>}
      />
    </div>
  );
}
