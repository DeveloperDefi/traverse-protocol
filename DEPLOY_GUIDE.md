# Traverse Protocol — Guia de Publicação

## 1. GitHub — Publicar o código

### Passo 1: Criar o repositório no GitHub
1. Acesse https://github.com/new
2. Preencha:
   - **Repository name:** `traverse-protocol`
   - **Description:** `Cross-chain liquidity routing protocol with intent-based execution and solver auctions`
   - **Visibility:** Public ✅
   - **NÃO** marque "Initialize this repository with a README" (já temos um)
3. Clique em **Create repository**

### Passo 2: Push do código (Terminal)

Abra o Terminal, navegue até a pasta do projeto e rode:

```bash
cd "/Users/nathanaelestivalett/Documents/Claude/Projects/Traverse TRV"

# Substitua SEU_USUARIO pelo seu username do GitHub
git remote add origin https://github.com/SEU_USUARIO/traverse-protocol.git
git push -u origin main
```

Será pedido seu username e password (use um **Personal Access Token** como password):
- Crie em: https://github.com/settings/tokens/new
- Permissões necessárias: `repo` (Full control)

Pronto — seu repo estará em: `https://github.com/SEU_USUARIO/traverse-protocol`

---

## 2. Testnet Deploy — Base Sepolia

### Pré-requisitos

#### A) Instalar dependências do projeto
```bash
cd "/Users/nathanaelestivalett/Documents/Claude/Projects/Traverse TRV"
npm install
```

#### B) Criar carteira de deploy (se não tiver uma)
Você pode usar MetaMask para pegar sua chave privada:
- MetaMask → Account Details → Export Private Key

#### C) Obter ETH de Testnet (gratuito)
- Base Sepolia Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- Ou: https://faucet.quicknode.com/base/sepolia

#### D) Obter URL de RPC (gratuito)
- Crie conta em: https://alchemy.com
- Crie um app → Network: Base Sepolia → Copie a URL

#### E) Configurar .env
```bash
cd "/Users/nathanaelestivalett/Documents/Claude/Projects/Traverse TRV"
cp .env.example .env
# Abra o .env e preencha:
# PRIVATE_KEY=sua_chave_sem_0x
# BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/SUA_KEY
```

### Deploy
```bash
npm run compile
npm run deploy:base-sepolia
```

Após o deploy, o script salva os endereços em `deployments.json`. Copie esses endereços e adicione ao README.

### Verificar contratos (opcional mas recomendado)
```bash
# Obtenha API key em: https://basescan.org (grátis)
# Adicione BASESCAN_API_KEY no .env

npx hardhat verify --network base-sepolia ENDERECO_DO_VTX
```

---

## 3. Whitepaper Online

Os PDFs já estão na pasta `docs/`:
- `docs/Traverse_Whitepaper_v1.0.pdf`
- `docs/Traverse_Tokenomics_VTX.pdf`

Após o push para o GitHub, eles ficam acessíveis em:
```
https://github.com/SEU_USUARIO/traverse-protocol/blob/main/docs/Traverse_Whitepaper_v1.0.pdf
```

### Para um link de download direto:
```
https://raw.githubusercontent.com/SEU_USUARIO/traverse-protocol/main/docs/Traverse_Whitepaper_v1.0.pdf
```

---

## 4. Próximos Passos Recomendados

| Prioridade | Ação |
|---|---|
| 🔴 Alta | Contratar auditoria antes de qualquer mainnet |
| 🔴 Alta | Configurar Safe Multisig (safe.global) para tesouro |
| 🟡 Média | Criar Twitter/X @TRVprotocol e anunciar testnet |
| 🟡 Média | Publicar em fóruns: ETHResearch, DeFiLlama, Mirror |
| 🟢 Normal | Criar site traverseprotocol.io |
| 🟢 Normal | Configurar bug bounty no Immunefi |
