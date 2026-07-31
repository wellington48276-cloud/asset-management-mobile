export default function Footer({ usuarioAtual }) {
  return <footer className="app-footer"><span>Patrimônio Bens Móveis</span>{usuarioAtual && <span className="footer-user">Operador: {usuarioAtual}</span>}</footer>;
}
