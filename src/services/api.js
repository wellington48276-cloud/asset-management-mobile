export const URL_GOOGLE_SCRIPT = "https://script.google.com/macros/s/AKfycbyVvq5D2-mr0JBTuHX2tBfPV7X-xFgjcBXQ7Uzjnf81biVUXhtnOPPz0mrvgbVPZe7m/exec";
const TIMEOUT = 25000;

async function post(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const response = await fetch(URL_GOOGLE_SCRIPT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
    const text = await response.text();
    try { return JSON.parse(text); }
    catch { throw new Error('Resposta inválida do servidor.'); }
  } finally { clearTimeout(timer); }
}

export async function loginUsuario(user, pass) {
  if (!String(user).trim() || !pass) return { success: false, error: 'Informe usuário e senha.' };
  try {
    const data = await post({ action: 'login', usuario: String(user).trim(), senha: String(pass) });
    return data?.success ? data : { success: false, error: data?.error || 'Credenciais inválidas.' };
  } catch (error) {
    return { success: false, error: error.name === 'AbortError' ? 'Tempo de conexão esgotado.' : 'Não foi possível validar o acesso.' };
  }
}

export async function salvarColetaData(operador, chapa, fotoBase64) {
  try {
    const data = await post({ action: 'salvarColeta', vistoriador: operador, chapa, fotoBase64 });
    return data?.success ? data : { success: false, error: data?.error || 'Servidor não confirmou o envio.' };
  } catch (error) {
    return { success: false, error: error.name === 'AbortError' ? 'Tempo de envio esgotado.' : 'Sem conexão. Registro mantido no aparelho.' };
  }
}
