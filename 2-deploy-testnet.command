#!/usr/bin/env zsh

clear
echo "========================================"
echo "  VORTEX PROTOCOL — Deploy Base Sepolia"
echo "========================================"
echo ""
cd "/Users/nathanaelestivalett/Documents/Claude/Projects/Vortex VTX"

WALLET="0x143053E772F202B4adB75D1f83b32E8C495b6A45"
echo "Carteira de deploy gerada (TESTNET ONLY):"
echo "  $WALLET"
echo ""
echo "PASSO 1 — Obtenha ETH gratis de testnet:"
echo ""
echo "  Opcao A (sem conta): https://faucet.quicknode.com/base/sepolia"
echo "  Opcao B (Alchemy):   https://www.alchemy.com/faucets/base-sepolia"
echo "  Opcao C (Bware):     https://bwarelabs.com/faucets/base-testnet"
echo ""
echo "Cole o endereco acima no faucet escolhido e clique em Send."
echo ""
echo -n "Pressione ENTER quando tiver recebido o ETH de testnet..."
read

echo ""
echo "Instalando dependencias npm..."
npm install 2>&1 | tail -5

echo ""
echo "Compilando contratos Solidity..."
npx hardhat compile

echo ""
echo "Fazendo deploy em Base Sepolia..."
npx hardhat run scripts/deploy.js --network base-sepolia

echo ""
echo "========================================="
echo "Deploy concluido! Enderecos dos contratos:"
echo "========================================="
cat deployments.json 2>/dev/null || echo "(arquivo deployments.json nao encontrado)"
echo ""
echo -n "Pressione ENTER para fechar..."
read
