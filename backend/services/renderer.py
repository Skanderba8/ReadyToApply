import io
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from models.schema import CVProfile
from templates.config import TEMPLATES, DEFAULT_TEMPLATE
from templates.base import (
    set_font,
    add_section_heading,
    add_modern_section_heading,
    add_modern_header,
    add_bullet,
)


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def render_cv(profile: CVProfile, template_name: str = DEFAULT_TEMPLATE) -> bytes:
    config = TEMPLATES.get(template_name, TEMPLATES[DEFAULT_TEMPLATE])

    if template_name == "modern":
        return _render_modern(profile, config)
    elif template_name == "compact":
        return _render_compact(profile, config)
    else:
        return _render_classic(profile, config)


# ---------------------------------------------------------------------------
# Shared doc setup
# ---------------------------------------------------------------------------

def _new_doc(config: dict, top: float = 0.75, bottom: float = 0.75,
             left: float = 0.85, right: float = 0.85) -> Document:
    doc = Document()
    for section in doc.sections:
        section.top_margin = Inches(top)
        section.bottom_margin = Inches(bottom)
        section.left_margin = Inches(left)
        section.right_margin = Inches(right)

    style = doc.styles["Normal"]
    style.paragraph_format.space_before = Pt(0)
    style.paragraph_format.space_after = Pt(0)
    return doc


def _to_bytes(doc: Document) -> bytes:
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.read()


# ---------------------------------------------------------------------------
# Classic renderer (unchanged from original)
# ---------------------------------------------------------------------------

def _render_classic(profile: CVProfile, config: dict) -> bytes:
    doc = _new_doc(config)

    # NAME
    name_para = doc.add_paragraph()
    name_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    name_run = name_para.add_run(profile.name)
    set_font(name_run, config["font_name"], config["font_size_name"], bold=True)

    # TITLE
    title_para = doc.add_paragraph()
    title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_para.add_run(profile.title)
    set_font(title_run, config["font_name"], config["font_size_title"],
             color_hex=config["color_contact"])

    # CONTACT
    contact = profile.contact
    contact_parts = [contact.email, contact.phone, contact.location]
    if contact.linkedin:
        contact_parts.append(contact.linkedin)
    contact_para = doc.add_paragraph()
    contact_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    contact_run = contact_para.add_run("  |  ".join(contact_parts))
    set_font(contact_run, config["font_name"], config["font_size_contact"],
             color_hex=config["color_contact"])

    _render_body(doc, profile, config, heading_fn=add_section_heading)

    return _to_bytes(doc)


# ---------------------------------------------------------------------------
# Modern renderer — navy header block + coloured accent rules
# ---------------------------------------------------------------------------

def _render_modern(profile: CVProfile, config: dict) -> bytes:
    # Tighter left/right margins to give the header more width
    doc = _new_doc(config, top=0.0, bottom=0.75, left=0.75, right=0.75)

    # Full-width shaded header (name + title + contact)
    add_modern_header(doc, profile, config)

    _render_body(doc, profile, config, heading_fn=add_modern_section_heading)

    return _to_bytes(doc)


# ---------------------------------------------------------------------------
# Compact renderer — identical structure to classic, just smaller everything
# ---------------------------------------------------------------------------

def _render_compact(profile: CVProfile, config: dict) -> bytes:
    doc = _new_doc(config, top=0.6, bottom=0.6, left=0.7, right=0.7)

    # NAME
    name_para = doc.add_paragraph()
    name_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    name_run = name_para.add_run(profile.name)
    set_font(name_run, config["font_name"], config["font_size_name"], bold=True)

    # TITLE + CONTACT on one line to save vertical space
    contact = profile.contact
    contact_parts = [contact.email, contact.phone, contact.location]
    if contact.linkedin:
        contact_parts.append(contact.linkedin)

    info_para = doc.add_paragraph()
    info_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = info_para.add_run(f"{profile.title}  ·  ")
    set_font(title_run, config["font_name"], config["font_size_contact"],
             bold=True, color_hex=config["color_contact"])
    contact_run = info_para.add_run("  |  ".join(contact_parts))
    set_font(contact_run, config["font_name"], config["font_size_contact"],
             color_hex=config["color_contact"])

    _render_body(doc, profile, config, heading_fn=add_section_heading)

    return _to_bytes(doc)


# ---------------------------------------------------------------------------
# Shared body sections (summary → certifications)
# ---------------------------------------------------------------------------

def _render_body(doc: Document, profile: CVProfile, config: dict, heading_fn) -> None:
    """Render all CV sections below the header. heading_fn controls the style."""

    font = config["font_name"]
    body_size = config["font_size_body"]
    contact_color = config["color_contact"]

    # SUMMARY
    if profile.summary:
        heading_fn(doc, "Summary", config)
        summary_para = doc.add_paragraph()
        summary_run = summary_para.add_run(profile.summary)
        set_font(summary_run, font, body_size)

    # EXPERIENCE
    if profile.experience:
        heading_fn(doc, "Experience", config)
        for job in profile.experience:
            job_para = doc.add_paragraph()
            job_para.paragraph_format.space_before = Pt(6)
            company_run = job_para.add_run(job.company)
            set_font(company_run, font, body_size, bold=True)

            date_str = f"  |  {job.start} – {job.end}"
            date_run = job_para.add_run(date_str)
            set_font(date_run, font, body_size, color_hex=contact_color)

            role_para = doc.add_paragraph()
            role_run = role_para.add_run(f"{job.title}  ·  {job.location}")
            set_font(role_run, font, body_size)
            role_run.italic = True

            for bullet in job.bullets:
                add_bullet(doc, bullet, config)

    # EDUCATION
    if profile.education:
        heading_fn(doc, "Education", config)
        for edu in profile.education:
            edu_para = doc.add_paragraph()
            edu_para.paragraph_format.space_before = Pt(4)
            inst_run = edu_para.add_run(edu.institution)
            set_font(inst_run, font, body_size, bold=True)

            degree_str = f"  |  {edu.degree} in {edu.field}  ·  {edu.year}"
            degree_run = edu_para.add_run(degree_str)
            set_font(degree_run, font, body_size)

    # SKILLS
    if profile.skills:
        heading_fn(doc, "Skills", config)
        skills_para = doc.add_paragraph()
        skills_run = skills_para.add_run("  ·  ".join(profile.skills))
        set_font(skills_run, font, body_size)

    # CERTIFICATIONS
    if profile.certifications:
        heading_fn(doc, "Certifications", config)
        for cert in profile.certifications:
            cert_para = doc.add_paragraph()
            cert_para.paragraph_format.space_before = Pt(4)
            cert_name_run = cert_para.add_run(cert.name)
            set_font(cert_name_run, font, body_size, bold=True)
            if cert.issuer or cert.year:
                extra = []
                if cert.issuer:
                    extra.append(cert.issuer)
                if cert.year:
                    extra.append(cert.year)
                cert_extra_run = cert_para.add_run(f"  ·  {' · '.join(extra)}")
                set_font(cert_extra_run, font, body_size)