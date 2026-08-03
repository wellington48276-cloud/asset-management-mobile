const DRIVE_COMPARTILHADO_ID = '0AGmiIIIK6hwJUk9PVA';
const ABA_USUARIOS = 'Usuarios';
const ABA_SERVICOS = 'ServicosRua';
const SESSAO_MS = 8 * 60 * 60 * 1000;
const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 15 * 60 * 1000;

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = String(payload.action || '');

    if (action === 'login') return resposta_(login_(payload));
    if (action === 'validarSessao') return resposta_(validarSessaoResposta_(payload));
    if (action === 'logout') return resposta_(logout_(payload));
    if (action === 'salvarServicoRua') return resposta_(salvarServicoRua_(payload));

    return resposta_({ success: false, error: 'Ação inválida.' });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return resposta_({ success: false, error: 'Erro interno do servidor.' });
  }
}

function resposta_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function planilha_() {
  const configuredId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (configuredId) return SpreadsheetApp.openById(configuredId);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Defina SPREADSHEET_ID nas propriedades do script.');
  return active;
}

function normalize_(value) {
  return String(value == null ? '' : value).trim().toLowerCase();
}

function hex_(bytes) {
  return bytes.map(function (byte) {
    const value = byte < 0 ? byte + 256 : byte;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function digest_(value) {
  return hex_(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  ));
}

function hashSenha_(senha, salt) {
  return digest_(String(salt) + '|' + String(senha));
}

function safeEqual_(left, right) {
  left = String(left || '');
  right = String(right || '');
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function keyUsuario_(usuario) {
  return 'LOGIN_' + digest_(normalize_(usuario)).slice(0, 32);
}

function estadoTentativas_(usuario) {
  const raw = PropertiesService.getScriptProperties().getProperty(keyUsuario_(usuario));
  if (!raw) return { count: 0, blockedUntil: 0 };
  try { return JSON.parse(raw); } catch (error) { return { count: 0, blockedUntil: 0 }; }
}

function registrarFalha_(usuario) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const props = PropertiesService.getScriptProperties();
    const current = estadoTentativas_(usuario);
    const count = Number(current.count || 0) + 1;
    const blockedUntil = count >= MAX_TENTATIVAS ? Date.now() + BLOQUEIO_MS : 0;
    const next = { count: blockedUntil ? 0 : count, blockedUntil: blockedUntil };
    props.setProperty(keyUsuario_(usuario), JSON.stringify(next));
    return next;
  } finally {
    lock.releaseLock();
  }
}

function limparFalhas_(usuario) {
  PropertiesService.getScriptProperties().deleteProperty(keyUsuario_(usuario));
}

function usuariosInfo_() {
  const spreadsheet = planilha_();
  let sheet = spreadsheet.getSheetByName(ABA_USUARIOS);
  if (!sheet) throw new Error('A aba Usuarios não foi encontrada.');

  const lastColumn = Math.max(sheet.getLastColumn(), 3);
  const header = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(normalize_);

  function findColumn(names, fallback) {
    for (let index = 0; index < names.length; index += 1) {
      const position = header.indexOf(names[index]);
      if (position >= 0) return position + 1;
    }
    return fallback;
  }

  let saltColumn = findColumn(['salt', 'senha_salt'], 0);
  let hashColumn = findColumn(['senha_hash', 'hash'], 0);
  let currentLast = sheet.getLastColumn();

  if (!saltColumn) {
    saltColumn = ++currentLast;
    sheet.getRange(1, saltColumn).setValue('salt');
  }
  if (!hashColumn) {
    hashColumn = ++currentLast;
    sheet.getRange(1, hashColumn).setValue('senha_hash');
  }

  return {
    sheet: sheet,
    usuario: findColumn(['usuario', 'login', 'user'], 1),
    senha: findColumn(['senha', 'password'], 2),
    nome: findColumn(['nome', 'patrimoniador'], 3),
    ativo: findColumn(['ativo', 'status'], 4),
    salt: saltColumn,
    hash: hashColumn
  };
}

function usuarioAtivo_(value) {
  const normalized = normalize_(value);
  return !['false', '0', 'nao', 'não', 'inativo', 'bloqueado'].includes(normalized);
}

function localizarUsuario_(usuario) {
  const info = usuariosInfo_();
  const lastRow = info.sheet.getLastRow();
  if (lastRow < 2) return null;
  const values = info.sheet.getRange(2, 1, lastRow - 1, info.sheet.getLastColumn()).getValues();
  const target = normalize_(usuario);

  for (let index = 0; index < values.length; index += 1) {
    const row = values[index];
    if (normalize_(row[info.usuario - 1]) === target) {
      return { info: info, rowNumber: index + 2, row: row };
    }
  }
  return null;
}


function limparSessoesExpiradas_() {
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  Object.keys(all).forEach(function (key) {
    if (key.indexOf('SESSION_') !== 0) return;
    try {
      const session = JSON.parse(all[key]);
      if (Number(session.expiresAt || 0) <= Date.now()) props.deleteProperty(key);
    } catch (error) {
      props.deleteProperty(key);
    }
  });
}

function login_(payload) {
  limparSessoesExpiradas_();
  const usuario = normalize_(payload.usuario);
  const senha = String(payload.senha || '');
  if (!usuario || !senha) return { success: false, error: 'Informe usuário e senha.' };

  const attempts = estadoTentativas_(usuario);
  if (Number(attempts.blockedUntil || 0) > Date.now()) {
    return {
      success: false,
      error: 'Muitas tentativas. Aguarde alguns minutos.',
      blockedUntil: Number(attempts.blockedUntil)
    };
  }

  const found = localizarUsuario_(usuario);
  if (!found || !usuarioAtivo_(found.row[found.info.ativo - 1])) {
    const failed = registrarFalha_(usuario);
    return { success: false, error: 'Credenciais inválidas.', blockedUntil: failed.blockedUntil || 0 };
  }

  const plain = String(found.row[found.info.senha - 1] || '');
  const salt = String(found.row[found.info.salt - 1] || '');
  const storedHash = String(found.row[found.info.hash - 1] || '');
  const valid = storedHash
    ? safeEqual_(storedHash, hashSenha_(senha, salt))
    : safeEqual_(plain, senha);

  if (!valid) {
    const failed = registrarFalha_(usuario);
    return { success: false, error: 'Credenciais inválidas.', blockedUntil: failed.blockedUntil || 0 };
  }

  if (!storedHash) {
    const newSalt = Utilities.getUuid();
    found.info.sheet.getRange(found.rowNumber, found.info.salt).setValue(newSalt);
    found.info.sheet.getRange(found.rowNumber, found.info.hash).setValue(hashSenha_(senha, newSalt));
    found.info.sheet.getRange(found.rowNumber, found.info.senha).clearContent();
  }

  limparFalhas_(usuario);
  const nome = String(found.row[found.info.nome - 1] || usuario).trim();
  const token = Utilities.getUuid() + '.' + Utilities.getUuid();
  const expiresAt = Date.now() + SESSAO_MS;
  const session = { usuario: usuario, nome: nome, expiresAt: expiresAt };
  PropertiesService.getScriptProperties().setProperty('SESSION_' + digest_(token), JSON.stringify(session));

  return { success: true, token: token, usuario: usuario, nome: nome, expiresAt: expiresAt };
}

function validarToken_(token) {
  token = String(token || '');
  if (!token) return null;
  const props = PropertiesService.getScriptProperties();
  const key = 'SESSION_' + digest_(token);
  const raw = props.getProperty(key);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw);
    if (Number(session.expiresAt || 0) <= Date.now()) {
      props.deleteProperty(key);
      return null;
    }
    return session;
  } catch (error) {
    props.deleteProperty(key);
    return null;
  }
}

