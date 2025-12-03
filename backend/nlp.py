import os
from openai import OpenAI
from typing import Dict, Any, List
import requests

class NLPProcessor:
    def __init__(self):
        import sys
        api_key = os.getenv("DEEPSEEK_API_KEY")
        pplx_key = os.getenv("PERPLEXITY_API_KEY")
        
        print(f"[NLP INIT] Checking DEEPSEEK_API_KEY... {'Found' if api_key else 'NOT FOUND'}", file=sys.stderr, flush=True)
        if api_key:
            print(f"[NLP INIT] API Key starts with: {api_key[:10]}...", file=sys.stderr, flush=True)
        
        print(f"[NLP INIT] Checking PERPLEXITY_API_KEY... {'Found' if pplx_key else 'NOT FOUND'}", file=sys.stderr, flush=True)
        if pplx_key:
            print(f"[NLP INIT] Perplexity Key starts with: {pplx_key[:10]}...", file=sys.stderr, flush=True)
            print(f"[NLP INIT] Perplexity Key length: {len(pplx_key)}", file=sys.stderr, flush=True)
        
        if api_key:
            try:
                self.client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")
                self.model = "deepseek-chat"
                print("[NLP INIT] ✓ DeepSeek model initialized successfully", file=sys.stderr, flush=True)
            except Exception as e:
                print(f"[NLP INIT] ✗ Failed to initialize DeepSeek: {e}", file=sys.stderr, flush=True)
                self.client = None
                self.model = None
        else:
            self.client = None
            self.model = None
            print("[NLP INIT] ✗ DEEPSEEK_API_KEY not found. NLP features will be mocked.", file=sys.stderr, flush=True)

        # Perplexity Online Search setup
        self.pplx_key = pplx_key
        self.pplx_endpoint = "https://api.perplexity.ai/chat/completions"
        self.pplx_model = "sonar-pro"

    def build_search_queries(self, config) -> list[str]:
        """AI Agent: Construct intelligent search queries from user config."""
        import sys
        print(f"[AI Query Builder] Input config - orgs: {config.target_organizations}, events: {config.predictor_events}, crimes: {config.target_crimes}", file=sys.stderr, flush=True)
        
        if not self.client:
            # Fallback: simple combinations
            queries = []
            for org in (config.target_organizations or [])[:3]:
                for event in (config.predictor_events or [])[:2]:
                    queries.append(f'"{org}" "{event}" Medellín')
            for crime in (config.target_crimes or [])[:2]:
                queries.append(f'"{crime}" Valle de Aburrá')
            print(f"[AI Query Builder] Generated {len(queries)} fallback queries: {queries}", file=sys.stderr, flush=True)
            return queries[:8] if queries else ['Medellín noticias judiciales']
        
        try:
            # Build keyword strings - use actual values
            orgs_list = config.target_organizations or []
            combos_list = (config.local_combos or [])[:5]
            events_list = config.predictor_events or []
            ranks_list = config.predictor_ranks or []
            crimes_list = config.target_crimes or []
            
            orgs = ', '.join(orgs_list) if orgs_list else 'organizaciones criminales'
            combos = ', '.join(combos_list) if combos_list else 'combos locales'
            events = ', '.join(events_list) if events_list else 'capturas, abatidos'
            ranks = ', '.join(ranks_list) if ranks_list else 'cabecillas, coordinadores'
            crimes = ', '.join(crimes_list) if crimes_list else 'homicidios, extorsión'
            
            print(f"[AI Query Builder] Building prompt with:", file=sys.stderr, flush=True)
            print(f"  - Orgs ({len(orgs_list)}): {orgs[:100]}", file=sys.stderr, flush=True)
            print(f"  - Events ({len(events_list)}): {events}", file=sys.stderr, flush=True)
            print(f"  - Crimes ({len(crimes_list)}): {crimes}", file=sys.stderr, flush=True)
            
            prompt = f"""You are a search query expert for Colombian crime news. Generate 8-10 precise search queries in Spanish to find:
- Trigger events: {events} involving {ranks} from organizations: {orgs}, local combos: {combos}
- Crime trends: {crimes} in Valle de Aburrá

Use the EXACT organization names, event types, ranks, and crimes provided above.
Optimize for Colombian news sites (minuto30.com, elcolombiano.com, qhubomedellin.com).
Return ONLY a JSON array of query strings, no explanation.
Example: ["Captura cabecilla Clan del Golfo Medellín", "Aumento homicidios Valle de Aburrá 2024"]"""

            print(f"[AI Query Builder] Sending prompt to DeepSeek...", file=sys.stderr, flush=True)
            response = self.client.chat.completions.create(
                model=self.model,  # type: ignore
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that generates search queries in JSON format."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            text = (response.choices[0].message.content or "").strip()
            print(f"[AI Query Builder] DeepSeek response: {text[:300]}", file=sys.stderr, flush=True)
            
            # Extract JSON array
            import json
            import re
            match = re.search(r'\[.*\]', text, re.DOTALL)
            if match:
                queries = json.loads(match.group(0))
                print(f"[AI Query Builder] ✓ Generated {len(queries)} AI queries:", file=sys.stderr, flush=True)
                for i, q in enumerate(queries[:5], 1):
                    print(f"    {i}. {q}", file=sys.stderr, flush=True)
                return queries
            print(f"[AI Query Builder] Failed to parse JSON, using first line", file=sys.stderr, flush=True)
            return [text.split('\n')[0]]
        except Exception as e:
            print(f"Query builder error: {e}", file=sys.stderr, flush=True)
            # Better fallback using actual config values
            fallback_queries = []
            for org in (config.target_organizations or [])[:3]:
                for event in (config.predictor_events or ['captura'])[:2]:
                    fallback_queries.append(f'{event} {org} Medellín')
            print(f"[AI Query Builder] Exception fallback: {fallback_queries}", file=sys.stderr, flush=True)
            return fallback_queries if fallback_queries else ['captura Medellín']

    def extract_article_data(self, html: str, url: str, config) -> Dict[str, Any]:
        """AI Agent: Extract structured data from article HTML and score relevance."""
        import sys
        
        if not self.client:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            title = soup.find('h1')
            p = soup.find('p')
            print(f"[AI Extract] No client, using fallback for {url}", file=sys.stderr, flush=True)
            return {
                'headline': title.get_text(strip=True) if title else '',
                'snippet': p.get_text(strip=True)[:200] if p else '',
                'relevance': 0.5,
                'type': 'TRIGGER_EVENT'
            }
        
        try:
            keywords = ', '.join(
                (config.target_organizations or []) +
                (config.local_combos or [])[:5] +
                (config.predictor_events or []) +
                (config.predictor_ranks or []) +
                (config.target_crimes or [])
            )
            
            prompt = f"""Extract from this HTML article about Medellín crime news:
1. Headline (clean text)
2. Summary (2-3 sentences)
3. Date (YYYY-MM-DD format, estimate if missing)
4. Relevance score 0-1 based on keywords: {keywords}
5. Type: "CRIME_STAT" if about crime statistics/trends, else "TRIGGER_EVENT"

Return ONLY valid JSON: {{"headline": "...", "snippet": "...", "date": "2024-12-02", "relevance": 0.8, "type": "TRIGGER_EVENT"}}

HTML (first 2000 chars):
{html[:2000]}"""
            print(f"[AI Extract] Calling DeepSeek for {url[:50]}...", file=sys.stderr, flush=True)
            
            response = self.client.chat.completions.create(
                model=self.model,  # type: ignore
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that extracts structured data from HTML in JSON format."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
            text = (response.choices[0].message.content or "").strip()
            print(f"[AI Extract] Response: {text[:200]}", file=sys.stderr, flush=True)
            import json
            import re
            # Clean markdown code fences if present
            text = re.sub(r'^```json\s*|\s*```$', '', text, flags=re.MULTILINE)
            result = json.loads(text)
            print(f"[AI Extract] ✓ Parsed - Relevance: {result.get('relevance', 0):.2f}, Title: {result.get('headline', '')[:60]}", file=sys.stderr, flush=True)
            return result
        except Exception as e:
            print(f"[AI Extract] ✗ Error for {url}: {e}", file=sys.stderr, flush=True)
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            title = soup.find('h1')
            p = soup.find('p')
            return {
                'headline': title.get_text(strip=True) if title else '',
                'snippet': p.get_text(strip=True)[:200] if p else '',
                'relevance': 0.3,
                'type': 'TRIGGER_EVENT'
            }

    def analyze_text(self, text: str) -> Dict[str, Any]:
        if not self.client:
            return {
                "categories": ["General"],
                "entities": [],
                "sentiment": "Neutral"
            }
            
        try:
            prompt = f"""Analyze the following news snippet related to criminal activity in Medellin. 
Extract:
1. Criminal Organization mentioned.
2. Type of crime or event (Capture, Homicide, etc).
3. Locations mentioned.

Snippet: {text}

Return JSON."""
            
            response = self.client.chat.completions.create(
                model=self.model,  # type: ignore
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that analyzes news text."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
            return {"raw_analysis": response.choices[0].message.content or ""}
        except Exception as e:
            print(f"NLP Error: {e}")
            return {"error": str(e)}

    def web_search(self, query: str, site_filter: List[str] | None = None) -> List[str]:
        """Use Perplexity API to search the web and return article URLs."""
        import sys
        
        if not self.pplx_key:
            print("[WebSearch] ✗ PERPLEXITY_API_KEY not configured", file=sys.stderr, flush=True)
            return []
        
        try:
            headers = {
                "Authorization": f"Bearer {self.pplx_key}",
                "Content-Type": "application/json",
            }
            
            # Let Perplexity search freely - no site restrictions
            search_query = f"{query} Colombia Medellín Valle de Aburrá noticias"
            
            body = {
                "model": "sonar-pro",  # Perplexity's best online search model
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a web search assistant. Find relevant Colombian crime news articles and return their URLs. Search across all available news sources."
                    },
                    {
                        "role": "user",
                        "content": f"Find recent news articles about: {search_query}"
                    }
                ],
                "max_tokens": 500,
                "temperature": 0.2,
                "return_citations": True
            }
            
            print(f"[Perplexity] Searching: {search_query[:80]}...", file=sys.stderr, flush=True)
            resp = requests.post(self.pplx_endpoint, headers=headers, json=body, timeout=20)
            
            if resp.status_code != 200:
                print(f"[Perplexity] ✗ HTTP {resp.status_code}: {resp.text[:300]}", file=sys.stderr, flush=True)
                return []
            
            data = resp.json()
            
            # Extract URLs from citations
            urls: List[str] = []
            citations = data.get("citations", [])
            
            for citation in citations:
                url = citation if isinstance(citation, str) else citation.get("url")
                if url:
                    urls.append(url)
            
            # Also extract URLs from message content as fallback
            if not urls:
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if content:
                    import re
                    found_urls = re.findall(r'https?://[^\s<>"]+', content)
                    urls.extend(found_urls)
            
            # No filtering - accept URLs from any source
            
            # Deduplicate
            seen = set()
            unique_urls = []
            for u in urls:
                if u not in seen:
                    seen.add(u)
                    unique_urls.append(u)
            
            print(f"[Perplexity] ✓ Found {len(unique_urls)} unique URLs from diverse sources", file=sys.stderr, flush=True)
            return unique_urls[:12]
            
        except Exception as e:
            print(f"[Perplexity] ✗ Error: {e}", file=sys.stderr, flush=True)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return []

