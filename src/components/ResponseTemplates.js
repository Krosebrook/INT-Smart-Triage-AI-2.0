import { supabase } from '../services/supabaseClient.js';
import { isGuestDemoMode } from '../services/sessionState.js';
import { fetchDemoData } from '../services/demoApiClient.js';

export class ResponseTemplates {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.templates = [];
    this.selectedCategory = 'all';
    this.selectedTone = 'all';
  }

  async init() {
    await this.loadTemplates();
    this.render();
  }

  async loadTemplates() {
    if (isGuestDemoMode()) {
      const { data, error } = await fetchDemoData('response-templates');
      if (error) {
        console.error('Error loading demo templates:', error);
        this.templates = [];
        return;
      }
      this.templates = data?.templates || [];
      return;
    }

    const { data, error } = await supabase
      .from('response_templates')
      .select('*, created_by_user:users(name)')
      .order('usage_count', { ascending: false });

    if (error) {
      console.error('Error loading templates:', error);
      return;
    }

    this.templates = data || [];
  }

  async generateAITemplate(category, tone, context) {
    const response = await fetch('/api/generate-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, tone, context })
    });

    if (!response.ok) {
      throw new Error('Failed to generate template');
    }

    const data = await response.json();
    return data.template;
  }

  async saveTemplate(templateData) {
    if (isGuestDemoMode()) {
      alert('Demo mode is read-only. Templates cannot be saved.');
      return null;
    }
    const { data, error } = await supabase
      .from('response_templates')
      .insert({
        name: templateData.name,
        category: templateData.category,
        tone: templateData.tone,
        template_text: templateData.template_text,
        variables: templateData.variables || {},
        created_by: (await supabase.auth.getUser()).data.user?.id,
        is_ai_generated: templateData.is_ai_generated || false
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving template:', error);
      throw error;
    }

    this.templates.unshift(data);
    this.render();
    return data;
  }

  async useTemplate(templateId) {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return null;

    if (isGuestDemoMode()) {
      return template;
    }

    await supabase
      .from('response_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', templateId);

    template.usage_count += 1;

    return template;
  }

  getFilteredTemplates() {
    return this.templates.filter(template => {
      if (this.selectedCategory !== 'all' && template.category !== this.selectedCategory) {
        return false;
      }
      if (this.selectedTone !== 'all' && template.tone !== this.selectedTone) {
        return false;
      }
      return true;
    });
  }

  render() {
    const readOnly = isGuestDemoMode();
    const filteredTemplates = this.getFilteredTemplates();
    const categories = [...new Set(this.templates.map(t => t.category))];
    const tones = [...new Set(this.templates.map(t => t.tone))];

    this.container.innerHTML = `
      <div class="templates-container">
        <div class="templates-header">
          <h3>Response Templates</h3>
          <button class="btn-primary btn-small" ${readOnly ? 'disabled title="Demo mode is read-only"' : ''} onclick="window.responseTemplates.showCreateDialog()">
            + New Template
          </button>
        </div>

        <div class="templates-filters">
          <select id="categoryFilter" class="filter-select">
            <option value="all">All Categories</option>
            ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
          </select>

          <select id="toneFilter" class="filter-select">
            <option value="all">All Tones</option>
            ${tones.map(tone => `<option value="${tone}">${tone}</option>`).join('')}
          </select>

          <button class="btn-secondary btn-small" ${readOnly ? 'disabled title="Demo mode is read-only"' : ''} onclick="window.responseTemplates.showAIGenerator()">
            ✨ Generate with AI
          </button>
        </div>

        <div class="templates-grid">
          ${filteredTemplates.map(template => this.renderTemplateCard(template)).join('')}
          ${filteredTemplates.length === 0 ? '<div class="empty-state">No templates found</div>' : ''}
        </div>
      </div>

      <div id="templateDialog" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h4>Create Response Template</h4>
            <button class="btn-icon" onclick="window.responseTemplates.closeDialog()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Template Name</label>
              <input type="text" id="templateName" class="form-input" placeholder="e.g., Password Reset Request">
            </div>
            <div class="form-group">
              <label>Category</label>
              <select id="templateCategory" class="form-input">
                <option value="technical">Technical Support</option>
                <option value="billing">Billing</option>
                <option value="account">Account Management</option>
                <option value="general">General Inquiry</option>
              </select>
            </div>
            <div class="form-group">
              <label>Tone</label>
              <select id="templateTone" class="form-input">
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="empathetic">Empathetic</option>
                <option value="formal">Formal</option>
              </select>
            </div>
            <div class="form-group">
              <label>Template Text</label>
              <textarea id="templateText" class="form-textarea" rows="8" placeholder="Use {{variable}} for dynamic content"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="window.responseTemplates.closeDialog()">Cancel</button>
            <button class="btn-primary" onclick="window.responseTemplates.saveNewTemplate()">Save Template</button>
          </div>
        </div>
      </div>

      <div id="aiGeneratorDialog" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h4>AI Template Generator</h4>
            <button class="btn-icon" onclick="window.responseTemplates.closeAIDialog()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Category</label>
              <select id="aiCategory" class="form-input">
                <option value="technical">Technical Support</option>
                <option value="billing">Billing</option>
                <option value="account">Account Management</option>
                <option value="general">General Inquiry</option>
              </select>
            </div>
            <div class="form-group">
              <label>Tone</label>
              <select id="aiTone" class="form-input">
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="empathetic">Empathetic</option>
                <option value="formal">Formal</option>
              </select>
            </div>
            <div class="form-group">
              <label>Context / Situation</label>
              <textarea id="aiContext" class="form-textarea" rows="4" placeholder="Describe the situation this template should address..."></textarea>
            </div>
            <div id="aiGeneratedTemplate" style="display: none;">
              <div class="form-group">
                <label>Generated Template</label>
                <textarea id="aiGeneratedText" class="form-textarea" rows="8"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="window.responseTemplates.closeAIDialog()">Cancel</button>
            <button id="generateBtn" class="btn-primary" onclick="window.responseTemplates.generateTemplate()">Generate</button>
            <button id="saveAIBtn" class="btn-primary" style="display: none;" onclick="window.responseTemplates.saveAITemplate()">Save Template</button>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  renderTemplateCard(template) {
    const aiIndicator = template.is_ai_generated ? '<span class="ai-badge">✨ AI</span>' : '';
    const authorName = template.created_by_user?.name || 'Unknown';

    return `
      <div class="template-card">
        <div class="template-card-header">
          <h4>${this.escapeHtml(template.name)}</h4>
          ${aiIndicator}
        </div>
        <div class="template-meta">
          <span class="badge">${template.category}</span>
          <span class="badge">${template.tone}</span>
        </div>
        <div class="template-preview">
          ${this.escapeHtml(template.template_text.substring(0, 150))}${template.template_text.length > 150 ? '...' : ''}
        </div>
        <div class="template-stats">
          <span>Used ${template.usage_count} times</span>
          ${template.effectiveness_score > 0 ? `<span>⭐ ${template.effectiveness_score.toFixed(1)}</span>` : ''}
        </div>
        <div class="template-footer">
          <span class="text-muted">By ${this.escapeHtml(authorName)}</span>
          <div class="template-actions">
            <button class="btn-small btn-primary" onclick="window.responseTemplates.previewTemplate('${template.id}')">Preview</button>
            <button class="btn-small btn-secondary" onclick="window.responseTemplates.useTemplateAction('${template.id}')">Use</button>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const categoryFilter = document.getElementById('categoryFilter');
    const toneFilter = document.getElementById('toneFilter');

    if (categoryFilter) {
      categoryFilter.value = this.selectedCategory;
      categoryFilter.addEventListener('change', (e) => {
        this.selectedCategory = e.target.value;
        this.render();
      });
    }

    if (toneFilter) {
      toneFilter.value = this.selectedTone;
      toneFilter.addEventListener('change', (e) => {
        this.selectedTone = e.target.value;
        this.render();
      });
    }
  }

  showCreateDialog() {
    document.getElementById('templateDialog').style.display = 'flex';
  }

  closeDialog() {
    document.getElementById('templateDialog').style.display = 'none';
  }

  showAIGenerator() {
    document.getElementById('aiGeneratorDialog').style.display = 'flex';
    document.getElementById('aiGeneratedTemplate').style.display = 'none';
    document.getElementById('generateBtn').style.display = 'block';
    document.getElementById('saveAIBtn').style.display = 'none';
  }

  closeAIDialog() {
    document.getElementById('aiGeneratorDialog').style.display = 'none';
  }

  async generateTemplate() {
    const category = document.getElementById('aiCategory').value;
    const tone = document.getElementById('aiTone').value;
    const context = document.getElementById('aiContext').value;

    if (!context.trim()) {
      alert('Please provide context for the template');
      return;
    }

    document.getElementById('generateBtn').disabled = true;
    document.getElementById('generateBtn').textContent = 'Generating...';

    try {
      const template = await this.generateAITemplate(category, tone, context);
      document.getElementById('aiGeneratedText').value = template;
      document.getElementById('aiGeneratedTemplate').style.display = 'block';
      document.getElementById('generateBtn').style.display = 'none';
      document.getElementById('saveAIBtn').style.display = 'block';
    } catch (error) {
      alert('Failed to generate template: ' + error.message);
      document.getElementById('generateBtn').disabled = false;
      document.getElementById('generateBtn').textContent = 'Generate';
    }
  }

  async saveNewTemplate() {
    const name = document.getElementById('templateName').value;
    const category = document.getElementById('templateCategory').value;
    const tone = document.getElementById('templateTone').value;
    const text = document.getElementById('templateText').value;

    if (!name || !text) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await this.saveTemplate({
        name,
        category,
        tone,
        template_text: text,
        is_ai_generated: false
      });

      this.closeDialog();
      document.getElementById('templateName').value = '';
      document.getElementById('templateText').value = '';
    } catch (error) {
      alert('Failed to save template');
    }
  }

  async saveAITemplate() {
    const category = document.getElementById('aiCategory').value;
    const tone = document.getElementById('aiTone').value;
    const text = document.getElementById('aiGeneratedText').value;
    const context = document.getElementById('aiContext').value;

    const name = context.substring(0, 50) + (context.length > 50 ? '...' : '');

    try {
      await this.saveTemplate({
        name,
        category,
        tone,
        template_text: text,
        is_ai_generated: true
      });

      this.closeAIDialog();
    } catch (error) {
      alert('Failed to save template');
    }
  }

  previewTemplate(templateId) {
    const template = this.templates.find(t => t.id === templateId);
    if (template) {
      window.dispatchEvent(new CustomEvent('preview-template', { detail: { template } }));
    }
  }

  async useTemplateAction(templateId) {
    const template = await this.useTemplate(templateId);
    if (template) {
      window.dispatchEvent(new CustomEvent('use-template', { detail: { template } }));
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
