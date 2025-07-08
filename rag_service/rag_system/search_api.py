"""Semantic Search API for RAG System"""
import re
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import json

class SemanticSearchAPI:
    """High-level API for semantic search combining vector and keyword search"""
    
    def __init__(self, config, document_processor, embedding_generator, vector_database):
        self.config = config
        self.document_processor = document_processor
        self.embedding_generator = embedding_generator
        self.vector_database = vector_database
        
        self.search_cache = {}
        self.search_stats = {
            "total_searches": 0,
            "cache_hits": 0,
            "avg_response_time": 0,
            "semantic_searches": 0,
            "keyword_searches": 0,
            "hybrid_searches": 0
        }
    
    async def search(self, query: str, search_type: str = "hybrid", k: int = None) -> Dict[str, Any]:
        """Main search function with multiple search types"""
        start_time = datetime.now()
        
        if k is None:
            k = self.config.MAX_RESULTS
        
        # Check cache first
        cache_key = self._get_cache_key(query, search_type, k)
        if cache_key in self.search_cache:
            self.search_stats["cache_hits"] += 1
            self.search_stats["total_searches"] += 1
            return self.search_cache[cache_key]
        
        try:
            if search_type == "semantic":
                results = await self._semantic_search(query, k)
                self.search_stats["semantic_searches"] += 1
                
            elif search_type == "keyword":
                results = await self._keyword_search(query, k)
                self.search_stats["keyword_searches"] += 1
                
            elif search_type == "hybrid":
                results = await self._hybrid_search(query, k)
                self.search_stats["hybrid_searches"] += 1
                
            else:
                raise ValueError(f"Unknown search type: {search_type}")
            
            # Prepare response
            response = {
                "query": query,
                "search_type": search_type,
                "results": results,
                "total_results": len(results),
                "response_time_ms": (datetime.now() - start_time).total_seconds() * 1000,
                "timestamp": datetime.now().isoformat()
            }
            
            # Cache result
            self.search_cache[cache_key] = response
            
            # Update statistics
            self.search_stats["total_searches"] += 1
            self._update_avg_response_time(response["response_time_ms"])
            
            return response
            
        except Exception as e:
            print(f"Search error: {e}")
            return {
                "query": query,
                "search_type": search_type,
                "results": [],
                "total_results": 0,
                "error": str(e),
                "response_time_ms": (datetime.now() - start_time).total_seconds() * 1000,
                "timestamp": datetime.now().isoformat()
            }
    
    async def _semantic_search(self, query: str, k: int) -> List[Dict[str, Any]]:
        """Pure semantic search using embeddings"""
        # Generate query embedding
        query_embedding = await self.embedding_generator.generate_query_embedding(query)
        
        # Search vector database
        results = self.vector_database.search(query_embedding, k)
        
        # Enhance results with semantic relevance info
        for result in results:
            result["search_type"] = "semantic"
            result["relevance_source"] = "embedding_similarity"
        
        return results
    
    async def _keyword_search(self, query: str, k: int) -> List[Dict[str, Any]]:
        """Keyword-based search through document content"""
        query_terms = self._extract_keywords(query)
        results = []
        
        # Search through all stored metadata
        for idx, data in self.vector_database.metadata_store.items():
            content = data.get("content", "").lower()
            metadata = data.get("metadata", {})
            
            # Calculate keyword relevance score
            relevance_score = self._calculate_keyword_relevance(content, query_terms)
            
            if relevance_score > 0:
                result = {
                    **data,
                    "similarity_score": relevance_score,
                    "vector_index": idx,
                    "search_type": "keyword",
                    "relevance_source": "keyword_matching",
                    "matched_terms": self._get_matched_terms(content, query_terms)
                }
                results.append(result)
        
        # Sort by relevance and limit results
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results[:k]
    
    async def _hybrid_search(self, query: str, k: int) -> List[Dict[str, Any]]:
        """Hybrid search combining semantic and keyword approaches"""
        # Get semantic results
        semantic_results = await self._semantic_search(query, k * 2)  # Get more for ranking
        
        # Get keyword results
        keyword_results = await self._keyword_search(query, k * 2)
        
        # Combine and re-rank results
        combined_results = self._combine_search_results(
            semantic_results, 
            keyword_results, 
            self.config.HYBRID_SEARCH_WEIGHT
        )
        
        # Mark as hybrid search
        for result in combined_results:
            result["search_type"] = "hybrid"
            
        return combined_results[:k]
    
    def _combine_search_results(self, semantic_results: List, keyword_results: List, semantic_weight: float) -> List[Dict[str, Any]]:
        """Combine semantic and keyword search results with weighted scoring"""
        keyword_weight = 1.0 - semantic_weight
        
        # Create a dictionary to track unique results
        unique_results = {}
        
        # Add semantic results
        for result in semantic_results:
            chunk_id = result.get("chunk_id")
            if chunk_id:
                unique_results[chunk_id] = {
                    **result,
                    "semantic_score": result.get("similarity_score", 0),
                    "keyword_score": 0,
                    "relevance_source": "semantic"
                }
        
        # Add keyword results
        for result in keyword_results:
            chunk_id = result.get("chunk_id")
            if chunk_id:
                if chunk_id in unique_results:
                    # Update existing result with keyword score
                    unique_results[chunk_id]["keyword_score"] = result.get("similarity_score", 0)
                    unique_results[chunk_id]["relevance_source"] = "hybrid"
                    if "matched_terms" in result:
                        unique_results[chunk_id]["matched_terms"] = result["matched_terms"]
                else:
                    # Add new result from keyword search
                    unique_results[chunk_id] = {
                        **result,
                        "semantic_score": 0,
                        "keyword_score": result.get("similarity_score", 0),
                        "relevance_source": "keyword"
                    }
        
        # Calculate combined scores
        for result in unique_results.values():
            semantic_score = result.get("semantic_score", 0)
            keyword_score = result.get("keyword_score", 0)
            
            # Apply keyword boost if enabled
            if self.config.ENABLE_KEYWORD_BOOST and keyword_score > 0:
                keyword_score *= 1.5  # Boost keyword matches
            
            combined_score = (semantic_score * semantic_weight) + (keyword_score * keyword_weight)
            result["similarity_score"] = combined_score
            result["combined_score_breakdown"] = {
                "semantic": semantic_score,
                "keyword": keyword_score,
                "weights": {"semantic": semantic_weight, "keyword": keyword_weight}
            }
        
        # Sort by combined score
        results_list = list(unique_results.values())
        results_list.sort(key=lambda x: x["similarity_score"], reverse=True)
        
        # Filter by relevance threshold
        filtered_results = [
            result for result in results_list 
            if result["similarity_score"] >= self.config.RELEVANCE_THRESHOLD
        ]
        
        return filtered_results
    
    def _extract_keywords(self, query: str) -> List[str]:
        """Extract meaningful keywords from query"""
        # Simple keyword extraction - can be enhanced
        words = re.findall(r'\b\w+\b', query.lower())
        
        # Filter out common stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 
            'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'как', 'что', 'где', 'когда', 'кто', 'почему', 'и', 'или', 'но', 'в', 
            'на', 'для', 'от', 'до', 'по', 'при', 'это', 'то', 'как', 'если'
        }
        
        keywords = [word for word in words if word not in stop_words and len(word) > 2]
        return keywords
    
    def _calculate_keyword_relevance(self, content: str, keywords: List[str]) -> float:
        """Calculate relevance score based on keyword matching"""
        if not keywords:
            return 0
        
        content_lower = content.lower()
        matches = 0
        total_positions = 0
        
        for keyword in keywords:
            if keyword in content_lower:
                matches += 1
                # Count occurrences
                occurrences = content_lower.count(keyword)
                total_positions += occurrences
        
        # Calculate score based on match ratio and frequency
        match_ratio = matches / len(keywords)
        frequency_bonus = min(total_positions / len(keywords), 2.0)  # Cap bonus at 2x
        
        relevance_score = match_ratio * frequency_bonus
        return min(relevance_score, 1.0)  # Cap at 1.0
    
    def _get_matched_terms(self, content: str, keywords: List[str]) -> List[str]:
        """Get list of keywords that matched in content"""
        content_lower = content.lower()
        matched = [keyword for keyword in keywords if keyword in content_lower]
        return matched
    
    def _get_cache_key(self, query: str, search_type: str, k: int) -> str:
        """Generate cache key for search query"""
        import hashlib
        key_string = f"{query}:{search_type}:{k}"
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def _update_avg_response_time(self, response_time: float) -> None:
        """Update average response time"""
        total_searches = self.search_stats["total_searches"]
        current_avg = self.search_stats["avg_response_time"]
        
        # Calculate new average
        new_avg = ((current_avg * (total_searches - 1)) + response_time) / total_searches
        self.search_stats["avg_response_time"] = new_avg
    
    async def search_by_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Search for all chunks from a specific file"""
        results = self.vector_database.search_by_metadata(file_path=file_path)
        
        # Sort by chunk index for logical order
        results.sort(key=lambda x: x.get("metadata", {}).get("chunk_index", 0))
        
        return results
    
    async def search_by_section(self, section_title: str) -> List[Dict[str, Any]]:
        """Search for chunks by section title"""
        results = []
        
        for idx, data in self.vector_database.metadata_store.items():
            metadata = data.get("metadata", {})
            if section_title.lower() in metadata.get("section_title", "").lower():
                results.append({
                    **data,
                    "vector_index": idx,
                    "search_type": "section_search"
                })
        
        return results
    
    def get_search_stats(self) -> Dict[str, Any]:
        """Get search statistics"""
        return {
            **self.search_stats,
            "cache_size": len(self.search_cache),
            "cache_hit_rate": (
                self.search_stats["cache_hits"] / self.search_stats["total_searches"]
                if self.search_stats["total_searches"] > 0 else 0
            )
        }
    
    def clear_cache(self) -> None:
        """Clear search cache"""
        self.search_cache = {}
        print("Search cache cleared")
    
    async def suggest_related_queries(self, query: str, max_suggestions: int = 5) -> List[str]:
        """Suggest related queries based on memory bank content"""
        # Simple implementation - can be enhanced with ML
        keywords = self._extract_keywords(query)
        suggestions = []
        
        # Find documents with similar keywords
        for data in self.vector_database.metadata_store.values():
            content = data.get("content", "").lower()
            section_title = data.get("metadata", {}).get("section_title", "")
            
            # Check for keyword overlap
            content_keywords = self._extract_keywords(content)
            overlap = set(keywords) & set(content_keywords)
            
            if len(overlap) >= 1 and section_title:
                suggestion = f"Как работает {section_title.lower()}?"
                if suggestion not in suggestions:
                    suggestions.append(suggestion)
        
        return suggestions[:max_suggestions] 