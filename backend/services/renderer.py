import io
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from models.schema import CVProfile
from templates.config import TEMPLATES, DEFAULT_TEMPLATE
from templates.base import set_font, add_section_heading, add_bullet


def render_cv(profile: CVProfile, template_name: str = DEFAULT_TEMPLATE) -> bytes:
    config = TEMPLATES.get(template_name, TEMPLATES[DEFAULT_TEMPLATE])
    if template_name == "compact":
        return _render_compact(profile, config)
    elif template_name == "modern":
        return _render_modern(profile, config)
    else:
        return _render_classic(profile, config)


def _new_doc(top=0.75, bottom=0.75, left=0.9, right=0.9) -> Document:
    doc = Document()
    for s in doc.sections:
        s.top_margin = Inches(top)
        s.bottom_margin = Inches(bottom)
        s.left_margin = Inches(left)
        s.right_margin = Inches(right)
    doc.styles["Normal"].paragraph_format.space_before = Pt(0)
    doc.styles["Normal"].paragraph_format.space_after = Pt(0)
    return doc


def _to_bytes(doc: Document) -> bytes:
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.read()


# ---------------------------------------------------------------------------
# Classic — centered header, black rules
# ---------------------------------------------------------------------------
def _render_classic(profile: CVProfile, config: dict) -> bytes:
    doc = _new_doc()

    # Name
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(2)
    set_font(p.add_run(profile.name), config["font_name"], config["font_size_name"],
             bold=True, color_hex=config["color_name"])

    # Title
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(2)
    set_font(p.add_run(profile.title), config["font_name"], config["font_size_title"],
             italic=True, color_hex=config["color_title"])

    # Contact
    contact = profile.contact
    parts = [x for x in [contact.email, contact.phone, contact.location, contact.linkedin] if x]
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(4)
    set_font(p.add_run("  |  ".join(parts)), config["font_name"], config["font_size_contact"],
             color_hex=config["color_contact"])

    _render_body(doc, profile, config)
    return _to_bytes(doc)


# ---------------------------------------------------------------------------
# Modern — left-aligned, navy name, blue accent rules
# ---------------------------------------------------------------------------
def _render_modern(profile: CVProfile, config: dict) -> bytes:
    doc = _new_doc(left=0.85, right=0.85)

    # Name
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    set_font(p.add_run(profile.name), config["font_name"], config["font_size_name"],
             bold=True, color_hex=config["color_name"])

    # Title
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(3)
    set_font(p.add_run(profile.title), config["font_name"], config["font_size_title"],
             color_hex=config["color_title"])

    # Contact
    contact = profile.contact
    parts = [x for x in [contact.email, contact.phone, contact.location, contact.linkedin] if x]
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    set_font(p.add_run("  |  ".join(parts)), config["font_name"], config["font_size_contact"],
             color_hex=config["color_contact"])

    _render_body(doc, profile, config)
    return _to_bytes(doc)


# ---------------------------------------------------------------------------
# Compact — left-aligned, smaller fonts, tight spacing
# ---------------------------------------------------------------------------
def _render_compact(profile: CVProfile, config: dict) -> bytes:
    doc = _new_doc(top=0.6, bottom=0.6, left=0.75, right=0.75)

    # Name
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(1)
    set_font(p.add_run(profile.name), config["font_name"], config["font_size_name"],
             bold=True, color_hex=config["color_name"])

    # Title + contact on one line
    contact = profile.contact
    parts = [x for x in [contact.email, contact.phone, contact.location, contact.linkedin] if x]
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(3)
    r1 = p.add_run(profile.title + "  ·  ")
    set_font(r1, config["font_name"], config["font_size_title"],
             bold=True, color_hex=config["color_title"])
    r2 = p.add_run("  |  ".join(parts))
    set_font(r2, config["font_name"], config["font_size_contact"],
             color_hex=config["color_contact"])

    _render_body(doc, profile, config)
    return _to_bytes(doc)


# ---------------------------------------------------------------------------
# Shared body
# ---------------------------------------------------------------------------
def _render_body(doc: Document, profile: CVProfile, config: dict) -> None:
    font = config["font_name"]
    body_sz = config["font_size_body"]
    body_color = config.get("color_body", "1A1A1A")
    dim_color = config["color_contact"]

    # SUMMARY
    if profile.summary:
        add_section_heading(doc, "Summary", config)
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        set_font(p.add_run(profile.summary), font, body_sz, color_hex=body_color)

    # EXPERIENCE
    if profile.experience:
        add_section_heading(doc, "Experience", config)
        for job in profile.experience:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(7)
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(job.company)
            set_font(r, font, body_sz, bold=True, color_hex=body_color)
            r2 = p.add_run(f"  |  {job.start} – {job.end}")
            set_font(r2, font, body_sz, color_hex=dim_color)

            p2 = doc.add_paragraph()
            p2.paragraph_format.space_before = Pt(1)
            p2.paragraph_format.space_after = Pt(2)
            set_font(p2.add_run(f"{job.title}  ·  {job.location}"),
                     font, body_sz, italic=True, color_hex=body_color)

            for bullet in job.bullets:
                add_bullet(doc, bullet, config)

    # EDUCATION
    if profile.education:
        add_section_heading(doc, "Education", config)
        for edu in profile.education:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(5)
            p.paragraph_format.space_after = Pt(1)
            set_font(p.add_run(edu.institution), font, body_sz, bold=True, color_hex=body_color)
            r2 = p.add_run(f"  |  {edu.degree} in {edu.field}  ·  {edu.year}")
            set_font(r2, font, body_sz, color_hex=dim_color)

    # SKILLS — two columns using tab-like spacing
    if profile.skills:
        add_section_heading(doc, "Skills", config)
        skills = profile.skills
        mid = (len(skills) + 1) // 2
        for i in range(mid):
            left = skills[i]
            right = skills[i + mid] if (i + mid) < len(skills) else ""
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            line = f"• {left:<28}• {right}" if right else f"• {left}"
            set_font(p.add_run(line), font, body_sz, color_hex=body_color)

    # CERTIFICATIONS
    if profile.certifications:
        add_section_heading(doc, "Certifications", config)
        for cert in profile.certifications:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(5)
            p.paragraph_format.space_after = Pt(1)
            set_font(p.add_run(cert.name), font, body_sz, bold=True, color_hex=body_color)
            extras = [x for x in [cert.issuer, cert.year] if x]
            if extras:
                set_font(p.add_run(f"  ·  {' · '.join(extras)}"),
                         font, body_sz, color_hex=dim_color)
