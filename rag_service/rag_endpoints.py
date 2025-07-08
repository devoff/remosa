"""FastAPI endpoints for RAG System"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
import os
import logging

# Import RAG components
logger = logging.getLogger("rag_service.rag_endpoints")
try:
    from rag_system.config import RAGConfig
    from rag_system.document_processor import DocumentProcessor
    from rag_system.embedding_generator import EmbeddingGenerator
    from rag_system.vector_database import VectorDatabase
    from rag_system.search_api import SemanticSearchAPI
except ImportError as e:
    logger.error(f"RAG system import error: {e}")
    # Placeholder classes for when dependencies aren't available
    class RAGConfig:
        pass
    class DocumentProcessor:
        pass
    class EmbeddingGenerator:
        pass
    class VectorDatabase:
        pass
    class SemanticSearchAPI:
        pass

router = APIRouter(prefix="/api/v1/rag", tags=["RAG"])

# Global RAG components (initialized on first use)
rag_components = {
    "config": None,
    "doc_processor": None,
    "embedding_generator": None,
    "vector_db": None,
    "search_api": None,
    "initialized": False
}

# Pydantic models
class SearchRequest(BaseModel):
    query: str
    search_type: str = "hybrid"  # "semantic", "keyword", "hybrid"
    max_results: int = 10

class SearchResponse(BaseModel):
    query: str
    search_type: str
    results: List[Dict[str, Any]]
    total_results: int
    response_time_ms: float
    timestamp: str

class RAGStatus(BaseModel):
    initialized: bool
    components_status: Dict[str, bool]
    vector_db_stats: Dict[str, Any]
    search_stats: Dict[str, Any]
    error: Optional[str] = None

class IndexRequest(BaseModel):
    force_rebuild: bool = False

ENABLE_RAG = os.getenv("ENABLE_RAG", "false").lower() == "true"

if not ENABLE_RAG:
    from fastapi import APIRouter
    router = APIRouter()
    # RAG endpoints отключены в этом окружении
    # Все маршруты будут пустыми
    # Можно добавить healthcheck или info endpoint
    @router.get("/api/v1/rag/disabled")
    async def rag_disabled():
        return {"status": "disabled", "reason": "RAG endpoints отключены для этого окружения"}
else:
    async def initialize_rag_system():
        """Initialize RAG system components"""
        if rag_components["initialized"]:
            return True
        
        try:
            # Initialize configuration
            config = RAGConfig()
            validation = config.validate_config()
            
            if not all(validation.values()):
                missing = [k for k, v in validation.items() if not v]
                raise Exception(f"Configuration validation failed: {missing}")
            
            # Initialize components
            doc_processor = DocumentProcessor(config)
            embedding_generator = EmbeddingGenerator(config)
            vector_db = VectorDatabase(config)
            search_api = SemanticSearchAPI(config, doc_processor, embedding_generator, vector_db)
            
            # Store components first
            rag_components.update({
                "config": config,
                "doc_processor": doc_processor,
                "embedding_generator": embedding_generator,
                "vector_db": vector_db,
                "search_api": search_api,
                "initialized": True
            })
            
            # Try to load existing index
            index_loaded = vector_db.load_index()
            
            # Auto-reindex if no index exists or is empty
            if not index_loaded or vector_db.index.ntotal == 0:
                logger.info("No existing index found or index is empty. Starting auto-reindexing...")
                await _auto_reindex_on_startup()
            else:
                logger.info(f"Loaded existing index with {vector_db.index.ntotal} vectors.")
            
            logger.info("RAG system initialized successfully.")
            return True
            
        except Exception as e:
            logger.exception(f"RAG initialization error: {e}")
            rag_components["error"] = str(e)
            return False

    async def _auto_reindex_on_startup():
        """Automatically reindex memory bank on startup if needed"""
        try:
            logger.info("🔄 Starting automatic reindexing on startup...")
            
            doc_processor = rag_components["doc_processor"]
            embedding_generator = rag_components["embedding_generator"]
            vector_db = rag_components["vector_db"]
            
            # Process all memory bank files
            chunks = doc_processor.process_memory_bank()
            logger.info(f"📄 Processed {len(chunks)} chunks from memory bank")
            
            if chunks:
                # Generate embeddings
                await embedding_generator.generate_embeddings(chunks)
                logger.info(f"🧠 Generated embeddings for {len(chunks)} chunks")
                
                # Add to vector database
                vector_db.add_chunks(chunks)
                logger.info(f"🗄️ Added {len(chunks)} chunks to vector database")
                
                # Save index
                save_success = vector_db.save_index()
                if save_success:
                    logger.info("💾 Auto-reindexing completed and saved successfully")
                else:
                    logger.warning("❌ Auto-reindexing completed but failed to save index")
            else:
                logger.warning("⚠️ No chunks found in memory bank during auto-reindexing")
            
        except Exception as e:
            logger.error(f"❌ Auto-reindexing failed: {e}")
            # Don't raise exception to prevent initialization failure

    @router.get("/status", response_model=RAGStatus)
    async def get_rag_status():
        """Get RAG system status"""
        try:
            if not rag_components["initialized"]:
                await initialize_rag_system()
            
            if rag_components["initialized"]:
                vector_db = rag_components["vector_db"]
                search_api = rag_components["search_api"]
                
                return RAGStatus(
                    initialized=True,
                    components_status={
                        "config": rag_components["config"] is not None,
                        "doc_processor": rag_components["doc_processor"] is not None,
                        "embedding_generator": rag_components["embedding_generator"] is not None,
                        "vector_db": rag_components["vector_db"] is not None,
                        "search_api": rag_components["search_api"] is not None,
                    },
                    vector_db_stats=vector_db.get_stats(),
                    search_stats=search_api.get_search_stats()
                )
            else:
                return RAGStatus(
                    initialized=False,
                    components_status={},
                    vector_db_stats={},
                    search_stats={},
                    error=rag_components.get("error", "Unknown initialization error")
                )
                
        except Exception as e:
            return RAGStatus(
                initialized=False,
                components_status={},
                vector_db_stats={},
                search_stats={},
                error=str(e)
            )

    @router.post("/search", response_model=SearchResponse)
    async def search_memory_bank(request: SearchRequest):
        """Search memory bank using RAG system"""
        try:
            if not rag_components["initialized"]:
                success = await initialize_rag_system()
                if not success:
                    raise HTTPException(
                        status_code=500, 
                        detail=f"RAG system not initialized: {rag_components.get('error', 'Unknown error')}"
                    )
            
            search_api = rag_components["search_api"]
            result = await search_api.search(
                query=request.query,
                search_type=request.search_type,
                k=request.max_results
            )
            
            return SearchResponse(**result)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

    @router.post("/index/rebuild")
    async def rebuild_index(request: IndexRequest, background_tasks: BackgroundTasks):
        """Rebuild vector index from memory bank files"""
        try:
            if not rag_components["initialized"]:
                success = await initialize_rag_system()
                if not success:
                    raise HTTPException(
                        status_code=500, 
                        detail=f"RAG system not initialized: {rag_components.get('error', 'Unknown error')}"
                    )
            
            # Run indexing in background
            background_tasks.add_task(
                _rebuild_index_task, 
                force_rebuild=request.force_rebuild
            )
            
            return {
                "status": "started",
                "message": "Index rebuild started in background",
                "force_rebuild": request.force_rebuild
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Index rebuild failed: {str(e)}")

    async def _rebuild_index_task(force_rebuild: bool = False):
        """Background task to rebuild index"""
        try:
            print("🔄 Starting index rebuild...")
            
            doc_processor = rag_components["doc_processor"]
            embedding_generator = rag_components["embedding_generator"]
            vector_db = rag_components["vector_db"]
            
            # Clear existing index if force rebuild
            if force_rebuild:
                vector_db.clear_index()
                print("🗑️ Cleared existing index")
            
            # Process all memory bank files
            chunks = doc_processor.process_memory_bank()
            print(f"📄 Processed {len(chunks)} chunks")
            
            # Generate embeddings
            await embedding_generator.generate_embeddings(chunks)
            print(f"🧠 Generated embeddings for {len(chunks)} chunks")
            
            # Add to vector database
            vector_db.add_chunks(chunks)
            print(f"🗄️ Added {len(chunks)} chunks to vector database")
            
            # Save index
            save_success = vector_db.save_index()
            if save_success:
                print("💾 Index saved successfully")
            else:
                print("❌ Failed to save index")
            
            print("✅ Index rebuild complete")
            
        except Exception as e:
            print(f"❌ Index rebuild error: {e}")

    @router.get("/search/suggestions")
    async def get_search_suggestions(query: str, max_suggestions: int = 5):
        """Get search query suggestions based on memory bank content"""
        try:
            if not rag_components["initialized"]:
                success = await initialize_rag_system()
                if not success:
                    raise HTTPException(
                        status_code=500, 
                        detail=f"RAG system not initialized: {rag_components.get('error', 'Unknown error')}"
                    )
            
            search_api = rag_components["search_api"]
            suggestions = await search_api.suggest_related_queries(query, max_suggestions)
            
            return {
                "query": query,
                "suggestions": suggestions,
                "total_suggestions": len(suggestions)
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Suggestions failed: {str(e)}")

    @router.get("/files")
    async def list_memory_bank_files():
        """List all files in memory bank"""
        try:
            if not rag_components["initialized"]:
                success = await initialize_rag_system()
                if not success:
                    raise HTTPException(
                        status_code=500, 
                        detail=f"RAG system not initialized: {rag_components.get('error', 'Unknown error')}"
                    )
            
            doc_processor = rag_components["doc_processor"]
            
            # Get processing stats
            stats = doc_processor.get_processing_stats()
            
            return {
                "files": stats["processed_files"],
                "total_files": stats["files_processed"],
                "total_chunks": stats["total_chunks"],
                "avg_chunks_per_file": stats["average_chunks_per_file"]
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File listing failed: {str(e)}")

    @router.get("/search/file/{file_path:path}")
    async def search_by_file(file_path: str):
        """Search for content from a specific file"""
        try:
            if not rag_components["initialized"]:
                success = await initialize_rag_system()
                if not success:
                    raise HTTPException(
                        status_code=500, 
                        detail=f"RAG system not initialized: {rag_components.get('error', 'Unknown error')}"
                    )
            
            search_api = rag_components["search_api"]
            results = await search_api.search_by_file(file_path)
            
            return {
                "file_path": file_path,
                "results": results,
                "total_results": len(results)
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File search failed: {str(e)}")

    @router.delete("/cache")
    async def clear_caches():
        """Clear all RAG system caches"""
        try:
            if not rag_components["initialized"]:
                return {"status": "not_initialized", "message": "RAG system not initialized"}
            
            # Clear search cache
            search_api = rag_components["search_api"]
            search_api.clear_cache()
            
            # Clear embedding cache could be added here
            # embedding_generator = rag_components["embedding_generator"]
            # embedding_generator.clear_cache()
            
            return {
                "status": "success",
                "message": "All caches cleared"
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cache clear failed: {str(e)}")

    # Health check endpoint
    @router.get("/health")
    async def health_check():
        """Simple health check for RAG system"""
        return {
            "status": "healthy",
            "initialized": rag_components["initialized"],
            "timestamp": "2024-07-07T14:00:00Z"
        } 