#!/bin/bash
cd "$(dirname "$0")"
git add -A
git commit -m "chore: rename Vortex Protocol → Traverse Protocol, VTX → TRV

- Renamed all 8 contracts: Vortex* → Traverse*, VTX.sol → TRV.sol
- Updated all references in scripts, frontend, docs, community content
- Token ticker VTX → TRV throughout
- Package name: vortex-vtx → traverse-trv"
git push origin main
echo ""
echo "✅ Rename pushed to GitHub!"
