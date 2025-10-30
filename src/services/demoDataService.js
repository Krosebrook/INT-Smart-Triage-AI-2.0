import {
  demoChannelMessages,
  demoCustomers,
  demoKnowledgeBaseArticles,
  demoResponseTemplates,
  demoSentimentAnalytics,
  demoTicketFollowUps,
  demoTicketMessages,
  demoTickets,
  demoUsers,
  demoCsrPerformance
} from '../demo/demoDataset.js';

function buildTicket(ticket) {
  if (!ticket || Object.keys(ticket).length === 0) {
    return null;
  }

  const customer = demoCustomers.find(c => c.id === ticket.customer_id) || null;
  const assignedUser = ticket.assigned_to
    ? demoUsers.find(user => user.id === ticket.assigned_to) || null
    : null;

  return {
    ...ticket,
    customer,
    assigned_user: assignedUser
  };
}

function getTickets() {
  return demoTickets.map(buildTicket).filter(Boolean);
}

function getTicketDetail(ticketId) {
  const ticket = demoTickets.find(t => t.id === ticketId);
  if (!ticket) {
    return null;
  }
  const messages = demoTicketMessages
    .filter(msg => msg.ticket_id === ticketId)
    .map(message => ({
      ...message,
      sender_user: message.sender_type === 'csr'
        ? demoUsers.find(user => user.name === message.sender_name) || null
        : null
    }));
  return {
    ...buildTicket(ticket),
    messages
  };
}

function getCustomerContext(customerId) {
  const customer = demoCustomers.find(c => c.id === customerId);
  if (!customer) {
    return null;
  }

  const ticketHistory = demoTickets
    .filter(ticket => ticket.customer_id === customerId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(buildTicket)
    .filter(Boolean);

  const sentiment = demoSentimentAnalytics
    .filter(item => item.customer_id === customerId)
    .sort((a, b) => new Date(b.period_start) - new Date(a.period_start))[0] || null;

  return {
    customer,
    tickets: ticketHistory,
    sentiment
  };
}

function getSentimentRange(startDate, endDate) {
  const withinRange = demoSentimentAnalytics.filter(item => {
    const start = new Date(item.period_start);
    const end = new Date(item.period_end);
    return (!startDate || start >= new Date(startDate)) && (!endDate || end <= new Date(endDate));
  });

  const tickets = demoTickets.filter(ticket => {
    const created = new Date(ticket.created_at);
    return (!startDate || created >= new Date(startDate)) && (!endDate || created <= new Date(endDate));
  }).map(buildTicket).filter(Boolean);

  const csrPerformance = demoCsrPerformance.map(performance => ({
    ...performance,
    csr: demoUsers.find(user => user.id === performance.csr_id) || null
  }));

  return {
    sentiment: withinRange,
    performance: csrPerformance,
    tickets
  };
}

function getChannelMessages(channelType) {
  const messages = demoChannelMessages
    .filter(message => channelType === 'all' || message.channel_type === channelType)
    .map(message => ({
      ...message,
      customer: demoCustomers.find(customer => customer.id === message.customer_id) || null,
      ticket: message.ticket_id ? buildTicket(demoTickets.find(ticket => ticket.id === message.ticket_id) || {}) : null
    }));

  return { messages };
}

function getFollowUps() {
  const enriched = demoTicketFollowUps.map(followUp => {
    const ticket = demoTickets.find(t => t.id === followUp.ticket_id);
    return {
      ...followUp,
      ticket: ticket ? buildTicket(ticket) : null
    };
  });

  const now = new Date();
  return {
    pending: enriched.filter(fu => !fu.completed && new Date(fu.scheduled_for) <= now),
    upcoming: enriched.filter(fu => !fu.completed && new Date(fu.scheduled_for) > now)
  };
}

function getCsrAssignmentSnapshot() {
  const csrs = demoUsers.map(user => ({
    ...user,
    role: user.role,
    availability_status: user.availability_status || 'available',
    max_concurrent_tickets: user.max_concurrent_tickets || 5,
    specializations: user.specializations || []
  }));

  const tickets = getTickets().filter(ticket => ['open', 'in_progress'].includes(ticket?.status));

  return { csrs, tickets };
}

export function getDemoResource(resource, params = {}) {
  switch (resource) {
    case 'tickets':
      return { tickets: getTickets() };
    case 'ticket-detail':
      return { ticket: getTicketDetail(params.ticketId) };
    case 'customer-context':
      return { context: getCustomerContext(params.customerId) };
    case 'response-templates':
      return { templates: demoResponseTemplates };
    case 'knowledge-base':
      return { articles: demoKnowledgeBaseArticles };
    case 'channel-messages':
      return getChannelMessages(params.channel || 'all');
    case 'sentiment-analytics':
      return getSentimentRange(params.startDate, params.endDate);
    case 'follow-ups':
      return getFollowUps();
    case 'csr-assignment':
      return getCsrAssignmentSnapshot();
    default:
      return null;
  }
}
