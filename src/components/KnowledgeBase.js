import { supabase } from '../services/supabaseClient.js';
import { isGuestDemoMode } from '../services/sessionState.js';
import { fetchDemoData } from '../services/demoApiClient.js';

export class KnowledgeBase {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.articles = [];
    this.searchQuery = '';
    this.selectedCategory = 'all';
  }

  async init() {
    await this.loadArticles();
    this.render();
  }

  async loadArticles() {
    if (isGuestDemoMode()) {
      const { data, error } = await fetchDemoData('knowledge-base');
      if (error) {
        console.error('Error loading demo knowledge base:', error);
        this.articles = [];
        return;
      }
      this.articles = (data?.articles || []).filter(article => article.published);
      return;
    }

    const { data, error } = await supabase
      .from('knowledge_base_articles')
      .select('*, author:users(name)')
      .eq('published', true)
      .order('view_count', { ascending: false });

    if (error) {
      console.error('Error loading articles:', error);
      return;
    }

    this.articles = data || [];
  }

  async searchArticles(query) {
    if (!query.trim()) {
      await this.loadArticles();
      return;
    }

    if (isGuestDemoMode()) {
      const lower = query.toLowerCase();
      this.articles = this.articles.filter(article =>
        article.title.toLowerCase().includes(lower) ||
        article.content.toLowerCase().includes(lower) ||
        (article.tags || []).some(tag => tag.toLowerCase().includes(lower))
      );
      return;
    }

    const { data, error } = await supabase
      .from('knowledge_base_articles')
      .select('*, author:users(name)')
      .eq('published', true)
      .textSearch('search_vector', query, {
        type: 'websearch',
        config: 'english'
      });

    if (error) {
      console.error('Error searching articles:', error);
      return;
    }

    this.articles = data || [];
  }

  async createArticleFromTicket(ticketId) {
    if (isGuestDemoMode()) {
      throw new Error('Article creation is disabled in demo mode.');
    }
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*, messages:ticket_messages(*)')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new Error('Failed to load ticket');
    }

    const response = await fetch('/api/generate-kb-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: ticket.subject,
        description: ticket.description,
        messages: ticket.messages
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate article');
    }

    const { title, content, category, tags } = await response.json();

    const { data: user } = await supabase.auth.getUser();

    const { data: article, error } = await supabase
      .from('knowledge_base_articles')
      .insert({
        title,
        content,
        category,
        tags,
        author_id: user?.user?.id,
        created_from_ticket_id: ticketId,
        published: false
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return article;
  }

  async incrementViewCount(articleId) {
    const article = this.articles.find(a => a.id === articleId);
    if (!article) return;

    if (isGuestDemoMode()) {
      article.view_count = (article.view_count || 0) + 1;
      this.render();
      return;
    }

    await supabase
      .from('knowledge_base_articles')
      .update({ view_count: article.view_count + 1 })
      .eq('id', articleId);
  }

  async rateArticle(articleId, helpful) {
    const article = this.articles.find(a => a.id === articleId);
    if (!article) return;

    const updates = helpful
      ? { helpful_count: article.helpful_count + 1 }
      : { not_helpful_count: article.not_helpful_count + 1 };

    if (isGuestDemoMode()) {
      Object.assign(article, updates);
      this.render();
      return;
    }

    await supabase
      .from('knowledge_base_articles')
      .update(updates)
      .eq('id', articleId);

    if (helpful) {
      article.helpful_count += 1;
    } else {
      article.not_helpful_count += 1;
    }

    this.render();
  }

  getFilteredArticles() {
    let filtered = this.articles;

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === this.selectedCategory);
    }

    return filtered;
  }

  render() {
    const filteredArticles = this.getFilteredArticles();
    const categories = [...new Set(this.articles.map(a => a.category))];
    const readOnly = isGuestDemoMode();

    this.container.innerHTML = `
      <div class="kb-container">
        <div class="kb-header">
          <h3>Knowledge Base</h3>
          <button class="btn-primary btn-small" ${readOnly ? 'disabled title="Demo mode is read-only"' : ''} onclick="window.knowledgeBase.showCreateDialog()">
            + New Article
          </button>
        </div>

        <div class="kb-search">
          <input
            type="text"
            id="kbSearchInput"
            class="search-input"
            placeholder="Search articles..."
            value="${this.searchQuery}"
          >
          <button class="btn-icon" onclick="window.knowledgeBase.performSearch()">🔍</button>
        </div>

        <div class="kb-filters">
          <select id="kbCategoryFilter" class="filter-select">
            <option value="all">All Categories</option>
            ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
          </select>
        </div>

        <div class="kb-stats">
          <span>${filteredArticles.length} articles</span>
          <span>•</span>
          <span>${this.articles.reduce((sum, a) => sum + a.view_count, 0)} total views</span>
        </div>

        <div class="kb-grid">
          ${filteredArticles.map(article => this.renderArticleCard(article)).join('')}
          ${filteredArticles.length === 0 ? '<div class="empty-state">No articles found</div>' : ''}
        </div>
      </div>

      <div id="kbArticleDialog" class="modal" style="display: none;">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h4 id="articleModalTitle">Article</h4>
            <button class="btn-icon" onclick="window.knowledgeBase.closeArticleDialog()">×</button>
          </div>
          <div class="modal-body">
            <div id="articleContent"></div>
            <div class="article-rating">
              <p>Was this article helpful?</p>
              <button class="btn-small btn-secondary" onclick="window.knowledgeBase.rateCurrentArticle(true)">👍 Yes</button>
              <button class="btn-small btn-secondary" onclick="window.knowledgeBase.rateCurrentArticle(false)">👎 No</button>
            </div>
          </div>
        </div>
      </div>

      <div id="createArticleDialog" class="modal" style="display: none;">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h4>Create Knowledge Base Article</h4>
            <button class="btn-icon" onclick="window.knowledgeBase.closeCreateDialog()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Title</label>
              <input type="text" id="articleTitle" class="form-input" placeholder="Article title">
            </div>
            <div class="form-group">
              <label>Category</label>
              <select id="articleCategory" class="form-input">
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
                <option value="account">Account</option>
                <option value="general">General</option>
              </select>
            </div>
            <div class="form-group">
              <label>Tags (comma-separated)</label>
              <input type="text" id="articleTags" class="form-input" placeholder="tag1, tag2, tag3">
            </div>
            <div class="form-group">
              <label>Content (Markdown supported)</label>
              <textarea id="articleContent" class="form-textarea" rows="12"></textarea>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="articlePublished"> Publish immediately
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="window.knowledgeBase.closeCreateDialog()">Cancel</button>
            <button class="btn-primary" onclick="window.knowledgeBase.saveArticle()">Save Article</button>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  renderArticleCard(article) {
    const totalRatings = article.helpful_count + article.not_helpful_count;
    const helpfulPercent = totalRatings > 0
      ? Math.round((article.helpful_count / totalRatings) * 100)
      : 0;

    const fromTicketBadge = article.created_from_ticket_id
      ? '<span class="badge badge-info">From Ticket</span>'
      : '';

    return `
      <div class="kb-card" onclick="window.knowledgeBase.viewArticle('${article.id}')">
        <div class="kb-card-header">
          <h4>${this.escapeHtml(article.title)}</h4>
          <span class="badge">${article.category}</span>
        </div>
        <div class="kb-card-content">
          ${this.escapeHtml(article.content.substring(0, 150))}${article.content.length > 150 ? '...' : ''}
        </div>
        <div class="kb-card-meta">
          <div class="kb-tags">
            ${article.tags.slice(0, 3).map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
          </div>
          ${fromTicketBadge}
        </div>
        <div class="kb-card-stats">
          <span>👁️ ${article.view_count} views</span>
          ${totalRatings > 0 ? `<span>👍 ${helpfulPercent}% helpful</span>` : ''}
          <span class="text-muted">By ${this.escapeHtml(article.author?.name || 'Unknown')}</span>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const searchInput = document.getElementById('kbSearchInput');
    const categoryFilter = document.getElementById('kbCategoryFilter');

    if (searchInput) {
      searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          this.performSearch();
        }
      });
    }

    if (categoryFilter) {
      categoryFilter.value = this.selectedCategory;
      categoryFilter.addEventListener('change', (e) => {
        this.selectedCategory = e.target.value;
        this.render();
      });
    }
  }

  async performSearch() {
    const input = document.getElementById('kbSearchInput');
    if (input) {
      this.searchQuery = input.value;
      await this.searchArticles(this.searchQuery);
      this.render();
    }
  }

  async viewArticle(articleId) {
    const article = this.articles.find(a => a.id === articleId);
    if (!article) return;

    await this.incrementViewCount(articleId);

    document.getElementById('articleModalTitle').textContent = article.title;
    document.getElementById('articleContent').innerHTML = `
      <div class="article-full">
        <div class="article-meta">
          <span class="badge">${article.category}</span>
          <span class="text-muted">By ${this.escapeHtml(article.author?.name || 'Unknown')}</span>
        </div>
        <div class="article-body">
          ${this.formatMarkdown(article.content)}
        </div>
        <div class="article-tags">
          ${article.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
        </div>
      </div>
    `;

    this.currentArticleId = articleId;
    document.getElementById('kbArticleDialog').style.display = 'flex';
  }

  closeArticleDialog() {
    document.getElementById('kbArticleDialog').style.display = 'none';
    this.currentArticleId = null;
  }

  rateCurrentArticle(helpful) {
    if (this.currentArticleId) {
      this.rateArticle(this.currentArticleId, helpful);
      this.closeArticleDialog();
    }
  }

  showCreateDialog() {
    document.getElementById('createArticleDialog').style.display = 'flex';
  }

  closeCreateDialog() {
    document.getElementById('createArticleDialog').style.display = 'none';
  }

  async saveArticle() {
    const title = document.getElementById('articleTitle').value;
    const category = document.getElementById('articleCategory').value;
    const tagsInput = document.getElementById('articleTags').value;
    const content = document.getElementById('articleContent').value;
    const published = document.getElementById('articlePublished').checked;

    if (!title || !content) {
      alert('Please fill in title and content');
      return;
    }

    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);

    const { data: user } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('knowledge_base_articles')
      .insert({
        title,
        category,
        tags,
        content,
        author_id: user?.user?.id,
        published
      });

    if (error) {
      console.error('Error saving article:', error);
      alert('Failed to save article');
      return;
    }

    await this.loadArticles();
    this.render();
    this.closeCreateDialog();
  }

  formatMarkdown(text) {
    return text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
