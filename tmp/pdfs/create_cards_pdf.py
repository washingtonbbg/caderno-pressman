from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfbase.pdfmetrics import stringWidth

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output" / "pdf" / "cards-pressman.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

cards = [
    ("Quais são as camadas centrais da engenharia de software?", "Processo, métodos e ferramentas, sustentados pelo foco na qualidade."),
    ("O que é processo?", "Conjunto de atividades, ações e tarefas realizadas para criar um artefato."),
    ("Processo é uma prescrição rígida?", "Não. É uma abordagem adaptável."),
    ("O que é uma atividade?", "Esforço voltado a um objetivo amplo."),
    ("O que é uma ação?", "Conjunto de tarefas que pode produzir um artefato fundamental."),
    ("O que é uma tarefa?", "Trabalho com objetivo pequeno, definido e resultado tangível."),
    ("Quais são as cinco atividades genéricas?", "Comunicação, planejamento, modelagem, construção e entrega."),
    ("Para que serve a comunicação?", "Entender objetivos dos envolvidos e reunir requisitos."),
    ("Para que serve o planejamento?", "Definir tarefas, riscos, recursos, produtos e cronograma."),
    ("Para que serve a modelagem?", "Compreender o problema e projetar a solução."),
    ("O que a construção combina?", "Geração de código e testes."),
    ("O que fornecem os métodos?", "Informação técnica para desenvolver software."),
    ("O que fornecem as ferramentas?", "Suporte automatizado ou semiautomatizado."),
    ("O que prescreve um modelo prescritivo?", "Elementos de processo e seu fluxo de trabalho."),
    ("Qual é a ideia central do cascata?", "Fluxo sequencial e sistemático."),
    ("Quando o cascata pode ser aplicável?", "Com requisitos bem definidos e estáveis."),
    ("O que evidencia o modelo V?", "A relação entre testes e ações anteriores de engenharia."),
    ("Qual é a natureza do incremental?", "Iterativa, com versões operacionais por incrementos."),
    ("Qual é a ênfase do espiral?", "Evolução iterativa orientada pela análise de riscos."),
    ("Evolucionário significa ágil?", "Não. São classificações diferentes no livro."),
]

W, H = A4
MARGIN = 30
GAP = 12
HEADER = 38
card_w = (W - 2 * MARGIN - GAP) / 2
card_h = (H - 2 * MARGIN - HEADER - GAP) / 2

INK = HexColor("#17251f")
PAPER = HexColor("#f4f0e7")
CREAM = HexColor("#e9e1d2")
ORANGE = HexColor("#e85d35")
GREEN = HexColor("#456a58")
MUTED = HexColor("#68736d")

def wrap(text, font, size, max_width):
    words = text.split()
    lines, line = [], ""
    for word in words:
        trial = word if not line else f"{line} {word}"
        if stringWidth(trial, font, size) <= max_width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines

def draw_card(c, x, y, number, question, answer):
    c.setFillColor(PAPER)
    c.setStrokeColor(GREEN)
    c.setLineWidth(0.8)
    c.roundRect(x, y, card_w, card_h, 6, fill=1, stroke=1)
    c.setFillColor(INK)
    c.rect(x, y + card_h - 29, card_w, 29, fill=1, stroke=0)
    c.setFillColor(PAPER)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(x + 13, y + card_h - 18, f"CADERNO PRESSMAN  |  CARD {number:02d}")

    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(x + 15, y + card_h - 48, "PERGUNTA")
    q_lines = wrap(question, "Helvetica-Bold", 13, card_w - 30)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 13)
    qy = y + card_h - 68
    for line in q_lines[:4]:
        c.drawString(x + 15, qy, line)
        qy -= 17

    fold_y = y + card_h * 0.47
    c.setStrokeColor(HexColor("#afa898"))
    c.setDash(3, 3)
    c.line(x + 12, fold_y, x + card_w - 12, fold_y)
    c.setDash()
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.5)
    c.drawCentredString(x + card_w / 2, fold_y + 4, "DOBRE AQUI")

    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(x + 15, fold_y - 19, "RESPOSTA")
    a_lines = wrap(answer, "Helvetica", 11, card_w - 30)
    c.setFillColor(INK)
    c.setFont("Helvetica", 11)
    ay = fold_y - 39
    for line in a_lines[:5]:
        c.drawString(x + 15, ay, line)
        ay -= 15

    c.setFillColor(ORANGE)
    c.circle(x + card_w - 17, y + 16, 3, fill=1, stroke=0)

c = canvas.Canvas(str(OUT), pagesize=A4)
c.setTitle("Cards de memorização - Caderno Pressman")
c.setAuthor("Caderno Pressman")

for start in range(0, len(cards), 4):
    page = start // 4 + 1
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(MARGIN, H - MARGIN + 2, "CARDS DE MEMORIZAÇÃO")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawRightString(W - MARGIN, H - MARGIN + 2, f"Engenharia de Software  |  folha {page} de 5")
    for offset, (question, answer) in enumerate(cards[start:start + 4]):
        col = offset % 2
        row = offset // 2
        x = MARGIN + col * (card_w + GAP)
        y = H - MARGIN - HEADER - (row + 1) * card_h - row * GAP
        draw_card(c, x, y, start + offset + 1, question, answer)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.5)
    c.drawCentredString(W / 2, 12, "Recorte nas bordas e dobre cada card na linha pontilhada.")
    c.showPage()
c.save()
print(OUT)
