#!/usr/bin/env python3
"""Render the Chinese competitor research report as a print-ready PDF."""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


NAVY = colors.HexColor("#123B52")
INK = colors.HexColor("#182126")
MUTED = colors.HexColor("#5D6A70")
PAPER = colors.HexColor("#F4F1E8")
LINE = colors.HexColor("#C9D1D4")


def register_fonts() -> None:
    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))


def inline_markup(text: str) -> str:
    text = html.escape(text, quote=False)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`(.+?)`", r"<font name='Courier'>\1</font>", text)
    text = re.sub(r"(https?://[^\s<]+)", r"<link href='\1' color='#123B52'>\1</link>", text)
    return text


def parse_markdown(markdown: str, styles: dict[str, ParagraphStyle]):
    lines = markdown.splitlines()
    story = []
    in_frontmatter = False
    title_consumed = False
    paragraph_buffer: list[str] = []
    table_rows: list[list[str]] = []

    def flush_paragraph() -> None:
        if paragraph_buffer:
            text = " ".join(part.strip() for part in paragraph_buffer if part.strip())
            if text:
                story.append(Paragraph(inline_markup(text), styles["body"]))
                story.append(Spacer(1, 3.2 * mm))
            paragraph_buffer.clear()

    def flush_table() -> None:
        if not table_rows:
            return
        usable = [row for row in table_rows if not all(set(cell) <= {"-", ":"} for cell in row)]
        if usable:
            data = []
            for row_index, row in enumerate(usable):
                data.append(
                    [
                        Paragraph(
                            f"<font color='#FFFFFF'>{inline_markup(cell)}</font>"
                            if row_index == 0
                            else inline_markup(cell),
                            styles["table"],
                        )
                        for cell in row
                    ]
                )
            col_widths = [50 * mm, 54 * mm, 70 * mm][: len(data[0])]
            table = Table(data, colWidths=col_widths, repeatRows=1, hAlign="LEFT")
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("FONTNAME", (0, 0), (-1, -1), "STSong-Light"),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
                        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PAPER]),
                        ("LEFTPADDING", (0, 0), (-1, -1), 6),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                        ("TOPPADDING", (0, 0), (-1, -1), 6),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ]
                )
            )
            story.append(table)
            story.append(Spacer(1, 5 * mm))
        table_rows.clear()

    for raw in lines:
        line = raw.rstrip()
        if line == "---" and not title_consumed:
            in_frontmatter = not in_frontmatter
            continue
        if in_frontmatter:
            continue

        if line.startswith("|") and line.endswith("|"):
            flush_paragraph()
            table_rows.append([cell.strip() for cell in line.strip("|").split("|")])
            continue
        flush_table()

        if line.startswith("# ") and not title_consumed:
            flush_paragraph()
            title_consumed = True
            story.append(Spacer(1, 42 * mm))
            story.append(Paragraph(inline_markup(line[2:]), styles["title"]))
            story.append(Spacer(1, 8 * mm))
            story.append(Paragraph("竞品机制、MVP 取舍与执行建议", styles["subtitle"]))
            story.append(Spacer(1, 8 * mm))
            story.append(Paragraph("2026-07-10  |  16 sources  |  14 products", styles["meta"]))
            story.append(PageBreak())
        elif line.startswith("## "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(line[3:]), styles["h2"]))
            story.append(Spacer(1, 3 * mm))
        elif line.startswith("### "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(line[4:]), styles["h3"]))
            story.append(Spacer(1, 2 * mm))
        elif not line.strip():
            flush_paragraph()
        else:
            paragraph_buffer.append(line)

    flush_paragraph()
    flush_table()
    return story


def build_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "TitleCN",
            parent=base["Title"],
            fontName="STSong-Light",
            fontSize=28,
            leading=38,
            textColor=NAVY,
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "subtitle": ParagraphStyle(
            "SubtitleCN",
            fontName="STSong-Light",
            fontSize=13,
            leading=20,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
        "meta": ParagraphStyle(
            "Meta",
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
        "h2": ParagraphStyle(
            "H2CN",
            fontName="STSong-Light",
            fontSize=17,
            leading=24,
            textColor=NAVY,
            spaceBefore=8 * mm,
            spaceAfter=2 * mm,
            keepWithNext=True,
        ),
        "h3": ParagraphStyle(
            "H3CN",
            fontName="STSong-Light",
            fontSize=13,
            leading=20,
            textColor=INK,
            spaceBefore=5 * mm,
            spaceAfter=1 * mm,
            keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "BodyCN",
            fontName="STSong-Light",
            fontSize=9.5,
            leading=16,
            textColor=INK,
            alignment=TA_LEFT,
            wordWrap="CJK",
            orphans=3,
            widows=3,
        ),
        "table": ParagraphStyle(
            "TableCN",
            fontName="STSong-Light",
            fontSize=8.2,
            leading=12,
            textColor=INK,
            wordWrap="CJK",
        ),
    }


def page_decor(canvas, doc) -> None:
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, 15 * mm, width - 18 * mm, 15 * mm)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(18 * mm, 9 * mm, "AI DIGITAL ALTER EGO COMPETITOR RESEARCH")
    canvas.drawRightString(width - 18 * mm, 9 * mm, str(doc.page))
    canvas.restoreState()


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: generate_research_pdf.py INPUT.md OUTPUT.pdf")
        return 2
    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    output.parent.mkdir(parents=True, exist_ok=True)
    register_fonts()
    styles = build_styles()
    story = parse_markdown(source.read_text(encoding="utf-8"), styles)
    doc = SimpleDocTemplate(
        str(output),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=20 * mm,
        title="AI 怪可爱数字分身竞品研究",
        author="Codex",
        subject="竞品机制、MVP 取舍与执行建议",
    )
    doc.build(story, onFirstPage=page_decor, onLaterPages=page_decor)
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
