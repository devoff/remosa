#!/usr/bin/env python3
"""Test script for RAG System"""
import asyncio
import sys
import os
from pathlib import Path

# Add backend to path for imports
sys.path.append('/opt/remosa/backend')

from rag_system.config import RAGConfig
from rag_system.document_processor import DocumentProcessor
from rag_system.embedding_generator import EmbeddingGenerator
from rag_system.vector_database import VectorDatabase
from rag_system.search_api import SemanticSearchAPI

async def test_rag_system():
    """Test the complete RAG system"""
    print("🧪 Testing RAG System for REMOSA Memory Bank")
    print("=" * 60)
    
    # Initialize configuration
    config = RAGConfig()
    
    # Validate configuration
    print("📋 Validating Configuration...")
    validation = config.validate_config()
    for check, status in validation.items():
        status_icon = "✅" if status else "❌"
        print(f"  {status_icon} {check}: {status}")
    
    if not all(validation.values()):
        print("❌ Configuration validation failed!")
        return False
    
    print("\n🔧 Initializing RAG Components...")
    
    # Initialize components
    doc_processor = DocumentProcessor(config)
    embedding_generator = EmbeddingGenerator(config)
    vector_db = VectorDatabase(config)
    search_api = SemanticSearchAPI(config, doc_processor, embedding_generator, vector_db)
    
    print("✅ All components initialized")
    
    # Test 1: Document Processing
    print("\n📄 Testing Document Processing...")
    try:
        chunks = doc_processor.process_memory_bank()
        print(f"✅ Processed {len(chunks)} chunks")
        
        # Show processing stats
        stats = doc_processor.get_processing_stats()
        print(f"  📊 Files processed: {stats['files_processed']}")
        print(f"  📊 Average chunks per file: {stats['average_chunks_per_file']:.1f}")
        
        if len(chunks) == 0:
            print("❌ No chunks processed!")
            return False
            
    except Exception as e:
        print(f"❌ Document processing failed: {e}")
        return False
    
    # Test 2: Embedding Generation
    print("\n🧠 Testing Embedding Generation...")
    try:
        # Test with first few chunks to save API calls
        test_chunks = chunks[:5]  # Only test with 5 chunks
        print(f"  Testing with {len(test_chunks)} chunks to save API costs...")
        
        await embedding_generator.generate_embeddings(test_chunks)
        
        # Check if embeddings were generated
        embeddings_count = sum(1 for chunk in test_chunks if chunk.embedding is not None)
        print(f"✅ Generated {embeddings_count}/{len(test_chunks)} embeddings")
        
        # Show embedding stats
        stats = embedding_generator.get_stats()
        print(f"  📊 Cache hit rate: {stats['cache_hit_rate']:.2%}")
        print(f"  📊 API calls: {stats['api_calls']}")
        
        if embeddings_count == 0:
            print("❌ No embeddings generated!")
            return False
            
    except Exception as e:
        print(f"❌ Embedding generation failed: {e}")
        return False
    
    # Test 3: Vector Database
    print("\n🗄️ Testing Vector Database...")
    try:
        # Add test chunks to vector database
        vector_db.add_chunks(test_chunks)
        
        # Save index
        save_success = vector_db.save_index()
        print(f"✅ Vector database save: {'success' if save_success else 'failed'}")
        
        # Show database stats
        stats = vector_db.get_stats()
        print(f"  📊 Total vectors: {stats['total_vectors']}")
        print(f"  📊 Index size: {stats['index_size_mb']:.2f} MB")
        
        if stats['total_vectors'] == 0:
            print("❌ No vectors in database!")
            return False
            
    except Exception as e:
        print(f"❌ Vector database failed: {e}")
        return False
    
    # Test 4: Search API
    print("\n🔍 Testing Search API...")
    try:
        # Test queries related to REMOSA memory bank
        test_queries = [
            "как настроить систему мониторинга",
            "архитектура приложения",
            "jobs система prometheus",
            "docker конфигурация",
            "database setup"
        ]
        
        print(f"  Testing {len(test_queries)} search queries...")
        
        for i, query in enumerate(test_queries, 1):
            print(f"\n  🔍 Query {i}: '{query}'")
            
            # Test semantic search
            semantic_result = await search_api.search(query, search_type="semantic", k=3)
            print(f"    📋 Semantic: {semantic_result['total_results']} results")
            print(f"    ⏱️ Time: {semantic_result['response_time_ms']:.1f}ms")
            
            # Show top result if available
            if semantic_result['results']:
                top_result = semantic_result['results'][0]
                print(f"    🎯 Top match: {top_result['metadata']['section_title']}")
                print(f"    📊 Score: {top_result['similarity_score']:.3f}")
            
            # Test hybrid search
            hybrid_result = await search_api.search(query, search_type="hybrid", k=3)
            print(f"    🔀 Hybrid: {hybrid_result['total_results']} results")
            
    except Exception as e:
        print(f"❌ Search API failed: {e}")
        return False
    
    # Test 5: Performance Stats
    print("\n📊 Performance Statistics...")
    try:
        search_stats = search_api.get_search_stats()
        print(f"  🔍 Total searches: {search_stats['total_searches']}")
        print(f"  ⚡ Avg response time: {search_stats['avg_response_time']:.1f}ms")
        print(f"  💾 Cache hit rate: {search_stats['cache_hit_rate']:.2%}")
        
        embedding_stats = embedding_generator.get_stats()
        print(f"  🧠 Embeddings generated: {embedding_stats['embeddings_generated']}")
        print(f"  💰 API calls made: {embedding_stats['api_calls']}")
        
        db_stats = vector_db.get_stats()
        print(f"  🗄️ Vector database size: {db_stats['index_size_mb']:.2f} MB")
        
    except Exception as e:
        print(f"❌ Stats collection failed: {e}")
        return False
    
    print("\n✅ RAG System Test Complete!")
    print("🎉 All components working correctly")
    return True

