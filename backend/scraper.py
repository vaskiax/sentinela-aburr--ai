import datetime
import os
from typing import List, Dict
import requests
from bs4 import BeautifulSoup
from .models import ScrapedItem, ScrapingConfig
from .nlp import NLPProcessor
from dotenv import load_dotenv
from pathlib import Path

# Load .env from backend directory
backend_dir = Path(__file__).parent
load_dotenv(backend_dir / '.env')

class Scraper:
    def __init__(self, data_loader=None):
        self.data_loader = data_loader

    def scrape(self, config: ScrapingConfig) -> List[ScrapedItem]:
        """AI-assisted scraper: fetch candidates and score via NLP against config."""
        return self._ai_scrape(config)

    

    def _ai_scrape(self, config: ScrapingConfig) -> List[ScrapedItem]:
        """AI-assisted scraper: generate search queries via LLM, fetch targeted results, extract with AI."""
        import sys
        print("\n" + "="*60, file=sys.stderr, flush=True)
        print("[SCRAPER] Starting AI-assisted scraping...", file=sys.stderr, flush=True)
        print(f"[SCRAPER] Config has {len(config.target_organizations)} orgs, {len(config.predictor_events)} events", file=sys.stderr, flush=True)
        print("="*60 + "\n", file=sys.stderr, flush=True)
        
        items: List[ScrapedItem] = []
        
        try:
            nlp = NLPProcessor()
            print(f"[SCRAPER] NLPProcessor created, model available: {nlp.model is not None}", file=sys.stderr, flush=True)
            
            # AI Agent 1: Generate optimized search queries
            print("[AI Agent] Generating search queries from config...", file=sys.stderr, flush=True)
            search_queries = nlp.build_search_queries(config)
            print(f"[AI Agent] Generated {len(search_queries)} queries: {search_queries[:3]}...", file=sys.stderr, flush=True)
        except Exception as e:
            print(f"[SCRAPER ERROR] Failed to generate queries: {e}", file=sys.stderr, flush=True)
            import traceback
            traceback.print_exc(file=sys.stderr)
            # Return empty or fallback
            return []
        
        collected: List[Dict] = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "es-CO,es;q=0.8,en-US;q=0.6,en;q=0.4",
            "Connection": "close",
        }
        def safe_get(url: str):
            try:
                return requests.get(url, headers=headers, timeout=10)
            except Exception:
                return None
        def parse_listing(url: str, selector: str = 'a'):
            resp = safe_get(url)
            if not resp or resp.status_code != 200:
                return []
            soup = BeautifulSoup(resp.text, "html.parser")
            links = []
            for a in soup.select(f"{selector}[href]")[:30]:
                href = a.get("href")
                title = a.get_text(strip=True)
                if not href:
                    continue
                href_str = str(href) if href else ''
                full = href_str if href_str.startswith("http") else url.rstrip('/') + '/' + href_str.lstrip('/')
                links.append((full, title))
            return links
        def parse_article(url: str, fallback_title: str):
            resp = safe_get(url)
            if not resp or resp.status_code != 200:
                return None
            soup = BeautifulSoup(resp.text, "html.parser")
            title = (soup.select_one('h1') or soup.select_one('title'))
            title_text = title.get_text(strip=True) if title else fallback_title
            p = soup.select_one('article p') or soup.select_one('div.entry-content p') or soup.select_one('p')
            snippet = p.get_text(strip=True) if p else title_text
            date_str = datetime.datetime.now().strftime('%Y-%m-%d')
            meta_date = soup.select_one("meta[property='article:published_time']") or soup.select_one('time[datetime]')
            if meta_date:
                val = meta_date.get('content') or meta_date.get('datetime')
                val_str = str(val) if val else ''
                try:
                    date_str = datetime.datetime.fromisoformat(val_str.replace('Z','+')).strftime('%Y-%m-%d')
                except Exception:
                    pass
            source = url.split('/')[2]
            return {
                'source': source,
                'date': date_str,
                'headline': title_text,
                'snippet': snippet,
                'url': url
            }
        # Execute searches across sources using AI-generated queries
        sources = [
            ("https://www.minuto30.com", 'minuto30.com'),
            ("https://www.elcolombiano.com", 'elcolombiano.com'),
            ("https://www.qhubomedellin.com", 'qhubomedellin.com'),
        ]
        
        # Use Perplexity web search to get article URLs
        print("[Strategy] Using Perplexity API for open web search", file=sys.stderr, flush=True)
        
        for query in search_queries[:8]:
            print(f"[Perplexity Search] Query: {query[:60]}...", file=sys.stderr, flush=True)
            urls = nlp.web_search(query, site_filter=None)  # No site restrictions
            print(f"[Perplexity Search] Found {len(urls)} URLs", file=sys.stderr, flush=True)
            
            for article_url in urls:
                print(f"[Fetch] {article_url}", file=sys.stderr, flush=True)
                art_resp = safe_get(article_url)
                if art_resp and art_resp.status_code == 200:
                    extracted = nlp.extract_article_data(art_resp.text, article_url, config)
                    relevance = extracted.get('relevance', 0)
                    print(f"[Extract] Relevance: {relevance:.2f} - {extracted.get('headline', '')[:60]}", file=sys.stderr, flush=True)
                    
                    if relevance > 0.15:
                        collected.append({
                            'source': article_url.split('/')[2],
                            'url': article_url,
                            **extracted
                        })
                        print(f"[Extract] ✓ Added (relevance {relevance:.2f})", file=sys.stderr, flush=True)
                        if len(collected) >= 25:
                            break
                else:
                    print(f"[Fetch] ✗ Failed to fetch {article_url}", file=sys.stderr, flush=True)
            
            if len(collected) >= 25:
                break
                break

        # Fallback: if nothing matched, fetch from landing pages and use AI extraction
        if len(collected) < 5:
            print("[Direct Scraping] Fetching from news site landing pages...", file=sys.stderr, flush=True)
            fallback_sources = [
                ("https://www.minuto30.com/judicial/", 'a'),
                ("https://www.elcolombiano.com/tags/seguridad", 'a'),
                ("https://www.qhubomedellin.com/judicial/", 'a'),
            ]

            for base, sel in fallback_sources:
                print(f"[Listing] Fetching article list from {base}", file=sys.stderr, flush=True)
                links = parse_listing(base, sel)
                print(f"[Listing] Found {len(links)} links", file=sys.stderr, flush=True)
                
                articles_checked = 0
                for full, title in links:
                    if articles_checked >= 10:  # limit per source
                        break
                    articles_checked += 1
                    
                    print(f"[Article {articles_checked}] Checking {full}", file=sys.stderr, flush=True)
                    resp = safe_get(full)
                    if resp and resp.status_code == 200:
                        extracted = nlp.extract_article_data(resp.text, full, config)
                        relevance = extracted.get('relevance', 0)
                        print(f"[Article {articles_checked}] Relevance: {relevance:.2f} - {extracted.get('headline', 'No title')[:60]}", file=sys.stderr, flush=True)
                        
                        if relevance > 0.15:  # lowered threshold
                            collected.append({
                                'source': full.split('/')[2],
                                'url': full,
                                **extracted
                            })
                            print(f"[Article {articles_checked}] ✓ Added (relevance {relevance:.2f})", file=sys.stderr, flush=True)
                            if len(collected) >= 20:
                                break
                    else:
                        print(f"[Article {articles_checked}] ✗ Failed to fetch", file=sys.stderr, flush=True)
                
                if len(collected) >= 20:
                    break

        # Sort by AI relevance score and date
        collected.sort(key=lambda x: (x.get('relevance', 0), x.get('date', '')), reverse=True)

        print(f"[AI Scraper] Collected {len(collected)} articles")
        for i, it in enumerate(collected[:30]):
            items.append(ScrapedItem(
                id=f"ai_{i}",
                source=it.get('source', 'unknown'),
                date=it.get('date', datetime.datetime.now().strftime('%Y-%m-%d')),
                headline=it.get('headline', 'No title'),
                snippet=it.get('snippet', '')[:300],
                url=it.get('url', ''),
                relevance_score=float(it.get('relevance', 0.5)),
                type=it.get('type', 'TRIGGER_EVENT')
            ))

        return items
