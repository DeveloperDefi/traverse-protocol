#!/usr/bin/env zsh

clear
echo "========================================"
echo "  VORTEX PROTOCOL — Publicar no GitHub"
echo "========================================"
echo ""
cd "/Users/nathanaelestivalett/Documents/Claude/Projects/Vortex VTX"

echo -n "PASSO 1 — Seu username do GitHub: "
read github_user

git remote remove origin 2>/dev/null
git remote add origin "https://github.com/$github_user/vortex-protocol.git"

echo ""
echo "PASSO 2 — Crie o repositorio em:"
echo "  https://github.com/new"
echo ""
echo "  Nome: vortex-protocol"
echo "  Visibilidade: Public"
echo "  NAO marque 'Add README'"
echo ""
echo -n "Pressione ENTER quando o repo estiver criado no GitHub..."
read

echo ""
echo "Fazendo push... (quando pedir senha, use um Personal Access Token)"
echo "Gere um token em: https://github.com/settings/tokens/new (marcar 'repo')"
echo ""
git push -u origin main

echo ""
echo "========================================="
echo "Publicado! Acesse:"
echo "https://github.com/$github_user/vortex-protocol"
echo "========================================="
echo -n "Pressione ENTER para fechar..."
read
