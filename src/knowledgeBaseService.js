/**
 * AI-Powered Knowledge Base Search Service
 *
 * Intelligent search system for knowledge base articles with:
 * - Full-text search with keyword indexing
 * - Semantic matching with synonyms
 * - Category and department filtering
 * - Article popularity tracking
 * - Related article suggestions
 *
 * @module KnowledgeBaseService
 * @since 1.0.0
 */

import { supabase } from './supabaseClient.js';
import { logger } from './logger.js';

/**
 * Knowledge Base Service for intelligent article search and recommendations.
 *
 * @class KnowledgeBaseService
 */
export class KnowledgeBaseService {
  /**
   * Initialize the Knowledge Base Service.
   *
   * @constructor
   */
  constructor() {
    /**
     * Cached articles array.
     *
     * @type {Array<Object>}
     * @private
     */
    this.articles = [];

    /**
     * Search index map for fast keyword lookup.
     * Maps words to Set of article indices.
     *
     * @type {Map<string, Set<number>>}
     * @private
     */
    this.searchIndex = new Map();

    /**
     * Initialization status flag.
     *
     * @type {boolean}
     * @private
     */
    this.initialized = false;
  }

  /**
   * Initialize the knowledge base by loading articles and building search index.
   *
   * Loads articles from JSON file and creates inverted index for fast searching.
   * Safe to call multiple times - will only initialize once.
   *
   * @async
   * @returns {Promise<void>}
   *
   * @example
   * await knowledgeBaseService.initialize();
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const response = await fetch('/public/data/kb.json');
      const data = await response.json();
      this.articles = data.articles || [];
      this.buildSearchIndex();
      this.initialized = true;
    } catch (error) {
      logger.warn('Failed to load knowledge base', { error: error.message });
      // Continue with empty knowledge base
    }
  }

  /**
   * Build inverted search index for fast keyword lookup.
   *
   * Creates a map where each word points to articles containing that word.
   * Only indexes words longer than 2 characters.
   *
   * @private
   * @returns {void}
   */
  buildSearchIndex() {
    this.articles.forEach((article, index) => {
      // Combine all searchable text fields
      const searchableText = `
        ${article.title}
        ${article.category}
        ${article.department}
        ${article.tags?.join(' ') || ''}
        ${article.summary || ''}
        ${article.content || ''}
      `.toLowerCase();

      // Split into words and index each
      const words = searchableText.split(/\s+/);
      words.forEach((word) => {
        if (word.length > 2) {
          if (!this.searchIndex.has(word)) {
            this.searchIndex.set(word, new Set());
          }
          this.searchIndex.get(word).add(index);
        }
      });
    });
  }

  /**
   * Search knowledge base articles.
   *
   * Performs keyword and semantic search across articles, with optional
   * filtering by category and department. Results are scored and ranked
   * by relevance.
   *
   * @async
   * @param {string} query - Search query string
   * @param {Object} [options={}] - Search options
   * @param {string} [options.category=null] - Filter by category
   * @param {string} [options.department=null] - Filter by department
   * @param {number} [options.limit=10] - Maximum results to return
   * @param {number} [options.minRelevance=0.3] - Minimum relevance score (0-1)
   * @returns {Promise<Object>} Search results
   * @returns {boolean} return.success - Whether search succeeded
   * @returns {string} return.query - Original query string
   * @returns {Array<Object>} return.results - Matching articles with relevance scores
   * @returns {number} return.totalResults - Total number of results
   *
   * @example
   * const results = await kbService.search('security breach', {
   *   category: 'Information Security',
   *   limit: 5,
   *   minRelevance: 0.5
   * });
   */
  async search(query, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      category = null,
      department = null,
      limit = 10,
      minRelevance = 0.3,
    } = options;

    // Extract query words (filter short words)
    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const articleScores = new Map();

    // Score articles by keyword matches
    queryWords.forEach((word) => {
      const matchingIndices = this.searchIndex.get(word);
      if (matchingIndices) {
        matchingIndices.forEach((index) => {
          articleScores.set(index, (articleScores.get(index) || 0) + 1);
        });
      }
    });

    // Add semantic matching scores
    const semanticMatches = this.findSemanticMatches(query);
    semanticMatches.forEach(({ index, score }) => {
      articleScores.set(index, (articleScores.get(index) || 0) + score);
    });

    // Filter, sort, and limit results
    const results = Array.from(articleScores.entries())
      .map(([index, score]) => ({
        article: this.articles[index],
        relevance: score / queryWords.length,
      }))
      .filter((result) => {
        if (result.relevance < minRelevance) return false;
        if (category && result.article.category !== category) return false;
        if (department && result.article.department !== department)
          return false;
        return true;
      })
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    // Track search for analytics
    await this.trackSearch(query, results.length);

