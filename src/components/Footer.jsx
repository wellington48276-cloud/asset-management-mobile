export default function Footer({ usuarioAtual }) {
  return <footer className="app-footer"><span>Sistema de Gestão Patrimonial</span>{usuarioAtual && <span className="footer-user">Operador: {usuarioAtual}</span>}</footer>;
}
