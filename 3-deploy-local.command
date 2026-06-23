#!/usr/bin/env zsh

clear
echo "============================================"
echo "  VORTEX PROTOCOL — Deploy Local (Hardhat)"
echo "============================================"
echo ""

# Carregar profile para pegar npm/node no PATH
source ~/.zshrc 2>/dev/null || true
source ~/.zprofile 2>/dev/null || true
source ~/.profile 2>/dev/null || true

# Adicionar caminhos comuns do Node (Homebrew, NVM, etc)
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node/ 2>/dev/null | sort -V | tail -1)/bin:$PATH"

echo "Node: $(which node 2>/dev/null || echo 'NAO ENCONTRADO')"
echo "NPM:  $(which npm  2>/dev/null || echo 'NAO ENCONTRADO')"
echo ""

if ! command -v node &>/dev/null; then
  echo "ERRO: Node.js nao encontrado."
  echo "Instale em: https://nodejs.org (baixe a versao LTS)"
  echo -n "Pressione ENTER para fechar..."
  read
  exit 1
fi

cd "/Users/nathanaelestivalett/Documents/Claude/Projects/Vortex VTX"

echo "Limpando node_modules (fix assinatura macOS)..."
rm -rf node_modules package-lock.json
echo "Instalando dependencias (aguarde ~1 minuto)..."
npm install

echo ""
echo "Compilando contratos Solidity..."
npx hardhat compile

echo ""
echo "Fazendo deploy na rede Hardhat local..."
npx hardhat run scripts/deploy.js --network hardhat

echo ""
echo "============================================"
echo "Deploy local concluido!"
echo "============================================"
cat deployments.json 2>/dev/null || echo "(deployments.json nao gerado)"
echo ""
echo -n "Pressione ENTER para fechar..."
read