async def demo_search():
    """Demonstrate search capabilities"""
    print("\n🎭 RAG System Demo")
    print("=" * 40)
    
    # Quick setup for demo
    config = RAGConfig()
    
    # Try to load existing index
    vector_db = VectorDatabase(config)
    if vector_db.load_index():
        print("✅ Loaded existing vector database")
        
        embedding_generator = EmbeddingGenerator(config)
        doc_processor = DocumentProcessor(config)
        search_api = SemanticSearchAPI(config, doc_processor, embedding_generator, vector_db)
        
        # Interactive search demo
        print("\n🔍 Interactive Search Demo")
        print("Type your queries (or 'quit' to exit):")
        
        while True:
            try:
                query = input("\n🔍 Query: ").strip()
                if query.lower() in ['quit', 'exit', 'q']:
                    break
                
                if not query:
                    continue
                
                # Perform search
                result = await search_api.search(query, search_type="hybrid")
                
                print(f"\n📋 Found {result['total_results']} results ({result['response_time_ms']:.1f}ms)")
                
                # Show top 3 results
                for i, item in enumerate(result['results'][:3], 1):
                    print(f"\n  {i}. {item['metadata']['section_title']}")
                    print(f"     📁 {item['metadata']['file_name']}")
                    print(f"     📊 Score: {item['similarity_score']:.3f}")
                    print(f"     📝 Preview: {item['content'][:100]}...")
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"❌ Search error: {e}")
    
    else:
        print("❌ No existing vector database found. Run full test first.")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Test RAG System")
    parser.add_argument("--demo", action="store_true", help="Run interactive demo")
    parser.add_argument("--full", action="store_true", help="Run full test suite")
    
    args = parser.parse_args()
    
    if args.demo:
        asyncio.run(demo_search())
    elif args.full:
        asyncio.run(test_rag_system())
    else:
        print("RAG System Test Script")
        print("Usage:")
        print("  --full    Run complete test suite")
        print("  --demo    Run interactive search demo")
        print("\nExample:")
        print("  python test_rag.py --full")
        print("  python test_rag.py --demo") 