export default function Footer({ usuarioAtual }) {
  return (
    <footer className="app-footer">
      <span>SETOR GESTÃO DE PATRIMÔNIO BENS MÓVEIS</span>
      {usuarioAtual && (
        <span className="footer-user">OPERADOR: {usuarioAtual}</span>
      )}
    </footer>
  );
}
