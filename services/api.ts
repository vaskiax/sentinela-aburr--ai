import { ScrapingConfig, ScrapedItem, PredictionResult, ProcessingLog, PipelineStage } from '../types';

const API_URL = 'http://localhost:8000/api';

export const api = {
    async setConfig(config: ScrapingConfig): Promise<void> {
        const response = await fetch(`${API_URL}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
        });
        if (!response.ok) throw new Error('Failed to set config');
    },

    async startScraping(): Promise<void> {
        const response = await fetch(`${API_URL}/scrape`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to start scraping');
    },

    async startTraining(): Promise<void> {
        const response = await fetch(`${API_URL}/train`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to start training');
    },

    async getStatus(): Promise<{ stage: PipelineStage; logs: ProcessingLog[] }> {
        const response = await fetch(`${API_URL}/status`);
        if (!response.ok) throw new Error('Failed to get status');
        return response.json();
    },

    async getData(): Promise<ScrapedItem[]> {
        const response = await fetch(`${API_URL}/data`);
        if (!response.ok) throw new Error('Failed to get data');
        return response.json();
    },

    async getResult(): Promise<PredictionResult | null> {
        const response = await fetch(`${API_URL}/result`);
        if (!response.ok) throw new Error('Failed to get result');
        return response.json();
    },

    async getOptions(): Promise<{ organizations: string[]; ranks: string[]; combos: string[]; barrios: string[]; comunas: string[] }> {
        const response = await fetch(`${API_URL}/options`);
        if (!response.ok) throw new Error('Failed to get options');
        return response.json();
    },

    async getScrapeStats(): Promise<{ counts: Record<string, number>; errors: Record<string, string> }> {
        const response = await fetch(`${API_URL}/scrape-stats`);
        if (!response.ok) throw new Error('Failed to get scrape stats');
        return response.json();
    },

    async resetPipeline(): Promise<void> {
        const response = await fetch(`${API_URL}/reset`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to reset pipeline');
    }
};
