# 🎨 Visualização da Interface - Mestre Sidebar

## Desktop Layout (> 900px) - Com Mestre Aberto

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 📚 STUDY PLATFORM              │  🔍 Search  │ ✨ Mestre │ 👤 │ Sair   │
├────────────┬────────────────────┼──────────────────────────────────────────┤
│            │                    │                                          │
│ 📊         │                    │  MESTRE                                  │
│ Dashboard  │                    │  Assistente de Estudos          [X]     │
│            │                    │                                          │
│ 🎯 Missões │                    │  ┌──────────────────────────────┐       │
│            │                    │  │ Olá João! Sou o Mestre...   │       │
│ 📖         │                    │  └──────────────────────────────┘       │
│ Assuntos   │   MAIN CONTENT     │                                          │
│            │                    │  ┌──────────────────────────────┐       │
│ 📝         │                    │  │ Você: Crie assunto           │       │
│ Anotações  │                    │  │       Criptografia           │       │
│            │                    │  └──────────────────────────────┘       │
│ 🎓         │                    │                                          │
│ Flashcards │                    │  ┌──────────────────────────────┐       │
│            │                    │  │ Mestre: Assunto criado!  ✓   │       │
│ 📅         │                    │  └──────────────────────────────┘       │
│ Revisoes   │                    │                                          │
│            │                    │  [+] Cria assunto...                    │
│ 📈         │                    │  [✨] O que é criptografia?             │
│ Estatist.  │                    │  [🎓] Gere flashcards                   │
│            │                    │                                          │
│ 👤 Perfil  │                    │  ┌──────────────────────────────┐       │
│            │                    │  │ 📎 │ Pergunte ao Mestre │ 🚀 │       │
│ ⚙️ Config   │                    │  └──────────────────────────────┘       │
│            │                    │                                          │
└────────────┴────────────────────┴──────────────────────────────────────────┘

LAYOUT GRID:  278px   |  minmax(0, 1fr)  |  380px
MESTRE ABERTO: 3 colunas visíveis
```

---

## Desktop Layout - Mestre Fechado

```
┌──────────────────────────────────────────────────────────────┐
│ 📚 STUDY PLATFORM  │  🔍 Search  │ ✨ Mestre │ 👤 │ Sair  │
├────────────┬──────────────────────────────────────────────────┤
│            │                                                  │
│ 📊         │                                                  │
│ Dashboard  │                   MAIN CONTENT                   │
│            │                                                  │
│ 🎯 Missões │                                                  │
│            │                                                  │
│ 📖         │                                                  │
│ Assuntos   │                                                  │
│            │                                                  │
│ ... (etc)  │                                                  │
│            │                                                  │
└────────────┴──────────────────────────────────────────────────┘

LAYOUT GRID:  278px   |  minmax(0, 1fr)
MESTRE FECHADO: 2 colunas (normal)
```

---

## Mobile/Tablet Layout (< 900px) - Mestre Aberto

```
┌──────────────────────────────────────────────────────────────┐
│ 📚 STUDY PLATFORM  │ 🔍 │ ✨ Mestre │ 👤 │ Sair            │
├──────────────────────────────────────────────────────────────┤
│                                    ╔──────────────────────╗   │
│                                    ║ MESTRE               ║   │
│                                    ║ Assistente       [X] ║   │
│  MAIN CONTENT                      ║                      ║   │
│  (SideBar overlay)                 ║ Chat messages...     ║   │
│                                    ║ here                 ║   │
│  (conteúdo escurecido)             ║                      ║   │
│                                    ║ [📎 input field 🚀] ║   │
│                                    ║                      ║   │
│                                    ╚──────────────────────╝   │
│                                                                │
└──────────────────────────────────────────────────────────────┘

