# Tubefix

YouTube do seu jeito, sem configurar nada.

## Funcionalidades

Em todo vídeo aberto:

- Cards, elementos da tela final e popups de produto escondidos
- Legendas desativadas, inclusive as automáticas
- Qualidade na mais alta disponível, reaplicada após anúncios
- Modo teatro ativado
- Descrição expandida

Sem popup, sem opções e sem permissões: só roda em `youtube.com`.

## Instalação

1. Baixe ou clone este repositório
2. Abra `chrome://extensions`
3. Ative o **Modo do desenvolvedor**
4. Clique em **Carregar sem compactação** e selecione a pasta do projeto

## Observações

- Shorts e vídeos incorporados em outros sites não são afetados
- A qualidade fica travada no máximo: em conexões instáveis, o vídeo pode bufferizar em vez de baixar a resolução
- O YouTube muda o layout com frequência. Os seletores ficam no topo do `main.js` e no `hide.css`

## Licença

[MIT](LICENSE)
