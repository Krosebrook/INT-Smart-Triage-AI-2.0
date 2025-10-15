// AI-Powered Knowledge Base Search Service
import { supabase } from './supabaseClient.js';

class KnowledgeBaseService {
    constructor() {
        this.articles = [];
        this.searchIndex = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            const response = await fetch('/public/data/kb.json');
            const data = await response.json();
            this.articles = data.articles || [];
            this.buildSearchIndex();
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize knowledge base:', error);
        }
    }

    buildSearchIndex() {
        this.articles.forEach((article, index) => {
            const searchableText = `
                ${article.title}
                ${article.category}
                ${article.department}
                ${article.tags?.join(' ') || ''}
                ${article.summary || ''}
                ${article.content || ''}
            `.toLowerCase();

            const words = searchableText.split(/\s+/);
            words.forEach(word => {
                if (word.length > 2) {
                    if (!this.searchIndex.has(word)) {
                        this.searchIndex.set(word, new Set());
                    }
                    this.searchIndex.get(word).add(index);
                }
            });
        });
    }

    async search(query, options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        const {
            category = null,
            department = null,
            limit = 10,
            minRelevance = 0.3
        } = options;

        const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const articleScores = new Map();

        queryWords.forEach(word => {
            const matchingIndices = this.searchIndex.get(word);
            if (matchingIndices) {
                matchingIndices.forEach(index => {
                    articleScores.set(index, (articleScores.get(index) || 0) + 1);
                });
            }
        });

        const semanticMatches = this.findSemanticMatches(query);
        semanticMatches.forEach(({ index, score }) => {
            articleScores.set(index, (articleScores.get(index) || 0) + score);
        });

        const results = Array.from(articleScores.entries())
            .map(([index, score]) => ({
                article: this.articles[index],
                relevance: score / queryWords.length
            }))
            .filter(result => {
                if (result.relevance < minRelevance) return false;
                if (category && result.article.category !== category) return false;
                if (department && result.article.department !== department) return false;
                return true;
            })
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, limit);

        await this.trackSearch(query, results.length);

        return {
            success: true,
            query,
            results: results.map(r => ({
                ...r.article,
                relevance: (r.relevance * 100).toFixed(1)
            })),
            totalResults: results.length
        };
    }

    findSemanticMatches(query) {
        const matches = [];
        const lowerQuery = query.toLowerCase();

        const synonyms = {
            'security': ['protection', 'safety', 'compliance', 'audit'],
            'hack': ['breach', 'attack', 'intrusion', 'vulnerability'],
            'website': ['site', 'web', 'page', 'portal'],
            'email': ['mail', 'message', 'correspondence'],
            'slow': ['performance', 'speed', 'lag', 'delay'],
            'marketing': ['campaign', 'promotion', 'advertising'],
            'design': ['branding', 'visual', 'creative', 'ui']
        };

        this.articles.forEach((article, index) => {
            let semanticScore = 0;
            const articleText = `${article.title} ${article.summary} ${article.content}`.toLowerCase();

            Object.entries(synonyms).forEach(([term, relatedTerms]) => {
                if (lowerQuery.includes(term)) {
                    relatedTerms.forEach(related => {
                        if (articleText.includes(related)) {
                            semanticScore += 0.5;
                        }
                    });
                }
            });

            if (semanticScore > 0) {
                matches.push({ index, score: semanticScore });
            }
        });

        return matches;
    }

    async getArticleById(articleId) {
        if (!this.initialized) {
            await this.initialize();
        }

        const article = this.articles.find(a => a.id === articleId);

        if (article) {
            await this.trackView(articleId);
            return { success: true, article };
        }

        return { success: false, error: 'Article not found' };
    }

    async getRelatedArticles(articleId, limit = 5) {
        if (!this.initialized) {
            await this.initialize();
        }

        const article = this.articles.find(a => a.id === articleId);
        if (!article) {
            return { success: false, error: 'Article not found' };
        }

        const related = this.articles
            .filter(a => a.id !== articleId)
            .map(a => {
                let score = 0;

                if (a.category === article.category) score += 3;
                if (a.department === article.department) score += 2;

                const commonTags = (article.tags || []).filter(tag =>
                    (a.tags || []).includes(tag)
                ).length;
                score += commonTags;

                return { article: a, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.article);

        return { success: true, articles: related };
    }

    async trackSearch(query, resultCount) {
        if (!supabase) return;

        try {
            await supabase
                .from('kb_searches')
                .insert([{
                    query,
                    result_count: resultCount,
                    searched_at: new Date().toISOString()
                }]);
        } catch (error) {
            console.error('Failed to track search:', error);
        }
    }

    async trackView(articleId) {
        if (!supabase) return;

        try {
            await supabase.rpc('increment_article_views', {
                article_id: articleId
            });
        } catch (error) {
            console.error('Failed to track view:', error);
        }
    }

    async rateArticle(articleId, helpful, feedback = null) {
        if (!supabase) {
            return { success: false, error: 'Database not configured' };
        }

        try {
            const { data, error } = await supabase
                .from('kb_feedback')
                .insert([{
                    article_id: articleId,
                    helpful,
                    feedback_text: feedback,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Failed to rate article:', error);
            return { success: false, error: error.message };
        }
    }

    async getPopularArticles(limit = 10) {
        if (!this.initialized) {
            await this.initialize();
        }

        return {
            success: true,
            articles: this.articles
                .sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0))
                .slice(0, limit)
        };
    }

    async getArticlesByCategory(category) {
        if (!this.initialized) {
            await this.initialize();
        }

        const articles = this.articles.filter(a => a.category === category);

        return {
            success: true,
            category,
            articles,
            count: articles.length
        };
    }

    async getArticlesByDepartment(department) {
        if (!this.initialized) {
            await this.initialize();
        }

        const articles = this.articles.filter(a => a.department === department);

        return {
            success: true,
            department,
            articles,
            count: articles.length
        };
    }

    async getSuggestedArticles(issueDescription, options = {}) {
        const keywords = this.extractKeywords(issueDescription);
        const query = keywords.join(' ');

        return await this.search(query, {
            ...options,
            limit: options.limit || 5
        });
    }

    extractKeywords(text) {
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
            'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your',
            'his', 'her', 'its', 'our', 'their'
        ]);

        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.has(word));

        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });

        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);
    }

    async getSearchSuggestions(partial) {
        if (!this.initialized) {
            await this.initialize();
        }

        const lowerPartial = partial.toLowerCase();
        const suggestions = new Set();

        this.articles.forEach(article => {
            if (article.title.toLowerCase().includes(lowerPartial)) {
                suggestions.add(article.title);
            }

            (article.tags || []).forEach(tag => {
                if (tag.toLowerCase().includes(lowerPartial)) {
                    suggestions.add(tag);
                }
            });
        });

        return {
            success: true,
            suggestions: Array.from(suggestions).slice(0, 10)
        };
    }
}

export const knowledgeBaseService = new KnowledgeBaseService();
export default knowledgeBaseService;
