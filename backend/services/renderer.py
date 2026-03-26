import io
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from models.schema import CVProfile
from templates.config import TEMPLATES, DEFAULT_TEMPLATE
from templates.base import set_font, add_section_heading, add_bullet

def render_cv(profile: CVProfile, template_name: str = DEFAULT_TEMPLATE) -> bytes:
    config = TEMPLATES.get(template_name, TEMPLATES[DEFAULT_TEMPLATE])
    doc = Document()

    # --- Page margins ---
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)

    # --- Remove default paragraph spacing ---
    style = doc.styles["Normal"]
    style.paragraph_format.space_before = Pt(0)
    style.paragraph_format.space_after = Pt(0)

    # --- NAME ---
    name_para = doc.add_paragraph()
    name_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    name_run = name_para.add_run(profile.name)
    set_font(name_run, config["font_name"], config["font_size_name"], bold=True)

    # --- TITLE ---
    title_para = doc.add_paragraph()
    title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_para.add_run(profile.title)
    set_font(title_run, config["font_name"], config["font_size_title"], color_hex=config["color_contact"])

    # --- CONTACT ---
    contact = profile.contact
    contact_parts = [contact.email, contact.phone, contact.location]
    if contact.linkedin:
        contact_parts.append(contact.linkedin)
    contact_line = "  |  ".join(contact_parts)
    contact_para = doc.add_paragraph()
    contact_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    contact_run = contact_para.add_run(contact_line)
    set_font(contact_run, config["font_name"], config["font_size_contact"], color_hex=config["color_contact"])

    # --- SUMMARY ---
    if profile.summary:
        add_section_heading(doc, "Summary", config)
        summary_para = doc.add_paragraph()
        summary_run = summary_para.add_run(profile.summary)
        set_font(summary_run, config["font_name"], config["font_size_body"])

    # --- EXPERIENCE ---
    if profile.experience:
        add_section_heading(doc, "Experience", config)
        for job in profile.experience:
            # Company + dates on same line
            job_para = doc.add_paragraph()
            job_para.paragraph_format.space_before = Pt(6)
            company_run = job_para.add_run(job.company)
            set_font(company_run, config["font_name"], config["font_size_body"], bold=True)

            date_str = f"  |  {job.start} – {job.end}"
            date_run = job_para.add_run(date_str)
            set_font(date_run, config["font_name"], config["font_size_body"], color_hex=config["color_contact"])

            # Title + location
            role_para = doc.add_paragraph()
            role_run = role_para.add_run(f"{job.title}  ·  {job.location}")
            set_font(role_run, config["font_name"], config["font_size_body"], bold=False)
            role_run.italic = True

            # Bullets
            for bullet in job.bullets:
                add_bullet(doc, bullet, config)

    # --- EDUCATION ---
    if profile.education:
        add_section_heading(doc, "Education", config)
        for edu in profile.education:
            edu_para = doc.add_paragraph()
            edu_para.paragraph_format.space_before = Pt(4)
            inst_run = edu_para.add_run(edu.institution)
            set_font(inst_run, config["font_name"], config["font_size_body"], bold=True)

            degree_str = f"  |  {edu.degree} in {edu.field}  ·  {edu.year}"
            degree_run = edu_para.add_run(degree_str)
            set_font(degree_run, config["font_name"], config["font_size_body"])

    # --- SKILLS ---
    if profile.skills:
        add_section_heading(doc, "Skills", config)
        skills_para = doc.add_paragraph()
        skills_run = skills_para.add_run("  ·  ".join(profile.skills))
        set_font(skills_run, config["font_name"], config["font_size_body"])

    # --- CERTIFICATIONS ---
    if profile.certifications:
        add_section_heading(doc, "Certifications", config)
        for cert in profile.certifications:
            cert_para = doc.add_paragraph()
            cert_para.paragraph_format.space_before = Pt(4)
            cert_name_run = cert_para.add_run(cert.name)
            set_font(cert_name_run, config["font_name"], config["font_size_body"], bold=True)
            if cert.issuer or cert.year:
                extra = []
                if cert.issuer:
                    extra.append(cert.issuer)
                if cert.year:
                    extra.append(cert.year)
                cert_extra_run = cert_para.add_run(f"  ·  {' · '.join(extra)}")
                set_font(cert_extra_run, config["font_name"], config["font_size_body"])

    # --- Save to bytes ---
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.read()