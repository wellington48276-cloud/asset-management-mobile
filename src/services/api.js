export const URL_GOOGLE_SCRIPT = 'https://script.google.com/macros/s/AKfycbyVvq5D2-mr0JBTuHX2tBfPV7X-xFgjcBXQ7Uzjnf81biVUXhtnOPPz0mrvgbVPZe7m/exec';

const TIMEOUT = 120000;
const SESSION_KEY = 'patrimonio_api_session_v1';

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (!session?.token) return null;

    if (session.expiresAt && Number(session.expiresAt) <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

function saveSession(data) {
  if (!data?.token) return;

  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      token: data.token,
      usuario: data.usuario || '',
      nome: data.nome || '',
      expiresAt: Number(data.expiresAt || 0)
    })
  );
}

export function clearApiSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getApiSession() {
  return readSession();
}

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

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw Object.assign(new Error('Resposta inválida do servidor.'), { kind: 'server' });
    }

    if (data?.unauthorized) {
      clearApiSession();
      throw Object.assign(
        new Error(data.error || 'Sessão expirada. Entre novamente.'),
        { kind: 'unauthorized' }
      );
    }

    if (!response.ok) {
      throw Object.assign(
        new Error(data?.error || `Erro HTTP ${response.status}`),
        { kind: 'server' }
      );
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw Object.assign(new Error('Tempo de envio esgotado.'), { kind: 'timeout' });
    }

    if (error.kind) throw error;

    throw Object.assign(
      new Error(navigator.onLine ? 'Falha de conexão com o servidor.' : 'Sem conexão com a internet.'),
      { kind: navigator.onLine ? 'network' : 'offline' }
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function loginUsuario(usuario, senha) {
  if (!String(usuario).trim() || !senha) {
    return { success: false, error: 'Informe usuário e senha.', errorType: 'validation' };
  }

  try {
    const data = await post({
      action: 'login',
      usuario: String(usuario).trim(),
      senha: String(senha)
    });

    if (data?.success) {
      saveSession(data);
      return data;
    }

    return {
      success: false,
      error: data?.error || 'Credenciais inválidas.',
      errorType: 'server'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      errorType: error.kind || 'network'
    };
  }
}

export async function validarSessao() {
  const session = readSession();
  if (!session?.token) {
    return { success: false, unauthorized: true, error: 'Sessão não encontrada.' };
  }

  try {
    return await post({ action: 'validarSessao', token: session.token });
  } catch (error) {
    return {
      success: false,
      unauthorized: error.kind === 'unauthorized',
      error: error.message,
      errorType: error.kind || 'network'
    };
  }
}

export async function salvarServicoRua({ patrimoniador, chapa, pasta, fotoBase64 }) {
  const session = readSession();

  if (!session?.token) {
    return {
      success: false,
      error: 'Sessão expirada. Entre novamente antes de enviar a foto.',
      errorType: 'unauthorized',
      unauthorized: true
    };
  }

  try {
    const data = await post({
      action: 'salvarServicoRua',
      token: session.token,
      patrimoniador,
      chapa,
      pasta,
      fotoBase64
    });

    return data?.success
      ? data
      : {
          success: false,
          error: data?.error || 'O servidor não confirmou o salvamento.',
          errorType: data?.unauthorized ? 'unauthorized' : 'server',
          unauthorized: Boolean(data?.unauthorized)
        };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      errorType: error.kind || 'network',
      unauthorized: error.kind === 'unauthorized'
    };
  }
}