COMPORTAMENTO:
- Mestre desliza da direita (position: fixed, right: 0)
- SideBar pode deslizar da esquerda (position: fixed, left: 0)
- Ambos são overlays (z-index: 150/200)
- Transição smooth 0.3s ease
```

---

## Mestre Sidebar - Estrutura Interna Detalhada

```
┌─────────────────────────────────────┐
│  ┌─ MESTRE HEADER ─────────────┐   │
│  │                              │   │
│  │ [✨] Mestre                  │[X]│
│  │     Assistente de Estudos        │
│  │                              │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌─ CONTEXT PANEL (quando aberto)─┐ │
│  │ Anexar Conteúdo para Estudar  │ │
│  │                                │ │
│  │ Assunto: [Dropdown ▼]          │ │
│  │ Cards:   [1] [↑↓] [20]          │ │
│  │                                │ │
│  │ [Novo assunto...] [Criar]      │ │
│  │                                │ │
│  │ Cole conteúdo aqui...          │ │
│  │ [textarea grande]              │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌─ MESSAGE FEED ──────────────────┐│
│  │ (scrollable)                   ││
│  │                                ││
│  │ Mestre: Olá! Sou o Mestre...   ││
│  │                                ││
│  │                    Você: Oi!   ││
│  │                                ││
│  │ Mestre: Como posso ajudar?     ││
│  │                                ││
│  │ Flashcards:                    ││
│  │ ☐ O que é criptografia?        ││
│  │   Resposta curta...            ││
│  │   [MEDIUM]                     ││
│  │                                ││
│  │ ☐ Qual é o algoritmo AES?      ││
│  │   Resposta aqui...             ││
│  │   [HARD]                       ││
│  │                                ││
│  │ [Salvar Flashcards Selecionados]││
│  │                                ││
│  │ [⦿  ⦿  ⦿] Loading...           ││
│  └────────────────────────────────┘│
│                                     │
│  ┌─ SUGGESTION CHIPS ──────────────┐│
│  │                                ││
│  │ [+] Cria assunto...             ││
│  │ [✨] O que é criptografia?      ││
│  │ [🎓] Gere flashcards            ││
│  │                                ││
│  └────────────────────────────────┘│
│                                     │
│  ┌─ FOOTER ───────────────────────┐ │
│  │ [📎]│ Pergunte ao Mestre...│[🚀]│ │
│  │     │ (input field)         │   │ │
│  └──────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘

MAX-WIDTH: 380px
ESTRUTURA: Flex column com 6 seções
SCROLL: Apenas na area de mensagens
```

---

## Message Bubble Styles

### Message do Usuário:

```
                        ┌──────────────────────┐
                        │ Você                 │
                        │ Crie assunto         │
                        │ Criptografia         │
                        └──────────────────────┘

