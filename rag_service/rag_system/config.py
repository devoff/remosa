"""Configuration for RAG System"""
import os
from typing import List, Dict, Any
from pathlib import Path
import logging

logger = logging.getLogger("rag_service.config")

class RAGConfig:
    """Configuration settings for RAG system"""
    
    # Paths (configurable through env)
    MEMORY_BANK_PATH = Path(os.getenv("MEMORY_BANK_PATH", "/app/memory-bank"))
    VECTOR_DB_PATH = Path(os.getenv("VECTOR_DB_PATH", "/app/rag_system/data/vector_db"))
    CACHE_PATH = Path(os.getenv("CACHE_PATH", "/app/rag_system/data/cache"))
    
    # OpenAI Settings
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    EMBEDDING_MODEL = "text-embedding-3-small"
    EMBEDDING_DIMENSIONS = 1536
    
    # FAISS Settings
    FAISS_INDEX_TYPE = "IndexFlatIP"  # Inner Product for cosine similarity
    SIMILARITY_THRESHOLD = 0.3
    MAX_RESULTS = 10
    
    # Document Processing
    CHUNK_SIZE = 1000  # characters per chunk
    CHUNK_OVERLAP = 200  # overlap between chunks
    SUPPORTED_EXTENSIONS = [".md", ".txt"]
    
    # Search Settings
    HYBRID_SEARCH_WEIGHT = 0.7  # 70% semantic, 30% keyword
    ENABLE_KEYWORD_BOOST = True
    RELEVANCE_THRESHOLD = 0.6
    
    # Performance
    BATCH_SIZE = 32  # for embedding generation
    CACHE_TTL = 3600  # 1 hour cache
    MAX_CACHE_SIZE = 1000  # number of cached results
    
    # Context7 Integration
    CONTEXT7_SERVERS = [
        {"name": "strapi", "version": "9.9", "available": True},
        {"name": "datadog", "version": "9.4", "available": True},
        {"name": "temporal", "version": "9.5", "available": True}
    ]
    
    # Fallback Settings
    ENABLE_OLLAMA_FALLBACK = False
    OLLAMA_MODEL = "nomic-embed-text"
    MAX_RETRY_ATTEMPTS = 3
    
    @classmethod
    def ensure_directories(cls):
        """Ensure all required directories exist"""
        try:
            cls.VECTOR_DB_PATH.mkdir(parents=True, exist_ok=True)
            cls.CACHE_PATH.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            logger.error(f"Failed to create directories: {e}")
            raise
        
    @classmethod
    def validate_config(cls) -> Dict[str, bool]:
        """Validate configuration and return status"""
        validation = {
            "memory_bank_exists": cls.MEMORY_BANK_PATH.exists(),
            "openai_key_available": bool(cls.OPENAI_API_KEY),
            "directories_created": True
        }
        
        try:
            cls.ensure_directories()
        except Exception:
            validation["directories_created"] = False
            logger.error("Directory creation failed during config validation.")
            
        return validation 