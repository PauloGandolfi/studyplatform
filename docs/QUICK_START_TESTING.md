# 🚀 Guia Rápido - Rodar e Testar Mestre Sidebar

## ⚡ Quick Start (5 minutos)

### 1️⃣ Terminal 1 - Frontend Dev Server

```bash
cd frontend
npm run dev
```

**Output esperado:**

```
  VITE v2.9.18  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Press h to show help
```

**Clique em**: `http://localhost:5173/` ou `http://localhost:5174/`

---

### 2️⃣ Terminal 2 - Backend Spring Boot

```bash
cd backend
./mvnw spring-boot:run
```

**Output esperado:**

```
2026-06-02 14:32:15.234 INFO  Application started in 8.234 seconds
2026-06-02 14:32:15.456 INFO  Listening on http://localhost:8080
```

**Aguarde ambos iniciarem antes de ir ao passo 3**.

---

### 3️⃣ No Browser - Fazer Login

1. Ir para `http://localhost:5173/`
2. Registrar uma conta (ou usar credenciais de teste)
3. Fazer login
4. Deve aparecer a página principal com o Dashboard

---

## ✅ Verificações Visuais Imediatas

### ✨ Verificação 1: NavBar Sidebar (Left)

```
Deve mostrar EXATAMENTE estes 9 itens:
✓ Dashboard
✓ Missões
✓ Assuntos
✓ Anotações
✓ Flashcards
✓ Revisoes
✓ Estatisticas
✓ Perfil
✓ Configuracoes

❌ NÃO deve aparecer "Professor"
```

### ✨ Verificação 2: Header Actions (Top Right)

```
Procure por:
┌────────────────────────────────────┐
│ [🔍Search] [✨Mestre] [👤] [Sair] │
└────────────────────────────────────┘

Botão "Mestre" deve ter:
- Ícone de spark (✨)
- Texto "Mestre"
- Border cinzento claro
- Estado normal (não active ainda)
```

### ✨ Verificação 3: Clicar no Botão "Mestre"

```
Esperado:
1. Sidebar desliza da direita (no desktop)
2. Layout muda para 3 colunas
3. Título "Mestre" com avatar no topo
4. Campo de chat com placeholder
5. 3 botões de sugestão rápida
6. Botão de fechar (X) no header
```

---

## 🧪 Testes Funcionais (Passo a Passo)

### 🧪 Teste 1: Chat Básico

```
1. Digitar na caixa de chat:
   "Qual é a capital do Brasil?"

2. Pressionar Enter ou clicar botão enviar

3. Verificar:
   ✓ Sua mensagem aparece com gradiente roxo
   ✓ Loader com 3 bolinhas animadas aparece
   ✓ Resposta do Mestre volta com background cinzento
   ✓ Chat faz scroll automático para baixo
```

### 🧪 Teste 2: Criar Assunto via Chat

```
1. Limpar chat (fechar e reabrir Mestre)

2. Digitar:
   "Crie assunto Criptografia"

3. Verificar:
   ✓ Sistema detecta o comando
   ✓ POST /subjects é feito
   ✓ Mensagem de sucesso aparece:
     "Assunto 'Criptografia' criado com sucesso!"
   ✓ Novo assunto aparece no context panel selector
```

### 🧪 Teste 3: Abrir Context Panel (Anexação)

```
1. Clicar botão com ícone de paperclip (📎)

2. Panel deve aparecer acima do input com:
   ✓ Seletor "Assunto"
   ✓ Input "Cards" (número 1-20)
   ✓ Botão "Criar" novo assunto
   ✓ Grande textarea para colar conteúdo
   ✓ Botão X para fechar

3. Clicar X para fechar panel
```

### 🧪 Teste 4: Gerar Flashcards

```
1. Abrir context panel novamente (clique paperclip)

2. Selecionar um assunto (ou criar novo)

3. Colar conteúdo de estudo no textarea:
   "Criptografia simétrica é um tipo de encriptação
    que usa a mesma chave para encriptar e desencriptar.
    Exemplo: AES, DES. É rápida mas precisa compartilhar chave."

4. Digitar prompt:
   "Gere 3 flashcards sobre o conteúdo"

5. Pressionar Enter

6. Verificar:
   ✓ Loader aparece
   ✓ Flashcards renderizam inline como cards
   ✓ Cada card mostra:
     - Checkbox na esquerda
     - Dificuldade (cor: verde/azul/vermelho)
     - Pergunta
     - Resposta
   ✓ Botão "Salvar Flashcards Selecionados" aparece
```

### 🧪 Teste 5: Salvar Flashcards

```
1. (Continuando do Teste 4)

2. Clicar checkbox para selecionar cards desejados
   (ou selecionar todos)

3. Clicar "Salvar Flashcards Selecionados"

4. Verificar:
   ✓ Botão fica disabled ("Salvando...")
   ✓ Cards são POST para /flashcards
   ✓ Feedback: "X flashcard(s) salvo(s)!"
   ✓ Cards ficam com status "✓ Flashcards salvos na sua biblioteca!"
```

### 🧪 Teste 6: Suggestion Chips