function validarSessaoResposta_(payload) {
  const session = validarToken_(payload.token);
  if (!session) return { success: false, unauthorized: true, error: 'Sessão expirada.' };
  return { success: true, usuario: session.usuario, nome: session.nome, expiresAt: session.expiresAt };
}

function logout_(payload) {
  const token = String(payload.token || '');
  if (token) PropertiesService.getScriptProperties().deleteProperty('SESSION_' + digest_(token));
  return { success: true };
}

function escapeQuery_(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function localizarPasta_(name) {
  const result = Drive.Files.list({
    q: "'" + DRIVE_COMPARTILHADO_ID + "' in parents and name = '" + escapeQuery_(name) + "' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
    corpora: 'drive',
    driveId: DRIVE_COMPARTILHADO_ID,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    pageSize: 10,
    fields: 'files(id,name)'
  });
  return result.files && result.files.length ? result.files[0] : null;
}

function obterOuCriarPasta_(name) {
  const existing = localizarPasta_(name);
  if (existing) return existing;
  return Drive.Files.create({
    name: name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [DRIVE_COMPARTILHADO_ID]
  }, null, {
    supportsAllDrives: true,
    fields: 'id,name'
  });
}

function localizarArquivos_(folderId, fileName) {
  const result = Drive.Files.list({
    q: "'" + folderId + "' in parents and name = '" + escapeQuery_(fileName) + "' and trashed = false",
    corpora: 'drive',
    driveId: DRIVE_COMPARTILHADO_ID,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    pageSize: 100,
    fields: 'files(id,name,modifiedTime)'
  });
  return result.files || [];
}

function servicosInfo_() {
  const spreadsheet = planilha_();
  let sheet = spreadsheet.getSheetByName(ABA_SERVICOS);
  const headers = [
    'request_id', 'data_hora', 'usuario', 'patrimoniador', 'chapa', 'pasta',
    'arquivo_id', 'arquivo_nome', 'pasta_id', 'link', 'tamanho', 'modified_time', 'status'
  ];
  if (!sheet) sheet = spreadsheet.insertSheet(ABA_SERVICOS);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return { sheet: sheet, headers: headers };
}

function localizarRegistro_(requestId) {
  const info = servicosInfo_();
  if (info.sheet.getLastRow() < 2) return null;
  const match = info.sheet.getRange(2, 1, info.sheet.getLastRow() - 1, 1)
    .createTextFinder(String(requestId))
    .matchEntireCell(true)
    .findNext();
  if (!match) return null;
  const row = info.sheet.getRange(match.getRow(), 1, 1, info.headers.length).getValues()[0];
  const object = {};
  info.headers.forEach(function (header, index) { object[header] = row[index]; });
  return object;
}

function salvarServicoRua_(payload) {
  const session = validarToken_(payload.token);
  if (!session) return { success: false, unauthorized: true, error: 'Sessão expirada.' };

  const requestId = String(payload.requestId || '').trim();
  const chapa = String(payload.chapa || '').replace(/\D/g, '');
  const pasta = String(payload.pasta || '').trim();
  const dataUrl = String(payload.fotoBase64 || '');

  if (!requestId || requestId.length > 180) return { success: false, error: 'Identificador do envio inválido.' };
  if (!/^\d+$/.test(chapa)) return { success: false, error: 'Chapa inválida.' };
  if (!/^\d+( a \d+)?$/.test(pasta)) return { success: false, error: 'Nome da pasta inválido.' };

  const previous = localizarRegistro_(requestId);
  if (previous && previous.status === 'SINCRONIZADO') {
    return {
      success: true,
      requestId: requestId,
      fileId: String(previous.arquivo_id),
      fileName: String(previous.arquivo_nome),
      folderId: String(previous.pasta_id),
      folderName: String(previous.pasta),
      webViewLink: String(previous.link || ''),
      size: String(previous.tamanho || ''),
      modifiedTime: String(previous.modified_time || '')
    };
  }

  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png));base64,(.+)$/);
  if (!match) return { success: false, error: 'Imagem inválida.' };

  const fileName = chapa + '.jpg';
  const bytes = Utilities.base64Decode(match[2]);
  const blob = Utilities.newBlob(bytes, 'image/jpeg', fileName);
  const folder = obterOuCriarPasta_(pasta);
  const matchingFiles = localizarArquivos_(folder.id, fileName);
  const existing = matchingFiles.length ? matchingFiles[0] : null;
  const options = {
    supportsAllDrives: true,
    fields: 'id,name,parents,size,webViewLink,modifiedTime,mimeType'
  };

  let file;
  if (existing) {
    file = Drive.Files.update({ name: fileName }, existing.id, blob, options);
  } else {
    file = Drive.Files.create({ name: fileName, mimeType: 'image/jpeg', parents: [folder.id] }, blob, options);
  }

  const confirmed = Drive.Files.get(file.id, {
    supportsAllDrives: true,
    fields: 'id,name,parents,size,webViewLink,modifiedTime,mimeType'
  });

  if (confirmed.name !== fileName || !confirmed.parents || confirmed.parents.indexOf(folder.id) < 0) {
    return { success: false, error: 'O arquivo foi enviado, mas a confirmação do Drive não corresponde ao destino solicitado.' };
  }

  matchingFiles.forEach(function (duplicate) {
    if (duplicate.id === confirmed.id) return;
    Drive.Files.update({ trashed: true }, duplicate.id, null, { supportsAllDrives: true, fields: 'id,trashed' });
  });

  const info = servicosInfo_();
  info.sheet.appendRow([
    requestId,
    new Date(),
    session.usuario,
    session.nome,
    chapa,
    pasta,
    confirmed.id,
    confirmed.name,
    folder.id,
    confirmed.webViewLink || '',
    confirmed.size || '',
    confirmed.modifiedTime || '',
    'SINCRONIZADO'
  ]);

  return {
    success: true,
    requestId: requestId,
    fileId: confirmed.id,
    fileName: confirmed.name,
    folderId: folder.id,
    folderName: folder.name,
    webViewLink: confirmed.webViewLink || '',
    size: confirmed.size || '',
    modifiedTime: confirmed.modifiedTime || ''
  };
}

/**
 * Execute uma única vez pelo editor do Apps Script para converter senhas em texto
 * para SHA-256 com salt individual. A coluna antiga de senha será limpa.
 */
function migrarSenhasParaHash() {
  const info = usuariosInfo_();
  const lastRow = info.sheet.getLastRow();
  if (lastRow < 2) return;

  const range = info.sheet.getRange(2, 1, lastRow - 1, info.sheet.getLastColumn());
  const values = range.getValues();

  values.forEach(function (row, index) {
    const plain = String(row[info.senha - 1] || '');
    const currentHash = String(row[info.hash - 1] || '');
    if (!plain || currentHash) return;
    const salt = Utilities.getUuid();
    info.sheet.getRange(index + 2, info.salt).setValue(salt);
    info.sheet.getRange(index + 2, info.hash).setValue(hashSenha_(plain, salt));
    info.sheet.getRange(index + 2, info.senha).clearContent();
  });
}

/** Execute uma vez para criar/validar as abas e autorizar Drive/Planilhas. */
function prepararSistema() {
  usuariosInfo_();
  servicosInfo_();
  Drive.Drives.get(DRIVE_COMPARTILHADO_ID);
  console.log('Sistema preparado.');
}
