from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def set_font(run, font_name: str, font_size: int, bold: bool = False, color_hex: str = None):
    run.font.name = font_name
    run.font.size = Pt(font_size)
    run.font.bold = bold
    if color_hex:
        r = int(color_hex[0:2], 16)
        g = int(color_hex[2:4], 16)
        b = int(color_hex[4:6], 16)
        run.font.color.rgb = RGBColor(r, g, b)

def add_section_heading(doc, text: str, config: dict):
    para = doc.add_paragraph()
    para.paragraph_format.space_before = Pt(config["space_before_section"])
    para.paragraph_format.space_after = Pt(config["space_after_heading"])
    run = para.add_run(text.upper())
    set_font(run, config["font_name"], config["font_size_section_heading"], bold=True, color_hex=config["color_section_heading"])

    # Add a bottom border to the heading paragraph
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement
    pPr = para._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "6")
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), "000000")
    pBdr.append(bottom)
    pPr.append(pBdr)

    return para

def add_bullet(doc, text: str, config: dict):
    para = doc.add_paragraph(style="List Bullet")
    para.paragraph_format.space_before = Pt(0)
    para.paragraph_format.space_after = Pt(1)
    run = para.add_run(text)
    set_font(run, config["font_name"], config["font_size_body"])
    return para