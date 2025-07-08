"""Document Processor for Memory Bank markdown files"""
import re
import hashlib
from typing import List, Dict, Any, Tuple
from pathlib import Path
from dataclasses import dataclass
from datetime import datetime

@dataclass
class DocumentChunk:
    """Represents a processed document chunk"""
    id: str
    content: str
    metadata: Dict[str, Any]
    embedding: List[float] = None

class DocumentProcessor:
    """Processes memory-bank markdown files into searchable chunks"""
    
    def __init__(self, config):
        self.config = config
        self.processed_files = {}
        
    def process_memory_bank(self) -> List[DocumentChunk]:
        """Process all markdown files in memory-bank directory"""
        chunks = []
        memory_bank_path = self.config.MEMORY_BANK_PATH
        
        if not memory_bank_path.exists():
            raise FileNotFoundError(f"Memory bank directory not found: {memory_bank_path}")
        
        # Process all markdown files recursively
        for md_file in memory_bank_path.rglob("*.md"):
            try:
                file_chunks = self._process_file(md_file)
                chunks.extend(file_chunks)
                print(f"Processed {md_file.name}: {len(file_chunks)} chunks")
            except Exception as e:
                print(f"Error processing {md_file}: {e}")
                
        print(f"Total processed: {len(chunks)} chunks from memory bank")
        return chunks
    
    def _process_file(self, file_path: Path) -> List[DocumentChunk]:
        """Process individual markdown file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Get file metadata
        file_stats = file_path.stat()
        relative_path = file_path.relative_to(self.config.MEMORY_BANK_PATH)
        
        base_metadata = {
            "file_path": str(relative_path),
            "file_name": file_path.name,
            "file_size": file_stats.st_size,
            "modified_time": datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
            "directory": str(relative_path.parent),
            "file_type": "markdown"
        }
        
        # Process file using markdown section-based chunking
        chunks = self._chunk_by_sections(content, base_metadata)
        
        # Store file processing info
        self.processed_files[str(relative_path)] = {
            "chunks_count": len(chunks),
            "processed_at": datetime.now().isoformat(),
            "file_hash": self._get_file_hash(content)
        }
        
        return chunks
    
    def _chunk_by_sections(self, content: str, base_metadata: Dict) -> List[DocumentChunk]:
        """Chunk content by markdown sections (## headers)"""
        chunks = []
        
        # Split by markdown headers (## or ###)
        sections = re.split(r'\n(#{2,3}\s+.*?)\n', content)
        
        current_section = ""
        current_header = "Introduction"
        
        for i, section in enumerate(sections):
            if re.match(r'^#{2,3}\s+', section):
                # This is a header
                if current_section.strip():
                    # Save previous section
                    chunk = self._create_chunk(
                        current_section.strip(), 
                        current_header, 
                        base_metadata, 
                        len(chunks)
                    )
                    chunks.append(chunk)
                
                current_header = section.strip('#').strip()
                current_section = ""
            else:
                # This is content
                current_section += section
        
        # Add final section
        if current_section.strip():
            chunk = self._create_chunk(
                current_section.strip(), 
                current_header, 
                base_metadata, 
                len(chunks)
            )
            chunks.append(chunk)
        
        # If no sections found, chunk by size
        if not chunks:
            chunks = self._chunk_by_size(content, base_metadata)
            
        return chunks
    
    def _chunk_by_size(self, content: str, base_metadata: Dict) -> List[DocumentChunk]:
        """Fallback: chunk content by character size"""
        chunks = []
        chunk_size = self.config.CHUNK_SIZE
        overlap = self.config.CHUNK_OVERLAP
        
        for i in range(0, len(content), chunk_size - overlap):
            chunk_text = content[i:i + chunk_size]
            if chunk_text.strip():
                chunk = self._create_chunk(
                    chunk_text.strip(),
                    f"Chunk {len(chunks) + 1}",
                    base_metadata,
                    len(chunks)
                )
                chunks.append(chunk)
                
        return chunks
    
    def _create_chunk(self, content: str, section_title: str, base_metadata: Dict, chunk_index: int) -> DocumentChunk:
        """Create a DocumentChunk with metadata"""
        chunk_id = self._generate_chunk_id(base_metadata["file_path"], section_title, chunk_index)
        
        metadata = {
            **base_metadata,
            "section_title": section_title,
            "chunk_index": chunk_index,
            "content_length": len(content),
            "word_count": len(content.split()),
            "chunk_id": chunk_id
        }
        
        return DocumentChunk(
            id=chunk_id,
            content=content,
            metadata=metadata
        )
    
    def _generate_chunk_id(self, file_path: str, section_title: str, chunk_index: int) -> str:
        """Generate unique chunk ID"""
        source = f"{file_path}:{section_title}:{chunk_index}"
        return hashlib.md5(source.encode()).hexdigest()[:12]
    
    def _get_file_hash(self, content: str) -> str:
        """Get file content hash for change detection"""
        return hashlib.md5(content.encode()).hexdigest()
    
    def get_processing_stats(self) -> Dict[str, Any]:
        """Get statistics about processed files"""
        total_chunks = sum(info["chunks_count"] for info in self.processed_files.values())
        
        return {
            "files_processed": len(self.processed_files),
            "total_chunks": total_chunks,
            "average_chunks_per_file": total_chunks / len(self.processed_files) if self.processed_files else 0,
            "processed_files": list(self.processed_files.keys())
        }
    
    def is_file_changed(self, file_path: Path) -> bool:
        """Check if file has changed since last processing"""
        relative_path = str(file_path.relative_to(self.config.MEMORY_BANK_PATH))
        
        if relative_path not in self.processed_files:
            return True
            
        with open(file_path, 'r', encoding='utf-8') as f:
            current_hash = self._get_file_hash(f.read())
            
        stored_hash = self.processed_files[relative_path]["file_hash"]
        return current_hash != stored_hash 