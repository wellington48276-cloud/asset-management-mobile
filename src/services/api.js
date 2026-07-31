export const URL_GOOGLE_SCRIPT = "https://script.google.com/macros/s/AKfycbyVvq5D2-mr0JBTuHX2tBfPV7X-xFgjcBXQ7Uzjnf81biVUXhtnOPPz0mrvgbVPZe7m/exec";

export async function loginUsuario(user, pass) {
  if (URL_GOOGLE_SCRIPT && !URL_GOOGLE_SCRIPT.includes("SEU_LINK")) {
    try {
      const response = await fetch(URL_GOOGLE_SCRIPT, {
        method: "POST",
        body: JSON.stringify({ action: "login", usuario: user, senha: pass })
      });
      const res = await response.json();
      return res;
    } catch (err) {
      console.warn("Comunicação com servidor remota indisponível, utilizando fallback local:", err);
      return { success: true, nome: user };
    }
  }
  return { success: true, nome: user };
}

export async function salvarColetaData(vistoriador, chapa, fotoBase64) {
  if (URL_GOOGLE_SCRIPT && !URL_GOOGLE_SCRIPT.includes("SEU_LINK")) {
    try {
      const response = await fetch(URL_GOOGLE_SCRIPT, {
        method: "POST",
        body: JSON.stringify({
          action: "salvarColeta",
          vistoriador,
          chapa,
          fotoBase64
        })
      });
      return await response.json();
    } catch (e) {
      console.error("Erro no envio:", e);
      return { success: false, error: e.message };
    }
  }
  return { success: true };
}
