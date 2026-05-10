import React from 'react';

// =============================================================
// <ControlsHelp> — fiche modale des contrôles PC + Mobile
// Accessible depuis le menu universel (≡ MENU → ⌨ Touches & contrôles).
// =============================================================
const Row = ({ keys, label }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '8px 4px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  }}>
    <div style={{ display: 'flex', gap: 4, minWidth: 130 }}>
      {keys.map((k, i) => (
        <span key={i} style={{
          padding: '4px 10px', borderRadius: 6,
          background: 'rgba(212,175,55,0.18)',
          border: '1px solid rgba(212,175,55,0.5)',
          color: '#ffd700', fontWeight: 800, fontSize: 12,
          minWidth: 22, textAlign: 'center', fontFamily: 'monospace',
        }}>{k}</span>
      ))}
    </div>
    <div style={{ color: '#e8e8ea', fontSize: 13 }}>{label}</div>
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{
      fontSize: 11, color: '#cca366', letterSpacing: 1.5,
      textTransform: 'uppercase', marginBottom: 6,
      borderBottom: '1px solid rgba(212,175,55,0.3)', paddingBottom: 4,
    }}>{title}</div>
    {children}
  </div>
);

export const ControlsHelp = ({ onClose }) => (
  <div
    data-testid="controls-help-modal"
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: 'Georgia, serif',
    }}
  >
    <div onClick={(e) => e.stopPropagation()} style={{
      maxWidth: 680, width: '100%', maxHeight: '92vh', overflowY: 'auto',
      background: 'linear-gradient(160deg, #15121e, #0a0810)',
      border: '2px solid #d4af37', borderRadius: 16,
      padding: 20, color: '#fff',
      boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(212,175,55,0.15)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14,
      }}>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 1.5, color: '#ffd700' }}>
          ⌨ TOUCHES & CONTRÔLES
        </div>
        <button onClick={onClose} style={{
          padding: '6px 14px', borderRadius: 8,
          background: 'transparent', border: '1px solid #d4af37', color: '#d4af37',
          cursor: 'pointer', fontWeight: 800, fontFamily: 'inherit',
        }}>✕ FERMER</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* COLONNE PC */}
        <div>
          <Section title="🖥️ PC — Déplacement">
            <Row keys={['Z']} label="Avancer" />
            <Row keys={['Q']} label="Aller à gauche" />
            <Row keys={['S']} label="Reculer" />
            <Row keys={['D']} label="Aller à droite" />
            <Row keys={['↑','↓','←','→']} label="Alternative aux ZQSD" />
            <Row keys={['Souris']} label="Regarder (yaw + pitch)" />
            <Row keys={['Clic']} label="Verrouille la souris" />
          </Section>

          <Section title="🎯 Combat">
            <Row keys={['Clic D','R','Tab']} label="Sortir / ranger l'arme" />
            <Row keys={['Clic G','F','Esp.']} label="Tirer" />
          </Section>
        </div>

        {/* COLONNE Interactions + Mobile */}
        <div>
          <Section title="💡 Interactions">
            <Row keys={['E']} label="Entrer / parler / interagir" />
            <Row keys={['Esp.']} label="Alternative à E (zones casino)" />
            <Row keys={['Échap']} label="Libérer la souris" />
          </Section>

          <Section title="📱 Mobile / Tablette">
            <Row keys={['◀▶']} label="Joystick virtuel (D-pad)" />
            <Row keys={['1 doigt']} label="Glisser pour tourner la tête" />
            <Row keys={['Bouton TIRER']} label="Sortir l'arme + tirer" />
            <Row keys={['Bouton E']} label="Bouton d'interaction à l'écran" />
          </Section>

          <Section title="🎰 Casino">
            <Row keys={['≡']} label="Menu universel (haut droite)" />
            <Row keys={['🚪']} label="Sortir → retour rue" />
          </Section>
        </div>
      </div>

      <div style={{
        marginTop: 16, padding: 10,
        background: 'rgba(212,175,55,0.08)',
        border: '1px solid rgba(212,175,55,0.25)',
        borderRadius: 8,
        fontSize: 11, color: '#cca366', textAlign: 'center', fontStyle: 'italic',
      }}>
        Astuce : tu peux re-ouvrir cette fiche à tout moment depuis ≡ MENU → ⌨ Touches.
      </div>
    </div>
  </div>
);

export default ControlsHelp;
