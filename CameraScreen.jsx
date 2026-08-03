export const URL_GOOGLE_SCRIPT = 'https://script.google.com/macros/s/AKfycbyVvq5D2-mr0JBTuHX2tBfPV7X-xFgjcBXQ7Uzjnf81biVUXhtnOPPz0mrvgbVPZe7m/exec';
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
    try { return JSON.parse(text); } catch { throw new Error('Resposta inválida do servidor.'); }
  } finally {
    clearTimeout(timer);
  }
}

export async function loginUsuario(usuario, senha) {
  if (!String(usuario).trim() || !senha) return { success: false, error: 'Informe usuário e senha.' };
  try {
    const data = await post({ action: 'login', usuario: String(usuario).trim(), senha: String(senha) });
    return data?.success ? data : { success: false, error: data?.error || 'Credenciais inválidas.' };
  } catch (error) {
    return { success: false, error: error.name === 'AbortError' ? 'Tempo de conexão esgotado.' : 'Não foi possível validar o acesso.' };
  }
}

export async function salvarServicoRua({ patrimoniador, chapa, pasta, fotoBase64 }) {
  try {
    const data = await post({ action: 'salvarServicoRua', patrimoniador, chapa, pasta, fotoBase64 });
    return data?.success ? data : { success: false, error: data?.error || 'O servidor não confirmou o salvamento.' };
  } catch (error) {
    return { success: false, error: error.name === 'AbortError' ? 'Tempo de envio esgotado.' : 'Sem conexão. O registro foi mantido no aparelho.' };
  }
}
