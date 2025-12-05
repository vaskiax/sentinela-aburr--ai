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
        self.barrio_keywords: List[str] = []

    def set_barrio_keywords(self, barrios: List[str]):
        self.barrio_keywords = barrios or []

    def build_search_queries(self, config) -> list[str]:
        """AI Agent: Construct intelligent search queries from user config."""
        import sys
        print(f"[AI Query Builder] Input config - orgs: {config.target_organizations}, events: {config.predictor_events}, crimes: {config.target_crimes}", file=sys.stderr, flush=True)
        
        if not self.client:
            # Fallback: simple combinations
            queries = []
            all_groups = (config.target_organizations or []) + (config.local_combos or [])
            for group in all_groups[:5]:
                for event in (config.predictor_events or [])[:2]:
                    queries.append(f'"{group}" "{event}" Medellín')
            # Add location-specific queries with barrios if available
            barrio_locs = (self.barrio_keywords or [])[:8]
            for crime in (config.target_crimes or [])[:2]:
                if barrio_locs:
                    for b in barrio_locs:
                        queries.append(f'"{crime}" "{b}" Medellín')
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
            print(f"  - Combos ({len(combos_list)}): {combos[:100]}", file=sys.stderr, flush=True)
            print(f"  - Events ({len(events_list)}): {events}", file=sys.stderr, flush=True)
            print(f"  - Crimes ({len(crimes_list)}): {crimes}", file=sys.stderr, flush=True)
            
            barrios = ', '.join((self.barrio_keywords or [])[:25]) or 'Santo Domingo, Manrique, Robledo, Guayabal'
            prompt = f"""You are a search query expert for Colombian crime news. Generate up-to 50 precise search queries in Spanish to find:
- Trigger events: {events} involving {ranks} from organizations: {orgs}, local combos: {combos}
- Crime trends: {crimes} in Valle de Aburrá
- Prioritize location keywords using these barrios/colonias: {barrios}

Use the EXACT organization names, event types, ranks, crimes, and barrios provided above.
Include queries for the entire date range starting from {config.date_range_start} to present.
Generate a mix of specific queries (Org + Event + Barrio) and broad queries (Crime + Location + Year).
Optimize for Colombian news sites (minuto30.com, elcolombiano.com, qhubomedellin.com).
Return ONLY a JSON array of query strings, no explanation.
Example: ["Captura cabecilla Clan del Golfo Medellín 2023", "Homicidios Valle de Aburrá 2015-2020", "Aumento extorsión Bello 2024", "Extorsión Guayabal 2024"]"""

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
            # Post-processing: Ensure year coverage
            try:
                import datetime
                start_year = int(config.date_range_start.split('-')[0])
                current_year = datetime.datetime.now().year
                
                # If range is wide (> 1 year), add specific year queries
                if current_year - start_year > 1:
                    print(f"[AI Query Builder] Detected wide date range ({start_year}-{current_year}). Generating comprehensive historical queries.", file=sys.stderr, flush=True)
                    historical_queries = []
                    # Generate a query for EVERY year to ensure density
                    for year in range(start_year, current_year + 1):
                        # Rotate through orgs/crimes to create diverse queries per year
                        if year % 2 == 0:
                            historical_queries.append(f"Crimen organizado Medellín {year}")
                        else:
                            historical_queries.append(f"Homicidios Valle de Aburrá {year}")
                        
                        # Add a specific org query for older years to dig deeper
                        if year < 2020:
                            historical_queries.append(f"Capturas Clan del Golfo Medellín {year}")

                    # PREPEND historical queries to ensure they are executed first
                    print(f"[AI Query Builder] Prepending {len(historical_queries)} historical queries.", file=sys.stderr, flush=True)
                    queries = historical_queries + queries
            except Exception as e:
                print(f"[AI Query Builder] Date range processing error: {e}", file=sys.stderr, flush=True)

            # BALANCED INTERLEAVING: Classify and interleave queries to ensure balance
            print(f"[AI Query Builder] Balancing queries (TRIGGER vs CRIME_STAT)...", file=sys.stderr, flush=True)
            queries = self._interleave_queries(queries, config)
            print(f"[AI Query Builder] Final query order (first 10): {queries[:10]}", file=sys.stderr, flush=True)

            return queries
        except Exception as e:
            print(f"Query builder error: {e}", file=sys.stderr, flush=True)
            # Better fallback using actual config values
            fallback_queries = []
            # Combine orgs and local combos for fallback
            all_groups = (config.target_organizations or []) + (config.local_combos or [])
            for group in all_groups[:5]:
                for event in (config.predictor_events or ['captura'])[:2]:
                    fallback_queries.append(f'{event} {group} Medellín')
            print(f"[AI Query Builder] Exception fallback: {fallback_queries}", file=sys.stderr, flush=True)
            return fallback_queries if fallback_queries else ['captura Medellín']

    def _interleave_queries(self, queries: list[str], config) -> list[str]:
        """Classify queries as TRIGGER or CRIME_STAT and interleave them for balanced scraping."""
        import sys
        
        trigger_keywords = set()
        crime_keywords = set()
        
        # Build keyword sets from config
        if config.predictor_events:
            trigger_keywords.update([e.lower() for e in config.predictor_events])
        if config.predictor_ranks:
            trigger_keywords.update([r.lower() for r in config.predictor_ranks])
        
        # Add common trigger words
        trigger_keywords.update(['captura', 'abatido', 'neutralizado', 'operativo', 'allanamiento', 
                                  'incautación', 'decomiso', 'desarticulación', 'golpe'])
        
        if config.target_crimes:
            crime_keywords.update([c.lower() for c in config.target_crimes])
        
        # Add common crime words
        crime_keywords.update(['homicidio', 'asesinato', 'extorsión', 'hurto', 'robo', 
                               'secuestro', 'aumento', 'estadística', 'cifras', 'casos'])
        
        # Classify queries
        trigger_queries = []
        crime_queries = []
        ambiguous_queries = []
        
        for query in queries:
            query_lower = query.lower()
            
            has_trigger = any(kw in query_lower for kw in trigger_keywords)
            has_crime = any(kw in query_lower for kw in crime_keywords)
            
            if has_trigger and not has_crime:
                trigger_queries.append(query)
            elif has_crime and not has_trigger:
                crime_queries.append(query)
            else:
                # Ambiguous or neither - distribute evenly
                ambiguous_queries.append(query)
        
        print(f"[Query Classification] TRIGGER: {len(trigger_queries)}, CRIME_STAT: {len(crime_queries)}, AMBIGUOUS: {len(ambiguous_queries)}", file=sys.stderr, flush=True)
        
        # Interleave: alternate between trigger and crime queries
        interleaved = []
        max_len = max(len(trigger_queries), len(crime_queries))
        
        for i in range(max_len):
            if i < len(trigger_queries):
                interleaved.append(trigger_queries[i])
            if i < len(crime_queries):
                interleaved.append(crime_queries[i])
        
        # Append ambiguous queries at the end (or interleave them too)
        interleaved.extend(ambiguous_queries)
        
        print(f"[Query Balancing] Interleaved {len(interleaved)} queries (T-C-T-C pattern)", file=sys.stderr, flush=True)
        return interleaved

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
            
            prompt = f"""You are an expert intelligence analyst specializing in Colombian crime news. Extract structured data from the provided HTML article. Your output MUST be a single, valid JSON object and nothing else.

**Extraction Schema:**

1.  **headline**: The main, clean headline of the article.
2.  **snippet**: A concise 2-3 sentence summary of the article's key information.
3.  **date**: The publication date in strict "YYYY-MM-DD" format. Prioritize metadata tags like `<time datetime="...">` or `article:published_time`. If no metadata is found, parse it from the text. As a last resort, use today's date.
4.  **relevance**: A relevance score from 0.0 to 1.0. This score must reflect how closely the article matches the following high-value keywords: **{keywords}**. A high score (0.7-1.0) should be reserved for articles detailing direct actions against these specific groups or crimes. A low score (< 0.2) should be for unrelated news.
5.  **type**: Classify the article's primary focus. This is EXTREMELY CRITICAL for model causality.
    *   Use **"TRIGGER_EVENT"** ONLY for PROACTIVE STATE ACTIONS or CRIMINAL STRUCTURE CHANGES:
        - Police/Military captures, raids (allanamientos), operations
        - Seizures of drugs, weapons, cash
        - Deaths of cartel leaders/key figures
        - Gang leadership changes, structure dismantling
        - Declarations of war between criminal groups
        - Do NOT include reactive crimes in this category
    *   Use **"CRIME_STAT"** ONLY for REACTIVE CRIME FACTS or STATISTICS:
        - Homicides, murders, bodies found
        - Reports of extortion, kidnapping, theft
        - Crime trend analysis and statistics
        - Denunciations of criminal activity
        - Do NOT classify police operations or captures as CRIME_STAT
    This distinction is critical to avoid confusing causes (triggers) with effects (crime stats).
6.  **extracted_metadata**: A nested JSON object containing extracted entities.
    *   **crime_type**: The specific crime mentioned (e.g., Homicide, Extortion, Drug Trafficking, Kidnapping). If multiple, list the primary one. Default to "Unknown" if none are clearly stated.
    *   **organization**: The specific criminal organization mentioned (e.g., Clan del Golfo, La Oficina, Los Chatas). Default to "Unknown".
    *   **locations**: A JSON array of strings listing all neighborhoods (comunas, barrios) or municipalities mentioned.

**HTML Content (first 15,000 chars):**
{html[:15000]}"""
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
                        "content": f"Find news articles about: {search_query}"
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
            print(f"[Perplexity] ✓ Found {len(unique_urls)} unique URLs from diverse sources", file=sys.stderr, flush=True)
            return unique_urls[:100]
            
        except Exception as e:
            print(f"[Perplexity] ✗ Error: {e}", file=sys.stderr, flush=True)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return []

