import React from 'react';

export default function Footer({ usuarioAtual }) {
  return (
    <footer>
      <span className="footer-brand">Control-Pat</span>
      {usuarioAtual && (
        <span className="footer-user">{usuarioAtual}</span>
      )}
    </footer>
  );
}
