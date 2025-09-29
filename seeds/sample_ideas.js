/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('ideas').del();
  
  // Insert sample ideas
  await knex('ideas').insert([
    {
      title: 'Implement AI-Powered Auto-Response',
      description: 'Create an intelligent system that can automatically respond to common customer queries using natural language processing and predefined response templates.'
    },
    {
      title: 'Dashboard Analytics Enhancement',
      description: 'Add real-time analytics to the CSR dashboard showing ticket volume, response times, and customer satisfaction metrics with interactive charts.'
    },
    {
      title: 'Mobile App for Field Agents',
      description: 'Develop a mobile application that allows field service agents to access customer information, update ticket status, and upload photos directly from their mobile devices.'
    },
    {
      title: 'Integration with Popular CRM Systems',
      description: 'Build seamless integrations with Salesforce, HubSpot, and other popular CRM systems to automatically sync customer data and ticket information.'
    },
    {
      title: 'Advanced Sentiment Analysis',
      description: 'Enhance the current sentiment detection with more nuanced analysis that can detect sarcasm, urgency levels, and emotional state to better guide CSR responses.'
    }
  ]);
};
