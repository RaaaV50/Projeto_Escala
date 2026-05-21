# Escala de Enfermagem 🏥

Montar escala de enfermagem todo mês na mão é trabalhoso. Esse projeto nasceu disso — uma ferramenta simples, que roda no navegador, sem precisar instalar nada ou depender de servidor.

Você cadastra os enfermeiros, define o mês e clica em gerar. O sistema distribui os plantões respeitando o turno de cada um, as folgas, férias e feriados do mês.

---

## O que faz

- Gera a escala automaticamente por turno: Manhã, Tarde e Noite (12×36h)
- Importa os feriados nacionais direto da [Brasil API](https://brasilapi.com.br) ao selecionar o mês
- Permite registrar folgas e férias por profissional antes de gerar
- Cobertura mínima por turno configurável — o sistema alerta se algum dia ficar descoberto
- Edição manual célula a célula para ajustes pontuais
- Relatório de horas por enfermeiro
- Exportação em CSV compatível com Excel
- Histórico dos últimos meses salvo no próprio navegador

---

## Regras de escala

| Turno | Regime |
|---|---|
| ☀️ Manhã | 6h dias úteis · 10h fins de semana alternados |
| 🌤️ Tarde | 6h dias úteis · 10h fins de semana alternados |
| 🌙 Noite | 12h trabalho / 36h folga — ciclo corrido |

---

## Como usar

Acesse direto pelo navegador, sem instalar nada:

🔗 **[Abrir o sistema](https://projeto-escala-tau.vercel.app)**

Cadastre os enfermeiros, selecione o mês e gere a escala. Os feriados nacionais são carregados automaticamente. Tudo fica salvo no próprio navegador.

---

## Quer usar o código ou adaptar para o seu caso?

1. Clone ou baixe o repositório
2. Abra o `index.html` no navegador — já funciona sem servidor
3. Para publicar como página web, basta ativar o **GitHub Pages** nas configurações do repositório

---

## Tecnologias

HTML · CSS · JavaScript puro · [Brasil API](https://brasilapi.com.br) · localStorage

---

## Versão v1.1.0

- Corrigido bug que impedia remover feriados
- Feriados agora são importados automaticamente ao trocar o mês
- Feriados de meses anteriores são limpos ao navegar entre meses

---

Licença MIT.
