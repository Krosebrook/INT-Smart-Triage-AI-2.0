/**
 * Mock implementations for external API integrations
 * Used in tests to avoid real API calls
 */

/**
 * Mock Freshdesk API responses
 */
export const mockFreshdeskAPI = {
  createTicket: (data) => ({
    id: 12345,
    subject: data.subject,
    description: data.description,
    status: 2,
    priority: data.priority || 1,
    created_at: new Date().toISOString(),
  }),

  updateTicket: (ticketId, data) => ({
    id: ticketId,
    ...data,
    updated_at: new Date().toISOString(),
  }),

  getTicket: (ticketId) => ({
    id: ticketId,
    subject: 'Test Ticket',
    description: 'Test Description',
    status: 2,
    priority: 1,
  }),

  listTickets: () => ({
    tickets: [
      {
        id: 1,
        subject: 'Ticket 1',
        status: 2,
      },
      {
        id: 2,
        subject: 'Ticket 2',
        status: 3,
      },
    ],
  }),
};

/**
 * Mock HubSpot API responses
 */
export const mockHubSpotAPI = {
  createContact: (data) => ({
    id: '12345',
    properties: {
      email: data.email,
      firstname: data.firstname,
      lastname: data.lastname,
      createdate: new Date().toISOString(),
    },
  }),

  updateContact: (contactId, data) => ({
    id: contactId,
    properties: {
      ...data,
      lastmodifieddate: new Date().toISOString(),
    },
  }),

  getContact: (contactId) => ({
    id: contactId,
    properties: {
      email: 'test@example.com',
      firstname: 'Test',
      lastname: 'User',
    },
  }),

  searchContacts: (email) => ({
    results: [
      {
        id: '12345',
        properties: {
          email: email,
          firstname: 'Test',
          lastname: 'User',
        },
      },
    ],
  }),
};

/**
 * Mock fetch implementation for testing API calls
 */
export function createMockFetch(responses = {}) {
  return async (url, options = {}) => {
    const key = `${options.method || 'GET'} ${url}`;
    const mockResponse = responses[key] || responses[url] || { status: 200 };

    return {
      ok: mockResponse.status >= 200 && mockResponse.status < 300,
      status: mockResponse.status,
      statusText: mockResponse.statusText || 'OK',
      headers: new Map(Object.entries(mockResponse.headers || {})),
      json: async () => mockResponse.data || {},
      text: async () => JSON.stringify(mockResponse.data || {}),
    };
  };
}