```
1. Fechar Mestre (clicar X ou botão no header)

2. Reabrir Mestre

3. Verificar que aparecem 3 botões:
   ✓ [+] "Cria assunto Seguranca da informacao"
   ✓ [✨] "O que e criptografia simetrica?"
   ✓ [🎓] "Gere flashcards sobre o conteudo"

4. Clicar em um dos chips

5. Verificar que o texto preenche o input
```

---

## 📱 Teste Responsividade

### Desktop (> 1200px)

```
✓ 3 colunas visíveis: SideBar | Content | Mestre
✓ Mestre sempre visto
✓ Clicar X apenas fecha, não vai para drawer
```

### Tablet (768px - 1200px)

```
✓ Ainda mostra 3 colunas
✓ Mestre shrinks um pouco
✓ Tudo funciona como desktop
```

### Mobile (< 768px)

```
✓ 1 coluna apenas
✓ SideBar desliza do lado esquerdo (fixed position)
✓ Mestre desliza do lado direito
✓ Conteúdo fica atrás com z-index menor
✓ Quando Mestre abre, tela fica um pouco escurecida

Para testar:
- Chrome DevTools: F12
- Toggle device toolbar: Ctrl+Shift+M
- Selecionar "iPhone 12" ou "Pixel 5"
```

---

## 🐛 Debug Tips

### Se Mestre não aparecer:

```javascript
// No console (F12):
// 1. Verificar estado
console.log(document.querySelector(".mestre-sidebar"));

// 2. Verificar classe
console.log(document.querySelector(".home-page").className);

// 3. Verificar CSS Grid
const main = document.querySelector(".home-page");
console.log(window.getComputedStyle(main).gridTemplateColumns);
```

### Se Chat não enviar:

```
Verificar no Network (F12):
1. POST /ai/chat deve ter sucesso (200)
2. Ver resposta no payload
3. Verificar Authorization header está presente
4. Se error 403: Token expirou, refaça login
```

### Se Flashcards não aparecem:

```
Verificar no Network:
1. GET /subjects retornou lista?
2. POST /ai/flashcards/generate teve sucesso?
3. Ver resposta contém "flashcards" array?
4. Se vazio, conteúdo pode ser insuficiente
```

### Logs do Console:

```
Pressione F12 → Console e procure por:
- Erros em vermelho (aparecem logo)
- Warnings em amarelo (ignorar Network warnings)
- API responses que você enviou
- Estado do componente (se houver console.log)
```

---

## 🔗 URLs Úteis

```
Frontend:     http://localhost:5173
Backend:      http://localhost:8080
API Chat:     http://localhost:8080/ai/chat
API Subjects: http://localhost:8080/subjects
```

---

## 🛑 Troubleshooting

### ❌ "Port 5173 already in use"

```bash
# Matar processo anterior:
# Linux/Mac:
lsof -ti:5173 | xargs kill -9

# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### ❌ "Backend returns 401 Unauthorized"

```
1. Logout e login novamente
2. Token JWT expirou
3. Verificar Authorization header no Network
```

### ❌ "CORS error"

```
Este projeto está na mesma máquina, não deve ter CORS
Se tiver: verificar backend configuração CORS
```

### ❌ "Flashcards não gera"

```
1. Verificar que tem um subject selecionado
2. Verificar que colou conteúdo suficiente (>100 chars)
3. Verificar Gemini API key está configurada no backend
4. Ver logs do backend para erro
```

---

## 📊 Checklist Final antes de Merge

- [ ] Frontend compila sem erros (`npm run build`)
- [ ] Backend compila sem erros (`mvn clean compile`)
- [ ] App inicia sem crashes
- [ ] Sidebar não tem "Professor"
- [ ] Botão "Mestre" aparece no header
- [ ] Sidebar abre/fecha com animação suave
- [ ] Chat básico funciona
- [ ] Criação de assunto funciona
- [ ] Context panel funciona
- [ ] Geração de flashcards funciona
- [ ] Salvar flashcards funciona
- [ ] Responsividade OK (desktop/tablet/mobile)
- [ ] Nenhum erro console (exceto warnings)
- [ ] All endpoints retornam dados corretos

---

## 🚀 Depois de Validado

```bash
# 1. Fazer commit
git add .
git commit -m "feat: Replace Professor with Mestre AI sidebar

- Remove professor section from navigation
- Implement MestreSidebar component with full chat UI
- Add 1100+ lines of CSS styling
- Support flashcard generation and saving
- Implement responsive layout for desktop/tablet/mobile
- Add animation and smooth transitions"

# 2. Push para repo
git push origin feature/mestre-sidebar

# 3. Criar Pull Request
# No GitHub, create PR e pedir review

# 4. Após aprovado, merge para main
# Deploy em staging para testes finais
# Deploy em produção
```

---

## 📞 Se Houver Issues

Verifique nesta ordem:

1. **VALIDATION_CHECKLIST.md** - Testes manuais passo a passo
2. **IMPLEMENTATION_SUMMARY.md** - Resumo do que foi feito
3. **DETAILED_CHANGES.md** - Quais arquivos foram alterados
4. **Este arquivo** - Debug tips

Se problema persistir:

- Verificar console do navegador (F12)
- Verificar logs do backend (terminal)
- Verificar Network tab (F12 → Network)
- Conferir que ambos (frontend e backend) estão rodando

---

_Guia Rápido v1.0 - 2 de junho de 2026_  
_Tudo pronto para validação! Bom coding! 🚀_
