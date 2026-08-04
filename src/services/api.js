import { blobToDataUrl } from '../utils/image';

export const URL_GOOGLE_SCRIPT = 'https://script.google.com/macros/s/AKfycbyVvq5D2-mr0JBTuHX2tBfPV7X-xFgjcBXQ7Uzjnf81biVUXhtnOPPz0mrvgbVPZe7m/exec';
const TIMEOUT = 45_000;

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
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Resposta inválida do servidor.');
    }
  } finally {
    clearTimeout(timer);
  }
}

function connectionError(error, fallback) {
  if (error?.name === 'AbortError') return 'Tempo de conexão esgotado.';
  return fallback;
}

export async function loginUsuario(usuario, senha) {
  if (!String(usuario).trim() || !senha) return { success: false, error: 'Informe usuário e senha.' };

  try {
    const data = await post({ action: 'login', usuario: String(usuario).trim(), senha: String(senha) });
    if (data?.success && data?.token && Number(data?.expiresAt) > Date.now()) return data;
    if (data?.success) {
      return { success: false, error: 'O Google Apps Script precisa ser atualizado para a nova versão segura.' };
    }
    return { success: false, error: data?.error || 'Credenciais inválidas.', blockedUntil: data?.blockedUntil };
  } catch (error) {
    return { success: false, error: connectionError(error, 'Não foi possível validar o acesso.') };
  }
}

export async function validarSessao(token) {
  if (!token) return { success: false, unauthorized: true };
  try {
    const data = await post({ action: 'validarSessao', token });
    return data?.success ? data : { success: false, unauthorized: true, error: data?.error || 'Sessão expirada.' };
  } catch (error) {
    return { success: false, offline: true, error: connectionError(error, 'Não foi possível validar a sessão.') };
  }
}

export async function logoutUsuario(token) {
  if (!token) return { success: true };
  try {
    return await post({ action: 'logout', token });
  } catch {
    return { success: true };
  }
}

export async function salvarServicoRua({ token, requestId, chapa, pasta, fotoBlob }) {
  try {
    const fotoBase64 = await blobToDataUrl(fotoBlob);
    const data = await post({
      action: 'salvarServicoRua',
      token,
      requestId,
      chapa,
      pasta,
      fotoBase64
    });

    if (!data?.success) {
      return {
        success: false,
        unauthorized: Boolean(data?.unauthorized),
        error: data?.error || 'O servidor não confirmou o salvamento.'
      };
    }

    const expectedName = `${chapa}.jpg`;
    if (data.fileName !== expectedName || data.folderName !== pasta || !data.fileId) {
      return { success: false, error: 'O Drive respondeu com dados diferentes do serviço solicitado.' };
    }

    return data;
  } catch (error) {
    return { success: false, error: connectionError(error, 'Sem conexão. A foto continua salva no aparelho.') };
  }
}
