from datetime import datetime
from typing import List, Dict
from scrapy.spiders import Spider
from scrapy import Request


class NewsSpider(Spider):
    name = "sentinela_news"
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'DOWNLOAD_TIMEOUT': 15,
        'RETRY_ENABLED': True,
        'RETRY_TIMES': 2,
        'CONCURRENT_REQUESTS': 8,
    }

    def __init__(self, config_keywords: List[str] | None = None, max_items_per_source: int = 500, **kwargs):
        super().__init__(**kwargs)
        self.config_keywords = [k.lower() for k in (config_keywords or []) if k]
        self.max_items_per_source = max_items_per_source
        self.collected: List[Dict] = []
        self.source_counts: Dict[str, int] = {}
        self.errors: Dict[str, str] = {}

    def start_requests(self):
        urls = [
            "https://www.minuto30.com/judicial/",
            "https://www.elcolombiano.com/tags/seguridad",
            "https://www.qhubomedellin.com/judicial/",
            "https://telemedellin.tv/category/noticias/judicial/",
            "https://caracol.com.co/tags/judicial/",
        ]
        for u in urls:
            yield Request(u, callback=self.parse_listing, meta={'source_list': u}, errback=self.on_error)

    def on_error(self, failure):
        src = getattr(failure.request, 'url', 'unknown').split('/')[2] if getattr(failure, 'request', None) else 'unknown'
        self.errors[src] = str(failure.value) if getattr(failure, 'value', None) else 'request failed'

    def parse_listing(self, response):
        source = response.url.split('/')[2]
        count = self.source_counts.get(source, 0)
        if count >= self.max_items_per_source:
            return
        hrefs = response.css('a::attr(href)').getall()
        for href in hrefs:
            if count >= self.max_items_per_source:
                break
            if not href:
                continue
            full = href if href.startswith('http') else response.urljoin(href)
            count += 1
            self.source_counts[source] = count
            yield Request(full, callback=self.parse_article, meta={'source': source}, errback=self.on_error)

    def parse_article(self, response):
        source = response.meta.get('source')
        title = (response.css('h1::text').get() or '').strip()
        if not title:
            title = (response.css('title::text').get() or '').strip()
        snippet = (response.css('article p::text').get() or response.css('div.entry-content p::text').get() or '').strip()
        date_str = datetime.now().strftime("%Y-%m-%d")
        meta_date = response.css("meta[property='article:published_time']::attr(content)").get() or response.css("time::attr(datetime)").get()
        if meta_date:
            try:
                date_str = datetime.fromisoformat(meta_date.replace('Z','+')).strftime('%Y-%m-%d')
            except Exception:
                pass

        if self.config_keywords:
            if not any(k in title.lower() for k in self.config_keywords):
                return

        self.collected.append({
            'source': source,
            'date': date_str,
            'headline': title,
            'snippet': snippet or title,
            'url': response.url
        })
