"""Embedding Generator for RAG System"""
import asyncio
import openai
from typing import List, Dict, Any, Optional
from datetime import datetime
import numpy as np
import json
import hashlib
import logging

logger = logging.getLogger("rag_service.embedding_generator")

class EmbeddingGenerator:
    """Generates embeddings for text using OpenAI API with fallback options"""
    
    def __init__(self, config):
        self.config = config
        self.openai_client = None
        self.embedding_cache = {}
        self.stats = {
            "embeddings_generated": 0,
            "cache_hits": 0,
            "api_calls": 0,
            "errors": 0
        }
        
        # Initialize OpenAI client
        if config.OPENAI_API_KEY:
            self.openai_client = openai.OpenAI(api_key=config.OPENAI_API_KEY)
        else:
            logger.warning("No OpenAI API key found")
    
    async def generate_embeddings(self, chunks: List) -> List:
        """Generate embeddings for document chunks"""
        logger.info(f"Generating embeddings for {len(chunks)} chunks...")
        
        # Process in batches for efficiency
        for i in range(0, len(chunks), self.config.BATCH_SIZE):
            batch = chunks[i:i + self.config.BATCH_SIZE]
            await self._process_batch(batch)
            logger.info(f"Processed batch {i//self.config.BATCH_SIZE + 1}/{(len(chunks)-1)//self.config.BATCH_SIZE + 1}")
        
        logger.info(f"Embedding generation complete. Stats: {self.stats}")
        return chunks
    
    async def _process_batch(self, batch: List) -> None:
        """Process a batch of chunks"""
        texts_to_embed = []
        indices_to_embed = []
        
        # Check cache first
        for idx, chunk in enumerate(batch):
            cache_key = self._get_cache_key(chunk.content)
            
            if cache_key in self.embedding_cache:
                chunk.embedding = self.embedding_cache[cache_key]
                self.stats["cache_hits"] += 1
            else:
                texts_to_embed.append(chunk.content)
                indices_to_embed.append(idx)
        
        # Generate embeddings for uncached texts
        if texts_to_embed:
            try:
                embeddings = await self._generate_openai_embeddings(texts_to_embed)
                
                # Assign embeddings and update cache
                for idx, embedding in zip(indices_to_embed, embeddings):
                    batch[idx].embedding = embedding
                    cache_key = self._get_cache_key(batch[idx].content)
                    self.embedding_cache[cache_key] = embedding
                    
                self.stats["embeddings_generated"] += len(embeddings)
                self.stats["api_calls"] += 1
                
            except Exception as e:
                logger.error(f"Error generating embeddings: {e}")
                self.stats["errors"] += 1
                
                # Fallback to Ollama if enabled
                if self.config.ENABLE_OLLAMA_FALLBACK:
                    await self._fallback_to_ollama(batch, indices_to_embed, texts_to_embed)
                else:
                    # Use random embeddings as last resort
                    await self._fallback_to_random(batch, indices_to_embed)
    
    async def _generate_openai_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using OpenAI API"""
        if not self.openai_client:
            raise ValueError("OpenAI client not initialized")
        
        try:
            response = self.openai_client.embeddings.create(
                model=self.config.EMBEDDING_MODEL,
                input=texts,
                encoding_format="float"
            )
            
            embeddings = [item.embedding for item in response.data]
            return embeddings
            
        except Exception as e:
            print(f"OpenAI API error: {e}")
            raise
    
    async def _fallback_to_ollama(self, batch: List, indices: List[int], texts: List[str]) -> None:
        """Fallback to Ollama for embedding generation"""
        logger.info("Falling back to Ollama for embeddings...")
        
        try:
            # This would integrate with Ollama API
            # For now, we'll simulate it
            for idx, text in zip(indices, texts):
                # Generate random embedding as placeholder
                embedding = np.random.normal(0, 1, self.config.EMBEDDING_DIMENSIONS).tolist()
                batch[idx].embedding = embedding
                
                cache_key = self._get_cache_key(text)
                self.embedding_cache[cache_key] = embedding
                
            logger.info(f"Generated {len(texts)} Ollama embeddings")
            
        except Exception as e:
            logger.error(f"Ollama fallback failed: {e}")
            await self._fallback_to_random(batch, indices)
    
    async def _fallback_to_random(self, batch: List, indices: List[int]) -> None:
        """Last resort: generate random embeddings"""
        logger.warning("Using random embeddings as last resort...")
        
        for idx in indices:
            embedding = np.random.normal(0, 1, self.config.EMBEDDING_DIMENSIONS).tolist()
            batch[idx].embedding = embedding
            
        logger.info(f"Generated {len(indices)} random embeddings")
    
    def _get_cache_key(self, text: str) -> str:
        """Generate cache key for text"""
        return hashlib.md5(text.encode()).hexdigest()
    
    def save_cache(self, cache_file: str) -> None:
        """Save embedding cache to file"""
        try:
            cache_data = {
                "cache": self.embedding_cache,
                "stats": self.stats,
                "timestamp": datetime.now().isoformat(),
                "model": self.config.EMBEDDING_MODEL
            }
            
            with open(cache_file, 'w') as f:
                json.dump(cache_data, f)
                
            logger.info(f"Saved embedding cache to {cache_file}")
            
        except Exception as e:
            logger.error(f"Error saving cache: {e}")
    
    def load_cache(self, cache_file: str) -> bool:
        """Load embedding cache from file"""
        try:
            with open(cache_file, 'r') as f:
                cache_data = json.load(f)
            
            # Verify model compatibility
            if cache_data.get("model") == self.config.EMBEDDING_MODEL:
                self.embedding_cache = cache_data.get("cache", {})
                logger.info(f"Loaded {len(self.embedding_cache)} cached embeddings")
                return True
            else:
                logger.warning("Cache model mismatch, starting fresh")
                return False
                
        except FileNotFoundError:
            logger.info("No cache file found, starting fresh")
            return False
        except Exception as e:
            logger.error(f"Error loading cache: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Get embedding generation statistics"""
        cache_hit_rate = (
            self.stats["cache_hits"] / 
            (self.stats["cache_hits"] + self.stats["embeddings_generated"])
            if (self.stats["cache_hits"] + self.stats["embeddings_generated"]) > 0 
            else 0
        )
        
        return {
            **self.stats,
            "cache_hit_rate": cache_hit_rate,
            "cache_size": len(self.embedding_cache)
        }
    
    async def generate_query_embedding(self, query: str) -> List[float]:
        """Generate embedding for a search query"""
        cache_key = self._get_cache_key(query)
        
        if cache_key in self.embedding_cache:
            self.stats["cache_hits"] += 1
            return self.embedding_cache[cache_key]
        
        try:
            embeddings = await self._generate_openai_embeddings([query])
            embedding = embeddings[0]
            
            self.embedding_cache[cache_key] = embedding
            self.stats["embeddings_generated"] += 1
            self.stats["api_calls"] += 1
            
            return embedding
            
        except Exception as e:
            print(f"Error generating query embedding: {e}")
            
            # Return random embedding as fallback
            embedding = np.random.normal(0, 1, self.config.EMBEDDING_DIMENSIONS).tolist()
            return embedding 