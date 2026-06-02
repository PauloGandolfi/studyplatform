# ⚡ Quick Reference Card - Mestre Sidebar

## 🚀 Comece Aqui em 60 Segundos

```bash
# Terminal 1: Frontend
cd frontend && npm run dev
# Acesse: http://localhost:5173

# Terminal 2: Backend
cd backend && ./mvnw spring-boot:run
# Aguarde iniciar em http://localhost:8080
```

---

## 🎯 Verificações Críticas (Faça AGORA)

### ✅ 1. NavBar (Sidebar esquerdo)

```
Deve ter EXATAMENTE 9 items (NO "Professor"):
✓ Dashboard    ✓ Missões      ✓ Assuntos
✓ Anotações    ✓ Flashcards   ✓ Revisoes
✓ Estatisticas ✓ Perfil       ✓ Configuracoes
```

### ✅ 2. Header (Topo)

```
Procure por: [🔍] [✨Mestre] [👤] [Sair]
           Botão "Mestre" com ícone spark
```

### ✅ 3. Clicar "Mestre"

```
Expected: Sidebar desliza da direita ✓
          Layout muda para 3 colunas (desktop) ✓
```

---

## 🧪 6 Testes Essenciais

### Test 1: Chat Básico

```
Input: "Qual é a capital da França?"
Expected: Resposta do Gemini aparece
```

### Test 2: Criar Assunto

```
Input: "Crie assunto Python"
Expected: Assunto criado, feedback no chat
```

### Test 3: Abrir Context Panel

```
Action: Clique paperclip (📎)
Expected: Panel abre com selector e textarea
```

### Test 4: Gerar Flashcards

```
1. Colar conteúdo
2. Digitar "Gere flashcards"
3. Expected: Cards inline com checkboxes
```

### Test 5: Salvar Flashcards

```
1. Selecionar cards
2. Clique "Salvar"
3. Expected: POST /flashcards, feedback "salvos!"
```

### Test 6: Responsividade

```
Desktop (>900px):   3 colunas visíveis ✓
Mobile (<900px):    Drawer overlay ✓
```

---

## 🎨 Layout Visual Rápido

### Desktop (Com Mestre Aberto)

```
┌─────────────┬──────────────┬────────────┐
│  SideBar    │ Main Content │   Mestre   │
│  (278px)    │   (flex)     │  (380px)   │
└─────────────┴──────────────┴────────────┘
```

### Mobile (Com Mestre Aberto)

```
┌──────────────────────┐
│ Main Content         │
│  (com Mestre drawer) │
│  deslizando pela     │
│  direita            │
└──────────────────────┘
```

---

## 📡 Endpoints Utilizados

```
GET   /subjects              (carregar lista)
POST  /subjects              (criar assunto)
POST  /ai/chat               (chat genérico)
POST  /ai/flashcards/generate (gerar flashcards)
POST  /flashcards            (salvar flashcards)
```

---

## 🎛️ Estados Importante

### Mestre State:

```
isMestreOpen: boolean
├─ false: Sidebar não visível
└─ true:  Sidebar visible, layout muda para 3-col
```

### Chat State:

```
messages: MestreMessage[]
├─ role: "user" | "mestre"
└─ suggestions?: AiFlashcardSuggestion[]
```

---

## 🐛 Quick Debugging

### Mestre não aparece?

```javascript
// Console (F12):
document.querySelector(".mestre-sidebar");
// Deve retornar elemento
```

### Chat não envia?

```
Check Network (F12 → Network):
POST /ai/chat deve retornar 200 OK
Check: Authorization header presente?
```

### Flashcards não gera?

```
Verificar:
✓ Subject selecionado?
✓ Conteúdo suficiente? (>100 chars)
✓ Gemini API key configurada?
✓ Backend logs para erro
```

---

## 📊 File Changes Summary

```
MODIFICADO:
✓ src/App.tsx      (-5 linhas, removido "professor")
✓ src/App.css      (+1100 linhas CSS)

CRIADO (Documentação):
✓ IMPLEMENTATION_SUMMARY.md
✓ VALIDATION_CHECKLIST.md
✓ DETAILED_CHANGES.md
✓ QUICK_START_TESTING.md
✓ VISUAL_GUIDE.md
✓ README_DOCUMENTATION.md
```

---

## ✅ Pre-Merge Checklist

```
[ ] Frontend compila sem erros (npm run build)
[ ] NavBar tem exatamente 9 items
[ ] Botão "Mestre" visível no header
[ ] Sidebar abre com animação
[ ] Chat básico funciona
[ ] Criar assunto funciona
[ ] Gerar flashcards funciona
[ ] Salvar flashcards funciona
[ ] Responsividade OK (desktop/mobile)
[ ] Sem erros console
[ ] Backend logs limpo
```

---

## 🚀 Deploy Steps

```bash
1. Validar tudo OK (checklist acima)
2. git add .
3. git commit -m "feat: Replace Professor with Mestre AI"
4. git push origin feature/mestre
5. Create PR no GitHub
6. Review + Approve
7. Merge para main
8. CI/CD rodas testes
9. Deploy em staging → produção
```

---

## 💡 Pro Tips

- **Cold Start**: Reload página se Mestre não aparecer
- **Token Expired**: Logout/Login se chat retorna 401
- **Mobile Testing**: Use DevTools (F12 → Device Toolbar)
- **Dark Theme**: Suporta tema escuro nativo
- **Keyboard**: Enter envia, Tab navega

---

## 📚 Documentação Completa

```
Precisa de mais detalhes?

✓ Overview:     IMPLEMENTATION_SUMMARY.md
✓ Código:       DETAILED_CHANGES.md
✓ Testes:       VALIDATION_CHECKLIST.md
✓ Setup:        QUICK_START_TESTING.md
✓ UI/UX:        VISUAL_GUIDE.md
✓ Índice:       README_DOCUMENTATION.md
```

---

## 🎯 Success Criteria

- ✅ Professor removido da navegação
- ✅ Mestre sidebar funcionando
- ✅ Chat integrado com Gemini
- ✅ Flashcards salváveis
- ✅ Responsivo em all devices
- ✅ Zero console errors
- ✅ Frontend build success

**Status**: 🟢 PRONTO PARA VALIDAÇÃO

---

## 🆘 Quick Help

| Problema           | Solução                              |
| ------------------ | ------------------------------------ |
| "Port 5173 in use" | `lsof -ti:5173 \| xargs kill -9`     |
| "Backend 401"      | Logout e login novamente             |
| "Flashcards empty" | Verificar conteúdo (>100 chars)      |
| "Sidebar não abre" | Refresh página, check console        |
| "Estilo quebrado"  | Clear browser cache (Ctrl+Shift+Del) |

---

## 🎊 You're All Set!

Siga os 6 testes essenciais acima e você terá validado a implementação completa.

**Tempo estimado**: 30-45 minutos

**Status final**: 🟢 PRONTO PARA MERGE

---

_Quick Reference v1.0 - 2 de junho de 2026_
_Print ou salve este documento para referência rápida_
