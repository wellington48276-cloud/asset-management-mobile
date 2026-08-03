# Patrimônio Bens Móveis — v1.1.0

Esta versão reúne as melhorias de estabilidade, trabalho offline, segurança e conferência do Google Drive.

## O que foi implementado

- layout mobile refeito sem regras CSS duplicadas;
- versão fixa no canto inferior direito;
- login visível em telas pequenas e modo paisagem;
- histórico aberto somente pelo botão de três pontos e com título centralizado;
- retomada de serviço interrompido;
- fotos temporárias e fila offline no IndexedDB;
- sincronização automática ao recuperar a internet, ao reabrir a aba e a cada minuto;
- confirmação do nome da pasta, nome do arquivo, ID, link, tamanho e data do arquivo no Drive;
- redução automática das fotos para no máximo 2400 pixels no maior lado, JPEG 90%;
- voltar, pular temporariamente, editar chapa, cancelar, refazer e revisar todas as fotos;
- sessão com token e validade de oito horas;
- bloqueio por quinze minutos depois de cinco tentativas de login incorretas;
- senhas com SHA-256 e salt individual no Apps Script;
- versão centralizada em `src/config.js`;
- testes automáticos e fluxo de validação no GitHub Actions.

## Substituição do projeto

1. Faça uma cópia de segurança do projeto atual.
2. Extraia o ZIP.
3. Substitua o conteúdo atual do repositório pelo conteúdo da pasta extraída.
4. Não crie uma pasta duplicada, como `src/src`.
5. Publique normalmente na Vercel.

## Atualização obrigatória do Google Apps Script

A nova interface exige o novo `Code.gs`, pois o login passa a usar token de sessão.

1. Abra o projeto atual do Google Apps Script.
2. Faça uma cópia do código antigo.
3. Substitua todo o conteúdo de `Code.gs` pelo arquivo `Code.gs` deste pacote.
4. Confirme que o serviço avançado **Drive API** continua ativado.
5. Selecione a função `prepararSistema` e execute uma vez. Autorize quando o Google solicitar.
6. Abra **Implantar → Gerenciar implantações → Editar**.
7. Escolha **Nova versão** e clique em **Implantar**.

A URL atual do Apps Script já está configurada em `src/services/api.js`. Se a implantação gerar outra URL, substitua somente a constante `URL_GOOGLE_SCRIPT`.

## Senhas existentes

O sistema converte automaticamente a senha antiga para hash seguro no primeiro login de cada usuário e limpa a senha em texto da planilha.

Também existe a função opcional `migrarSenhasParaHash`. Execute-a somente depois de criar uma cópia de segurança da aba `Usuarios`.

A aba `Usuarios` pode continuar com as colunas iniciais:

```text
usuario | senha | nome | ativo
```

As colunas `salt` e `senha_hash` são criadas automaticamente.

## Validação realizada

Foram executados sete testes locais, verificação dos imports relativos, sintaxe dos arquivos JavaScript sem JSX e validações estáticas do projeto. O build do Vite não pôde ser executado neste ambiente porque o registro npm disponível não forneceu todos os pacotes do lockfile; o GitHub Actions incluído executará `npm ci`, testes e build no repositório.
