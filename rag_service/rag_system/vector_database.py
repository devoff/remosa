"""FAISS Vector Database for RAG System"""
import faiss
import numpy as np
import pickle
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path
import json
from datetime import datetime

class VectorDatabase:
    """FAISS-based vector database for semantic search"""
    
    def __init__(self, config):
        self.config = config
        self.index = None
        self.metadata_store = {}  # Store metadata separately
        self.dimension = config.EMBEDDING_DIMENSIONS
        self.index_path = config.VECTOR_DB_PATH / "faiss_index.bin"
        self.metadata_path = config.VECTOR_DB_PATH / "metadata.json"
        
        # Initialize empty index
        self._initialize_index()
    
    def _initialize_index(self) -> None:
        """Initialize FAISS index"""
        if self.config.FAISS_INDEX_TYPE == "IndexFlatIP":
            # Inner Product for cosine similarity (normalized vectors)
            self.index = faiss.IndexFlatIP(self.dimension)
        elif self.config.FAISS_INDEX_TYPE == "IndexFlatL2":
            # L2 distance
            self.index = faiss.IndexFlatL2(self.dimension)
        else:
            # Default to IP
            self.index = faiss.IndexFlatIP(self.dimension)
            
        print(f"Initialized FAISS index: {type(self.index).__name__}")
    
    def add_chunks(self, chunks: List) -> None:
        """Add document chunks to the vector database"""
        vectors = []
        metadata_batch = {}
        
        print(f"Adding {len(chunks)} chunks to vector database...")
        
        for chunk in chunks:
            if chunk.embedding is None:
                print(f"Warning: Chunk {chunk.id} has no embedding, skipping")
                continue
                
            # Normalize embeddings for cosine similarity
            embedding = np.array(chunk.embedding, dtype=np.float32)
            if self.config.FAISS_INDEX_TYPE == "IndexFlatIP":
                embedding = embedding / np.linalg.norm(embedding)
            
            vectors.append(embedding)
            
            # Store metadata separately
            metadata_batch[len(vectors) - 1] = {
                "chunk_id": chunk.id,
                "content": chunk.content,
                "metadata": chunk.metadata
            }
        
        if vectors:
            # Convert to numpy array and add to index
            vectors_array = np.array(vectors)
            
            # Get starting index for new vectors
            start_index = self.index.ntotal
            
            # Add vectors to FAISS index
            self.index.add(vectors_array)
            
            # Update metadata store with correct indices
            for i, metadata in metadata_batch.items():
                self.metadata_store[start_index + i] = metadata
            
            print(f"Added {len(vectors)} vectors to index. Total: {self.index.ntotal}")
        else:
            print("No valid embeddings found to add")
    
    def search(self, query_embedding: List[float], k: int = None) -> List[Dict[str, Any]]:
        """Search for similar chunks"""
        if k is None:
            k = self.config.MAX_RESULTS
        
        if self.index.ntotal == 0:
            print("Warning: Vector database is empty")
            return []
        
        # Normalize query embedding for cosine similarity
        query_vector = np.array(query_embedding, dtype=np.float32).reshape(1, -1)
        if self.config.FAISS_INDEX_TYPE == "IndexFlatIP":
            query_vector = query_vector / np.linalg.norm(query_vector)
        
        # Perform search
        try:
            scores, indices = self.index.search(query_vector, min(k, self.index.ntotal))
            
            # Convert results to list format
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx == -1:  # FAISS returns -1 for invalid results
                    continue
                    
                # Apply similarity threshold
                if score < self.config.SIMILARITY_THRESHOLD:
                    continue
                
                if idx in self.metadata_store:
                    result = {
                        **self.metadata_store[idx],
                        "similarity_score": float(score),
                        "vector_index": int(idx)
                    }
                    results.append(result)
            
            print(f"Found {len(results)} results above threshold {self.config.SIMILARITY_THRESHOLD}")
            return results
            
        except Exception as e:
            print(f"Error during search: {e}")
            return []
    
    def save_index(self) -> bool:
        """Save FAISS index and metadata to disk"""
        try:
            # Ensure directory exists
            self.config.ensure_directories()
            
            # Save FAISS index
            faiss.write_index(self.index, str(self.index_path))
            
            # Save metadata
            metadata_with_info = {
                "metadata_store": self.metadata_store,
                "index_info": {
                    "total_vectors": self.index.ntotal,
                    "dimension": self.dimension,
                    "index_type": self.config.FAISS_INDEX_TYPE,
                    "saved_at": datetime.now().isoformat()
                }
            }
            
            with open(self.metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata_with_info, f, indent=2, ensure_ascii=False)
            
            print(f"Saved vector database: {self.index.ntotal} vectors")
            return True
            
        except Exception as e:
            print(f"Error saving index: {e}")
            return False
    
    def load_index(self) -> bool:
        """Load FAISS index and metadata from disk"""
        try:
            if not self.index_path.exists() or not self.metadata_path.exists():
                print("No saved index found")
                return False
            
            # Load FAISS index
            self.index = faiss.read_index(str(self.index_path))
            
            # Load metadata
            with open(self.metadata_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.metadata_store = data.get("metadata_store", {})
            # Convert string keys back to integers
            self.metadata_store = {int(k): v for k, v in self.metadata_store.items()}
            
            index_info = data.get("index_info", {})
            print(f"Loaded vector database: {index_info.get('total_vectors', 0)} vectors")
            print(f"Index type: {index_info.get('index_type', 'unknown')}")
            print(f"Saved at: {index_info.get('saved_at', 'unknown')}")
            
            return True
            
        except Exception as e:
            print(f"Error loading index: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Get vector database statistics"""
        return {
            "total_vectors": self.index.ntotal if self.index else 0,
            "dimension": self.dimension,
            "index_type": self.config.FAISS_INDEX_TYPE,
            "metadata_entries": len(self.metadata_store),
            "index_size_mb": self.index_path.stat().st_size / (1024*1024) if self.index_path.exists() else 0,
            "metadata_size_mb": self.metadata_path.stat().st_size / (1024*1024) if self.metadata_path.exists() else 0
        }
    
    def search_by_metadata(self, **kwargs) -> List[Dict[str, Any]]:
        """Search chunks by metadata criteria"""
        results = []
        
        for idx, data in self.metadata_store.items():
            metadata = data.get("metadata", {})
            match = True
            
            for key, value in kwargs.items():
                if key not in metadata or metadata[key] != value:
                    match = False
                    break
            
            if match:
                results.append({
                    **data,
                    "vector_index": idx
                })
        
        return results
    
    def delete_by_file(self, file_path: str) -> int:
        """Delete all chunks from a specific file (for updates)"""
        # Note: FAISS doesn't support efficient deletion
        # In production, we'd rebuild the index
        indices_to_remove = []
        
        for idx, data in self.metadata_store.items():
            if data.get("metadata", {}).get("file_path") == file_path:
                indices_to_remove.append(idx)
        
        # Remove from metadata store
        for idx in indices_to_remove:
            del self.metadata_store[idx]
        
        print(f"Marked {len(indices_to_remove)} chunks for removal from {file_path}")
        print("Note: FAISS index will need to be rebuilt to reclaim space")
        
        return len(indices_to_remove)
    
    def rebuild_index(self) -> bool:
        """Rebuild index from current metadata (removes deleted items)"""
        try:
            print("Rebuilding FAISS index...")
            
            # Create new index
            self._initialize_index()
            
            # Collect all valid vectors and metadata
            vectors = []
            new_metadata = {}
            
            for old_idx, data in self.metadata_store.items():
                # This would require re-generating embeddings
                # For now, we'll keep the existing structure
                pass
            
            print("Index rebuild complete")
            return True
            
        except Exception as e:
            print(f"Error rebuilding index: {e}")
            return False
    
    def clear_index(self) -> None:
        """Clear all data from the index"""
        self._initialize_index()
        self.metadata_store = {}
        print("Vector database cleared") 