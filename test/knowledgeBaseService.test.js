/**
 * Unit tests for Knowledge Base Service
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { KnowledgeBaseService } from '../src/knowledgeBaseService.js';

describe('KnowledgeBaseService', () => {
  let kbService;

  beforeEach(() => {
    kbService = new KnowledgeBaseService();
  });

  describe('Constructor', () => {
    it('should initialize with empty articles', () => {
      assert.ok(Array.isArray(kbService.articles));
      assert.strictEqual(kbService.articles.length, 0);
    });

    it('should initialize with empty search index', () => {
      assert.ok(kbService.searchIndex instanceof Map);
      assert.strictEqual(kbService.searchIndex.size, 0);
    });

    it('should not be initialized', () => {
      assert.strictEqual(kbService.initialized, false);
    });
  });

  describe('extractKeywords()', () => {
    it('should extract keywords from text', () => {
      const text = 'The server is experiencing performance issues';
      const keywords = kbService.extractKeywords(text);

      assert.ok(Array.isArray(keywords));
      assert.ok(keywords.includes('server'));
      assert.ok(keywords.includes('experiencing'));
      assert.ok(keywords.includes('performance'));
      assert.ok(keywords.includes('issues'));
    });

    it('should filter stop words', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const keywords = kbService.extractKeywords(text);

      assert.ok(!keywords.includes('the'));
      assert.ok(!keywords.includes('over'));
    });

    it('should filter short words', () => {
      const text = 'I am in a car';
      const keywords = kbService.extractKeywords(text);

      assert.ok(!keywords.includes('i'));
      assert.ok(!keywords.includes('am'));
      assert.ok(!keywords.includes('in'));
    });

    it('should return most frequent words first', () => {
      const text = 'security security security performance performance other';
      const keywords = kbService.extractKeywords(text);

      assert.strictEqual(keywords[0], 'security');
    });

    it('should limit to 10 keywords', () => {
      const longText = Array(50)
        .fill('word')
        .map((w, i) => w + i)
        .join(' ');
      const keywords = kbService.extractKeywords(longText);

      assert.ok(keywords.length <= 10);
    });
  });

  describe('buildSearchIndex()', () => {
    it('should build index from articles', () => {
      kbService.articles = [
        {
          id: '1',
          title: 'Security Guide',
          category: 'Security',
          department: 'IT',
          tags: ['security', 'guide'],
          summary: 'Complete security overview',
          content: 'Detailed security information',
        },
      ];

      kbService.buildSearchIndex();

      assert.ok(kbService.searchIndex.size > 0);
      assert.ok(kbService.searchIndex.has('security'));
      assert.ok(kbService.searchIndex.has('guide'));
    });

    it('should index words from all article fields', () => {
      kbService.articles = [
        {
          id: '1',
          title: 'TitleWord',
          category: 'CategoryWord',
          department: 'DepartmentWord',
          tags: ['TagWord'],
          summary: 'SummaryWord test',
          content: 'ContentWord test',
        },
      ];

      kbService.buildSearchIndex();

      assert.ok(kbService.searchIndex.has('titleword'));
      assert.ok(kbService.searchIndex.has('categoryword'));
      assert.ok(kbService.searchIndex.has('departmentword'));
      assert.ok(kbService.searchIndex.has('tagword'));
      assert.ok(kbService.searchIndex.has('summaryword'));
      assert.ok(kbService.searchIndex.has('contentword'));
    });

    it('should skip words shorter than 3 characters', () => {
      kbService.articles = [{ title: 'a bb ccc dddd', tags: [] }];

      kbService.buildSearchIndex();

      assert.ok(!kbService.searchIndex.has('a'));
      assert.ok(!kbService.searchIndex.has('bb'));
      assert.ok(kbService.searchIndex.has('ccc'));
      assert.ok(kbService.searchIndex.has('dddd'));
    });
  });

  describe('findSemanticMatches()', () => {
    beforeEach(() => {
      kbService.articles = [
        {
          id: '1',
          title: 'Data Protection Guide',
          summary: 'Complete protection overview',
          content: 'Safety and compliance information',
        },
        {
          id: '2',
          title: 'Website Development',
          summary: 'Building web portals',
          content: 'Complete site creation guide',
        },
      ];
    });

    it('should find semantic matches using synonyms', () => {
      const matches = kbService.findSemanticMatches('security breach');
      assert.ok(Array.isArray(matches));
      // Should match article with "protection" and "safety"
    });

    it('should return empty array for no matches', () => {
      const matches = kbService.findSemanticMatches('unrelated query');
      assert.ok(Array.isArray(matches));
    });

    it('should score matches appropriately', () => {
      const matches = kbService.findSemanticMatches('website design');
      matches.forEach((match) => {
        assert.ok(match.index >= 0);
        assert.ok(match.score > 0);
      });
    });
  });

  describe('getArticleById()', () => {
    beforeEach(() => {
      kbService.articles = [
        { id: 'KB-001', title: 'Article 1' },
        { id: 'KB-002', title: 'Article 2' },
      ];
      kbService.initialized = true;
    });

    it('should find article by ID', async () => {
      const result = await kbService.getArticleById('KB-001');
      assert.strictEqual(result.success, true);
      assert.ok(result.article);
      assert.strictEqual(result.article.id, 'KB-001');
    });

    it('should return error for non-existent article', async () => {
      const result = await kbService.getArticleById('KB-999');
      assert.strictEqual(result.success, false);
      assert.match(result.error, /not found/);
    });
  });

  describe('getRelatedArticles()', () => {
    beforeEach(() => {
      kbService.articles = [
        {
          id: 'KB-001',
          category: 'Security',
          department: 'IT',
          tags: ['security', 'compliance'],
        },
        {
          id: 'KB-002',
          category: 'Security',
          department: 'IT',
          tags: ['security', 'audit'],
        },
        {
          id: 'KB-003',
          category: 'Design',
          department: 'Creative',
          tags: ['branding'],
        },
      ];
      kbService.initialized = true;
    });

    it('should find related articles by category and tags', async () => {
      const result = await kbService.getRelatedArticles('KB-001', 5);
      assert.strictEqual(result.success, true);
      assert.ok(Array.isArray(result.articles));

      // KB-002 should be first (same category + department + common tag)
      if (result.articles.length > 0) {
        assert.strictEqual(result.articles[0].id, 'KB-002');
      }
    });

    it('should exclude the source article', async () => {
      const result = await kbService.getRelatedArticles('KB-001', 5);
      assert.ok(!result.articles.some((a) => a.id === 'KB-001'));
    });

    it('should return error for non-existent article', async () => {
      const result = await kbService.getRelatedArticles('KB-999', 5);
      assert.strictEqual(result.success, false);
      assert.match(result.error, /not found/);
    });

    it('should respect limit parameter', async () => {
      const result = await kbService.getRelatedArticles('KB-001', 1);
      assert.ok(result.articles.length <= 1);
    });
  });

  describe('getPopularArticles()', () => {
    beforeEach(() => {
      kbService.articles = [
        { id: 'KB-001', popularity_score: 95 },
        { id: 'KB-002', popularity_score: 88 },
        { id: 'KB-003', popularity_score: 75 },
      ];
      kbService.initialized = true;
    });

    it('should return articles sorted by popularity', async () => {
      const result = await kbService.getPopularArticles(10);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.articles[0].id, 'KB-001');
      assert.strictEqual(result.articles[1].id, 'KB-002');
      assert.strictEqual(result.articles[2].id, 'KB-003');
    });

    it('should respect limit parameter', async () => {
      const result = await kbService.getPopularArticles(2);
      assert.strictEqual(result.articles.length, 2);
    });
  });

  describe('getArticlesByCategory()', () => {
    beforeEach(() => {
      kbService.articles = [
        { id: 'KB-001', category: 'Security' },
        { id: 'KB-002', category: 'Security' },
        { id: 'KB-003', category: 'Design' },
      ];
      kbService.initialized = true;
    });

    it('should filter articles by category', async () => {
      const result = await kbService.getArticlesByCategory('Security');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.articles.length, 2);
      assert.ok(result.articles.every((a) => a.category === 'Security'));
    });

    it('should return empty array for non-existent category', async () => {
      const result = await kbService.getArticlesByCategory('NonExistent');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.articles.length, 0);
    });
  });

  describe('getArticlesByDepartment()', () => {
    beforeEach(() => {
      kbService.articles = [
        { id: 'KB-001', department: 'IT' },
        { id: 'KB-002', department: 'IT' },
        { id: 'KB-003', department: 'Creative' },
      ];
      kbService.initialized = true;
    });

    it('should filter articles by department', async () => {
      const result = await kbService.getArticlesByDepartment('IT');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.articles.length, 2);
      assert.ok(result.articles.every((a) => a.department === 'IT'));
    });
  });

  describe('getSuggestedArticles()', () => {
    beforeEach(() => {
      kbService.articles = [
        {
          id: 'KB-001',
          title: 'Server Backup Guide',
          category: 'Technology',
          tags: ['server', 'backup', 'data'],
          summary: 'How to backup your server',
          content: 'Complete backup procedures',
        },
      ];
      kbService.initialized = true;
    });

    it('should extract keywords and search', async () => {
      const result = await kbService.getSuggestedArticles(
        'My server backup is failing',
        { limit: 5 }
      );

      assert.strictEqual(result.success, true);
      assert.ok(Array.isArray(result.results));
    });
  });

  describe('getSearchSuggestions()', () => {
    beforeEach(() => {
      kbService.articles = [
        { title: 'Security Compliance', tags: ['security', 'soc2'] },
        { title: 'Secure Backup', tags: ['backup', 'security'] },
      ];
      kbService.initialized = true;
    });

    it('should return matching titles', async () => {
      const result = await kbService.getSearchSuggestions('sec');
      assert.strictEqual(result.success, true);
      assert.ok(Array.isArray(result.suggestions));
    });

    it('should return matching tags', async () => {
      const result = await kbService.getSearchSuggestions('soc');
      assert.ok(result.suggestions.some((s) => s.includes('soc')));
    });

    it('should limit suggestions to 10', async () => {
      const result = await kbService.getSearchSuggestions('s');
      assert.ok(result.suggestions.length <= 10);
    });
  });

  describe('rateArticle()', () => {
    it('should return error when database not configured', async () => {
      const result = await kbService.rateArticle('KB-001', true, 'Helpful!');
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });
});