Background: Linear gradiente roxo (#7842ff → #5c2dcc)
Cor texto: Branco
Align: Direita
```

### Message do Mestre:

```
┌──────────────────────┐
│ Mestre               │
│ Assunto criado com   │
│ sucesso! ✓           │
└──────────────────────┘

Background: Cinzento escuro (var(--panel-bg-strong))
Cor texto: Branco
Align: Esquerda
```

### Flashcard Suggestion:

```
┌────────────────────────────────┐
│ ☐ [MEDIUM - azul]              │
│                                │
│ O que é criptografia simétrica?│
│                                │
│ É um tipo de encriptação que   │
│ usa a mesma chave para...      │
└────────────────────────────────┘

Pode ter dificuldades:
- [EASY] = verde (#55d88d)
- [MEDIUM] = azul (#6edbff)
- [HARD] = vermelho (#ff6e8d)
```

---

## Color Palette Utilizado

```
PRIMARY GRADIENT:
  Start:  #7842ff (roxo)
  End:    #31aff3 (ciano)

SEMANTIC COLORS:
  Success:  #55d88d (verde)
  Danger:   #ff6e8d (vermelho)
  Accent:   #6edbff (azul claro)

BACKGROUNDS:
  Page:     #070812 (muito escuro)
  Panel:    rgba(255, 255, 255, 0.045) (quase invisível)
  Strong:   rgba(255, 255, 255, 0.07) (um pouco mais visível)
  Border:   rgba(255, 255, 255, 0.09)

TEXT:
  Primary:  #f8f6ff (quase branco)
  Muted:    rgba(255, 255, 255, 0.72) (cinzento claro)

RADIUS:
  Buttons/Inputs: 8px
  Panels: 18px
```

---

## Animation Examples

### Loader - Bouncing Dots:

```
[●   ]  →  [  ●  ]  →  [   ●]  →  [●   ]  ...

Duração: 1.4s
Ciclo: Infinito
Easing: ease-in-out
```

### Sidebar Slide-in (Mobile):

```
INICIO:
right: -380px
(off-screen à direita)
      ↓
      transition: right 0.3s ease
      ↓
FIM:
right: 0
(visível)
```

### Toggle Button Hover:

```
NORMAL:           HOVER:
Border: gray      Border: #6edbff (accent)
BG: transparent   BG: rgba(white, 0.045)
Text: white       Text: #6edbff
```

### Active State Toggle:

```
INACTIVE:                ACTIVE (Mestre open):
Border: gray            Border: #6edbff
BG: transparent        BG: rgba(120, 66, 255, 0.2)
                       Gradiente roxo/azul

Text fica colorido quando ativo
```

---

## Responsive Breakpoints

### Desktop (1200px+):

```
┌─────┬─────────────┬────┐
│ 278 │   flex      │380 │
└─────┴─────────────┴────┘
      3 colunas sempre visíveis
```

### Tablet (900px - 1200px):

```
┌─────┬─────────────┬────┐
│ 278 │   flex      │360 │
└─────┴─────────────┴────┘
      3 colunas, sidebar shrinks ligeiramente
```

### Mobile (< 900px):

```
┌─────────────────────────┐
│    1 coluna central     │
│   Drawers overlay       │
└─────────────────────────┘

Left drawer:  SideBar (z-index: 200)
Right drawer: Mestre  (z-index: 150)
```

---

## Fluxo de Interação - Criar Flashcards

```
1. Usuário clica botão "Mestre" no header
   ↓
   .home-page.mestre-open (CSS class adicionar)
   grid-template-columns muda para 3-column
   Sidebar desliza suavemente da direita

2. Usuário clica ícone paperclip (📎)
   ↓
   .mestre-context-panel vira visible
   Panel se expande acima do chat
   showContextPanel = true

3. Usuário seleciona subject e cola conteúdo
   ↓
   content state atualiza
   selectedSubjectId atualiza

4. Usuário digita "Gere flashcards" e envia
   ↓
   handleSendMessage() executa
   POST /ai/flashcards/generate é feito
   Backend retorna array de AiFlashcardSuggestion

5. Loader animado aparece
   ↓
   Depois desaparece

6. Cards renderizam inline com checkboxes
   ↓
   Usuário pode selecionar quais quer salvar

7. Clica "Salvar Flashcards Selecionados"
   ↓
   Loop: POST /flashcards para cada card selecionado
   Feedback: "X flashcards salvos!"
   Cards ficam com status visual "salvos"

8. Usuário pode fechar context panel
   ↓
   showContextPanel = false
   Panel some
```

---

## Estado da Aplicação - Mestre Sidebar

```
STATE TREE:
HomePage
├── currentSection: "dashboard" (HomeSection)
├── isMestreOpen: boolean (false|true) ← Toggle button controla
└──
    └── MestreSidebar (isOpen={isMestreOpen})
        ├── subjects: Subject[] (carregado de GET /subjects)
        ├── selectedSubjectId: string
        ├── messages: MestreMessage[]
        │   ├── id: number
        │   ├── role: "user" | "mestre"
        │   ├── text: string
        │   └── suggestions?: AiFlashcardSuggestion[]
        ├── prompt: string (input do usuário)
        ├── content: string (conteúdo anexado)
        ├── maxCards: number (1-20)
        ├── showContextPanel: boolean
        ├── isWorking: boolean (durante requisição)
        ├── feedback: Feedback | null
        └── selectedIndexesByMsg: Record<msgId, number[]>
            (rastreia quais cards foram selecionados por msg)
```

---

## Responsividade CSS Grid

```css
/* Desktop */
.home-page {
  grid-template-columns: 278px minmax(0, 1fr);
}

.home-page.mestre-open {
  grid-template-columns: 278px minmax(0, 1fr) 380px;
}

/* Mobile */
@media (max-width: 900px) {
  .home-page {
    grid-template-columns: minmax(0, 1fr); /* 1 coluna */
  }

  .home-page.mestre-open {
    /* Mesmo 1 coluna, mas com drawers overlay */
    grid-template-columns: minmax(0, 1fr);
    position: relative;
  }

  .mestre-sidebar {
    position: fixed;
    right: -380px; /* hidden */
    transition: right 0.3s ease;
  }

  .home-page.mestre-open .mestre-sidebar {
    right: 0; /* visible */
  }
}
```

---

## Resumo Visual

| Aspecto      | Desktop      | Tablet       | Mobile       |
| ------------ | ------------ | ------------ | ------------ |
| Layout       | 3-col        | 3-col        | 1-col        |
| Sidebar      | Always       | Always       | Overlay      |
| Mestre       | Always       | Always       | Overlay      |
| Width Mestre | 380px        | 360px        | 380px        |
| Animation    | Smooth       | Smooth       | Fast         |
| Interaction  | Click toggle | Click toggle | Click toggle |

---

_Visualização v1.0 - 2 de junho de 2026_
