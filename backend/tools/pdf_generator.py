import os
import base64
import logging
from datetime import datetime
import weasyprint
import markdown
from jinja2 import Environment, FileSystemLoader

logger = logging.getLogger(__name__)

class PDFGenerator:
    def __init__(self, template_dir: str = "backend/templates", static_dir: str = "backend/static"):
        self.static_dir = static_dir
        os.makedirs(self.static_dir, exist_ok=True)
        self.jinja_env = Environment(loader=FileSystemLoader(template_dir))

    def generate_legal_document(self, doc_data: dict, user_facts: dict) -> str:
        """
        Converts agent Markdown to a styled PDF.
        Returns the filename.
        """
        try:
            doc_type = doc_data.get("document_type", "legal_document")
            md_content = doc_data.get("document_markdown", "")
            
            # Convert Markdown to HTML
            html_body = markdown.markdown(md_content)
            
            # Render through Jinja2 template
            template = self.jinja_env.get_template("letter.html")
            user_name = user_facts.get("parties", {}).get("user_role", "Citizen")
            
            full_html = template.render(
                document_type=doc_type,
                document_content=html_body,
                date=datetime.now().strftime("%B %d, %Y"),
                user_name=user_name
            )
            
            # Generate Filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{doc_type}_{timestamp}.pdf"
            file_path = os.path.join(self.static_dir, filename)
            
            # Write PDF
            weasyprint.HTML(string=full_html).write_pdf(file_path)
            
            logger.info(f"PDF Generated: {file_path}")
            return filename

        except Exception as e:
            logger.error(f"PDF Generation Error: {e}")
            return None

    def generate_legal_document_bytes(self, doc_data: dict, user_facts: dict) -> tuple[str, bytes]:
        """Returns (filename, pdf_bytes) without writing to disk."""
        try:
            doc_type = doc_data.get("document_type", "legal_document")
            md_content = doc_data.get("document_markdown", "")
            html_body = markdown.markdown(md_content)
            template = self.jinja_env.get_template("letter.html")
            user_name = user_facts.get("parties", {}).get("user_role", "Citizen")
            full_html = template.render(
                document_type=doc_type,
                document_content=html_body,
                date=datetime.now().strftime("%B %d, %Y"),
                user_name=user_name,
            )
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{doc_type}_{timestamp}.pdf"
            pdf_bytes = weasyprint.HTML(string=full_html).write_pdf()
            return filename, pdf_bytes
        except Exception as e:
            logger.error(f"PDF Generation Error: {e}")
            return None, None
