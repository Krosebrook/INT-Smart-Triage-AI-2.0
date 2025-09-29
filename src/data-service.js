/**
 * Data Service Module
 * Handles loading and managing application data
 */

import { APP_CONFIG } from '../config/app-config.js';

class DataService {
  constructor() {
    this.personas = [];
    this.knowledgeBase = [];
    this.isPersonasLoaded = false;
    this.isKnowledgeBaseLoaded = false;
  }

  /**
   * Load personas from JSON file
   * @returns {Promise<Array>}
   */
  async loadPersonas() {
    if (this.isPersonasLoaded) {
      return this.personas;
    }

    try {
      const response = await fetch(APP_CONFIG.DATA_PATHS.PERSONAS);
      if (!response.ok) {
        throw new Error(`Failed to load personas: ${response.status} ${response.statusText}`);
      }

      this.personas = await response.json();
      this.isPersonasLoaded = true;
      return this.personas;
    } catch (error) {
      console.error('Error loading personas:', error);
      throw new Error(`Failed to load persona data: ${error.message}`);
    }
  }

  /**
   * Load knowledge base from JSON file
   * @returns {Promise<Array>}
   */
  async loadKnowledgeBase() {
    if (this.isKnowledgeBaseLoaded) {
      return this.knowledgeBase;
    }

    try {
      const response = await fetch(APP_CONFIG.DATA_PATHS.KNOWLEDGE_BASE);
      if (!response.ok) {
        throw new Error(`Failed to load knowledge base: ${response.status} ${response.statusText}`);
      }

      this.knowledgeBase = await response.json();
      this.isKnowledgeBaseLoaded = true;
      console.log('Knowledge base loaded:', this.knowledgeBase.length, 'articles');
      return this.knowledgeBase;
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      throw new Error(`Failed to load knowledge base: ${error.message}`);
    }
  }

  /**
   * Get all personas
   * @returns {Array}
   */
  getPersonas() {
    return this.personas;
  }

  /**
   * Find persona by ID
   * @param {string} id - Persona ID
   * @returns {object|null}
   */
  getPersonaById(id) {
    return this.personas.find(persona => persona.id === id) || null;
  }

  /**
   * Get knowledge base articles
   * @returns {Array}
   */
  getKnowledgeBase() {
    return this.knowledgeBase;
  }

  /**
   * Find relevant knowledge base articles for a domain
   * @param {string} domain - Domain to search for
   * @param {number} maxResults - Maximum number of results
   * @returns {Array}
   */
  findRelevantKBArticles(domain, maxResults = APP_CONFIG.UI.MAX_KB_ARTICLES) {
    return this.knowledgeBase
      .filter(article => 
        article.category === domain || article.tags.includes(domain)
      )
      .slice(0, maxResults);
  }

  /**
   * Initialize all data (load both personas and knowledge base)
   * @returns {Promise<void>}
   */
  async initialize() {
    await Promise.all([
      this.loadPersonas(),
      this.loadKnowledgeBase()
    ]);
  }
}

// Create and export a singleton instance
export const dataService = new DataService();
export default dataService;