    return {
      success: true,
      query,
      results: results.map((r) => ({
        ...r.article,
        relevance: (r.relevance * 100).toFixed(1),
      })),
      totalResults: results.length,
    };
  }

  /**
   * Find semantic matches using synonym matching.
   *
   * Enhances search results by matching related terms.
   *
   * @private
   * @param {string} query - Search query
   * @returns {Array<Object>} Array of {index, score} objects
   */
  findSemanticMatches(query) {
    const matches = [];
    const lowerQuery = query.toLowerCase();

    // Synonym dictionary for semantic matching
    const synonyms = {
      security: ['protection', 'safety', 'compliance', 'audit'],
      hack: ['breach', 'attack', 'intrusion', 'vulnerability'],
      website: ['site', 'web', 'page', 'portal'],
      email: ['mail', 'message', 'correspondence'],
      slow: ['performance', 'speed', 'lag', 'delay'],
      marketing: ['campaign', 'promotion', 'advertising'],
      design: ['branding', 'visual', 'creative', 'ui'],
    };

    this.articles.forEach((article, index) => {
      let semanticScore = 0;
      const articleText =
        `${article.title} ${article.summary} ${article.content}`.toLowerCase();

      // Check for synonym matches
      Object.entries(synonyms).forEach(([term, relatedTerms]) => {
        if (lowerQuery.includes(term)) {
          relatedTerms.forEach((related) => {
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

  /**
   * Get article by ID.
   *
   * @async
   * @param {string} articleId - Article unique identifier
   * @returns {Promise<Object>} Article retrieval result
   * @returns {boolean} return.success - Whether article was found
   * @returns {Object} [return.article] - Article object
   * @returns {string} [return.error] - Error message if not found
   *
   * @example
   * const result = await kbService.getArticleById('KB-SEC-001');
   */
  async getArticleById(articleId) {
    if (!this.initialized) {
      await this.initialize();
    }

    const article = this.articles.find((a) => a.id === articleId);

    if (article) {
      await this.trackView(articleId);
      return { success: true, article };
    }

    return { success: false, error: 'Article not found' };
  }

  /**
   * Get related articles based on category, department, and tags.
   *
   * @async
   * @param {string} articleId - Article ID to find related articles for
   * @param {number} [limit=5] - Maximum number of related articles
   * @returns {Promise<Object>} Related articles result
   * @returns {boolean} return.success - Whether query succeeded
   * @returns {Array<Object>} [return.articles] - Related articles
   *
   * @example
   * const related = await kbService.getRelatedArticles('KB-SEC-001', 5);
   */
  async getRelatedArticles(articleId, limit = 5) {
    if (!this.initialized) {
      await this.initialize();
    }

    const article = this.articles.find((a) => a.id === articleId);
    if (!article) {
      return { success: false, error: 'Article not found' };
    }

    // Score articles by similarity
    const related = this.articles
      .filter((a) => a.id !== articleId)
      .map((a) => {
        let score = 0;

        // Same category = 3 points
        if (a.category === article.category) score += 3;

        // Same department = 2 points
        if (a.department === article.department) score += 2;

        // Common tags = 1 point each
        const commonTags = (article.tags || []).filter((tag) =>
          (a.tags || []).includes(tag)
        ).length;
        score += commonTags;

        return { article: a, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.article);

    return { success: true, articles: related };
  }

  /**
   * Track search query for analytics.
   *
   * @async
   * @private
   * @param {string} query - Search query
   * @param {number} resultCount - Number of results returned
   * @returns {Promise<void>}
   */
  async trackSearch(query, resultCount) {
    if (!supabase) return;

    try {
      await supabase.from('kb_searches').insert([
        {
          query,
          result_count: resultCount,
          searched_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      // Silent fail - analytics tracking is non-critical
    }
  }

  /**
   * Track article view for popularity metrics.
   *
   * @async
   * @private
   * @param {string} articleId - Article ID
   * @returns {Promise<void>}
   */
  async trackView(articleId) {
    if (!supabase) return;

    try {
      await supabase.rpc('increment_article_views', {
        article_id: articleId,
      });
    } catch (error) {
      // Silent fail - analytics tracking is non-critical
    }
  }

  /**
   * Rate article helpfulness.
   *
   * @async
   * @param {string} articleId - Article ID
   * @param {boolean} helpful - Whether article was helpful
   * @param {string} [feedback=null] - Optional feedback text
   * @returns {Promise<Object>} Rating submission result
   *
   * @example
   * await kbService.rateArticle('KB-SEC-001', true, 'Very helpful!');
   */
  async rateArticle(articleId, helpful, feedback = null) {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('kb_feedback')
        .insert([
          {
            article_id: articleId,
            helpful,
            feedback_text: feedback,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get popular articles sorted by popularity score.
   *
   * @async
   * @param {number} [limit=10] - Maximum articles to return
   * @returns {Promise<Object>} Popular articles result
   *
   * @example
   * const popular = await kbService.getPopularArticles(10);
   */
  async getPopularArticles(limit = 10) {
    if (!this.initialized) {
      await this.initialize();
    }

    return {
      success: true,
      articles: this.articles
        .sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0))
        .slice(0, limit),
    };
  }

  /**
   * Get articles by category.
   *
   * @async
   * @param {string} category - Category name
   * @returns {Promise<Object>} Category articles result
   * @returns {Array<Object>} return.articles - Articles in category
   * @returns {number} return.count - Number of articles
   *
   * @example
   * const articles = await kbService.getArticlesByCategory('Information Security');
   */
  async getArticlesByCategory(category) {
    if (!this.initialized) {
      await this.initialize();
    }

    const articles = this.articles.filter((a) => a.category === category);

    return {
      success: true,
      category,
      articles,
      count: articles.length,
    };
  }

  /**
   * Get articles by department.
   *
   * @async
   * @param {string} department - Department name
   * @returns {Promise<Object>} Department articles result
   *
   * @example
   * const articles = await kbService.getArticlesByDepartment('Technology');
   */
  async getArticlesByDepartment(department) {
    if (!this.initialized) {
      await this.initialize();
    }

    const articles = this.articles.filter((a) => a.department === department);

    return {
      success: true,
      department,
      articles,
      count: articles.length,
    };
  }

  /**
   * Get suggested articles based on issue description.
   *
   * Extracts keywords from issue and searches for relevant articles.
   *
   * @async
   * @param {string} issueDescription - Issue description text
   * @param {Object} [options={}] - Search options
   * @returns {Promise<Object>} Suggested articles result
   *
   * @example
   * const suggestions = await kbService.getSuggestedArticles(
   *   'Server backup failed',
   *   { limit: 5 }
   * );
   */
  async getSuggestedArticles(issueDescription, options = {}) {
    const keywords = this.extractKeywords(issueDescription);
    const query = keywords.join(' ');

    return await this.search(query, {
      ...options,
      limit: options.limit || 5,
    });
  }

  /**
   * Extract important keywords from text.
   *
   * Filters stop words and returns most frequent meaningful words.
   *
   * @private
   * @param {string} text - Text to extract keywords from
   * @returns {Array<string>} Array of keywords (max 10)
   */
  extractKeywords(text) {
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'as',
      'is',
      'was',
      'are',
      'were',
      'been',
      'be',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'can',
      'this',
      'that',
      'these',
      'those',
      'over',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'my',
      'your',
      'his',
      'her',
      'its',
      'our',
      'their',
    ]);

    // Extract words longer than 3 characters, not in stop words
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word));

    // Count word frequency
    const frequency = {};
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Return top 10 most frequent keywords
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Get search suggestions based on partial input.
   *
   * Useful for autocomplete functionality.
   *
   * @async
   * @param {string} partial - Partial search term
   * @returns {Promise<Object>} Suggestions result
   * @returns {Array<string>} return.suggestions - Array of suggested terms
   *
   * @example
   * const suggestions = await kbService.getSearchSuggestions('sec');
   * // Returns: ['security', 'secure backup', 'security audit', ...]
   */
  async getSearchSuggestions(partial) {
    if (!this.initialized) {
      await this.initialize();
    }

    const lowerPartial = partial.toLowerCase();
    const suggestions = new Set();

    // Match against article titles and tags
    this.articles.forEach((article) => {
      if (article.title.toLowerCase().includes(lowerPartial)) {
        suggestions.add(article.title);
      }

      (article.tags || []).forEach((tag) => {
        if (tag.toLowerCase().includes(lowerPartial)) {
          suggestions.add(tag);
        }
      });
    });

    return {
      success: true,
      suggestions: Array.from(suggestions).slice(0, 10),
    };
  }
}

/**
 * Singleton instance of the Knowledge Base Service.
 *
 * @type {KnowledgeBaseService}
 * @example
 * import { knowledgeBaseService } from './knowledgeBaseService.js';
 * const results = await knowledgeBaseService.search('security breach');
 */
export const knowledgeBaseService = new KnowledgeBaseService();

export default knowledgeBaseService;
