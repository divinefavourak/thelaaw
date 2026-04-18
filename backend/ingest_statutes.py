import os
import chromadb
from chromadb.utils import embedding_functions
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Use environment variable for the ChromaDB path
CHROMA_PATH = os.getenv("CHROMA_DB_PATH", "backend/data/chroma")

def ingest_statutes():
    # Initialize ChromaDB
    # Persist data to the path defined in environment or local default
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    
    # Use a simple embedding function
    embedding_func = embedding_functions.DefaultEmbeddingFunction()
    
    # Create or get collection
    collection = client.get_or_create_collection(
        name="nigerian_statutes",
        embedding_function=embedding_func
    )
    
    statutes_dir = "statutes"
    for filename in os.listdir(statutes_dir):
        if filename.endswith(".txt"):
            file_path = os.path.join(statutes_dir, filename)
            logger.info(f"Ingesting {filename}...")
            
            with open(file_path, "r") as f:
                content = f.read()
            
            # Simple chunking by Section
            chunks = content.split("\nSection ")
            
            documents = []
            metadatas = []
            ids = []
            
            # Add the first part (header)
            header = chunks[0]
            documents.append(header)
            metadatas.append({"source": filename, "section": "header"})
            ids.append(f"{filename}_header")
            
            # Add sections
            for i, chunk in enumerate(chunks[1:]):
                section_text = "Section " + chunk
                documents.append(section_text)
                
                # Extract section number if possible
                section_num = chunk.split(":")[0] if ":" in chunk else f"unknown_{i}"
                
                metadatas.append({
                    "source": filename, 
                    "section": section_num,
                    "jurisdiction": "lagos" if "lagos" in filename.lower() else "federal",
                    "domain": "tenancy" if "tenancy" in filename.lower() else "constitutional"
                })
                ids.append(f"{filename}_section_{i}")
            
            # Upsert into collection
            collection.upsert(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            logger.info(f"Finished ingesting {filename}. Added {len(documents)} chunks.")

if __name__ == "__main__":
    ingest_statutes()
