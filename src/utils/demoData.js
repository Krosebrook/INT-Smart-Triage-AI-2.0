import { supabase } from '../services/supabaseClient.js';

export async function seedDemoData() {
  console.log('Seeding demo data...');

  const demoUsers = [
    { email: 'sarah.johnson@intinc.com', name: 'Sarah Johnson', role: 'csr', specializations: ['technical', 'billing'] },
    { email: 'mike.chen@intinc.com', name: 'Mike Chen', role: 'senior_csr', specializations: ['technical', 'account'] },
    { email: 'emma.williams@intinc.com', name: 'Emma Williams', role: 'csr', specializations: ['general', 'billing'] },
    { email: 'james.brown@intinc.com', name: 'James Brown', role: 'manager', specializations: ['technical', 'account', 'billing'] }
  ];

  const { data: users, error: usersError } = await supabase
    .from('users')
    .insert(demoUsers)
    .select();

  if (usersError) {
    console.log('Users might already exist:', usersError.message);
    const { data: existingUsers } = await supabase.from('users').select('*');
    if (existingUsers && existingUsers.length > 0) {
      console.log('Using existing users');
      return;
    }
  }

  console.log('Users created:', users?.length || 0);

  const demoCustomers = [
    {
      email: 'john.doe@acmecorp.com',
      name: 'John Doe',
      company: 'Acme Corporation',
      phone: '+1-555-0101',
      contract_tier: 'enterprise',
      contract_start_date: '2024-01-01',
      contract_end_date: '2025-01-01',
      account_value: 150000,
      health_score: 85,
      at_risk: false
    },
    {
      email: 'jane.smith@techstart.com',
      name: 'Jane Smith',
      company: 'TechStart Inc',
      phone: '+1-555-0102',
      contract_tier: 'professional',
      contract_start_date: '2024-03-15',
      contract_end_date: '2025-03-15',
      account_value: 50000,
      health_score: 45,
      at_risk: true
    },
    {
      email: 'bob.wilson@globalent.com',
      name: 'Bob Wilson',
      company: 'Global Enterprises',
      phone: '+1-555-0103',
      contract_tier: 'enterprise',
      contract_start_date: '2023-06-01',
      contract_end_date: '2025-06-01',
      account_value: 250000,
      health_score: 92,
      at_risk: false
    }
  ];

  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .insert(demoCustomers)
    .select();

  if (customersError) {
    console.error('Error creating customers:', customersError);
    return;
  }

  console.log('Customers created:', customers?.length || 0);

  const demoTickets = [
    {
      ticket_number: 'TKT-10001',
      customer_id: customers[0].id,
      assigned_to: users[0].id,
      status: 'open',
      priority: 'urgent',
      category: 'technical',
      subject: 'API integration returning 500 errors',
      description: 'Our production environment is experiencing 500 errors when calling the /api/users endpoint. This is affecting our customer-facing application.',
      channel: 'email',
      sentiment_score: -0.3,
      ai_suggested_priority: 'urgent',
      ai_suggested_category: 'technical',
      escalated: false
    },
    {
      ticket_number: 'TKT-10002',
      customer_id: customers[1].id,
      assigned_to: users[2].id,
      status: 'in_progress',
      priority: 'high',
      category: 'billing',
      subject: 'Incorrect invoice amount for October',
      description: 'We received an invoice for $5,500 but our contract states $4,500 per month. Please review and correct.',
      channel: 'chat',
      sentiment_score: -0.5,
      ai_suggested_priority: 'high',
      ai_suggested_category: 'billing',
      escalated: false
    },
    {
      ticket_number: 'TKT-10003',
      customer_id: customers[2].id,
      assigned_to: users[0].id,
      status: 'waiting_customer',
      priority: 'medium',
      category: 'account',
      subject: 'Add new users to enterprise account',
      description: 'Please add 5 new user licenses to our account. Their details are attached.',
      channel: 'email',
      sentiment_score: 0.4,
      ai_suggested_priority: 'medium',
      ai_suggested_category: 'account',
      escalated: false
    },
    {
      ticket_number: 'TKT-10004',
      customer_id: customers[0].id,
      assigned_to: null,
      status: 'open',
      priority: 'low',
      category: 'general',
      subject: 'Question about feature roadmap',
      description: 'We are interested in knowing when the new analytics dashboard will be released.',
      channel: 'email',
      sentiment_score: 0.2,
      ai_suggested_priority: 'low',
      ai_suggested_category: 'general',
      escalated: false
    }
  ];

  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .insert(demoTickets)
    .select();

  if (ticketsError) {
    console.error('Error creating tickets:', ticketsError);
    return;
  }

  console.log('Tickets created:', tickets?.length || 0);

  const demoMessages = [
    {
      ticket_id: tickets[0].id,
      sender_type: 'customer',
      sender_id: customers[0].id,
      message: 'Our production API is down! We are getting 500 errors on all requests to /api/users. This is urgent!',
      channel: 'email'
    },
    {
      ticket_id: tickets[1].id,
      sender_type: 'customer',
      sender_id: customers[1].id,
      message: 'I received invoice #INV-2024-10 for $5,500, but our contract clearly states $4,500/month. This needs to be corrected immediately.',
      channel: 'chat'
    },
    {
      ticket_id: tickets[1].id,
      sender_type: 'csr',
      sender_id: users[2].id,
      message: 'Hi Jane, thank you for reaching out. I am reviewing your contract and invoice now. I will have an update for you within the hour.',
      channel: 'chat',
      ai_reviewed: true,
      ai_review_score: 0.85,
      ai_review_feedback: { tone_score: 0.9, completeness_score: 0.8, professionalism_score: 0.85 }
    }
  ];

  await supabase.from('ticket_messages').insert(demoMessages);

  const demoTemplates = [
    {
      name: 'API Error Investigation',
      category: 'technical',
      tone: 'professional',
      template_text: 'Hi {{customer_name}},\n\nThank you for reporting this issue. I understand you are experiencing 500 errors with the {{endpoint}} endpoint. I have escalated this to our engineering team and they are investigating now.\n\nI will keep you updated every 30 minutes until this is resolved.\n\nBest regards,\n{{csr_name}}',
      created_by: users[0].id,
      is_ai_generated: false,
      usage_count: 15,
      effectiveness_score: 0.92
    },
    {
      name: 'Billing Discrepancy Response',
      category: 'billing',
      tone: 'empathetic',
      template_text: 'Hi {{customer_name}},\n\nI apologize for the confusion with your invoice. I have reviewed your contract and can confirm that the correct amount is {{correct_amount}}. I am processing a corrected invoice now and will send it within 24 hours.\n\nPlease let me know if you have any questions.\n\nBest regards,\n{{csr_name}}',
      created_by: users[2].id,
      is_ai_generated: false,
      usage_count: 23,
      effectiveness_score: 0.88
    }
  ];

  await supabase.from('response_templates').insert(demoTemplates);

  const demoArticles = [
    {
      title: 'How to Troubleshoot API 500 Errors',
      content: 'API 500 errors indicate a server-side issue. Here are the steps to troubleshoot:\n\n1. Check the API status page\n2. Verify your authentication credentials\n3. Review recent API changes\n4. Contact support with error logs\n\nFor urgent issues, please escalate to our technical team.',
      category: 'technical',
      tags: ['api', 'troubleshooting', 'errors'],
      author_id: users[1].id,
      view_count: 145,
      helpful_count: 38,
      not_helpful_count: 2,
      published: true
    },
    {
      title: 'Understanding Your Monthly Invoice',
      content: 'Your monthly invoice includes:\n\n- Base subscription fee\n- Additional user licenses\n- Usage-based charges\n- Any applicable discounts\n\nInvoices are generated on the 1st of each month and payment is due within 30 days. If you notice any discrepancies, please contact our billing team.',
      category: 'billing',
      tags: ['billing', 'invoices', 'payments'],
      author_id: users[2].id,
      view_count: 89,
      helpful_count: 25,
      not_helpful_count: 1,
      published: true
    }
  ];

  await supabase.from('knowledge_base_articles').insert(demoArticles);

  const demoChannelMessages = [
    {
      channel_type: 'email',
      customer_id: customers[0].id,
      raw_message: {
        subject: 'Feature request: Dark mode',
        body: 'Would love to see a dark mode option in the dashboard',
        from: 'john.doe@acmecorp.com'
      },
      processed: false
    },
    {
      channel_type: 'chat',
      customer_id: customers[1].id,
      ticket_id: tickets[1].id,
      raw_message: {
        message: 'Thanks for looking into this!',
        timestamp: new Date().toISOString()
      },
      processed: true
    }
  ];

  await supabase.from('channel_integrations').insert(demoChannelMessages);

  const forecastDates = [];
  for (let i = 1; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    forecastDates.push({
      forecast_date: date.toISOString().split('T')[0],
      predicted_volume: Math.floor(20 + Math.random() * 30),
      confidence_level: 0.75 + Math.random() * 0.15,
      factors: {
        base_volume: 25,
        day_of_week: date.toLocaleDateString('en-US', { weekday: 'long' }),
        trend_adjustment: '0.05',
        seasonality: '0.15'
      }
    });
  }

  await supabase.from('ticket_volume_forecast').insert(forecastDates);

  console.log('Demo data seeding complete!');
  return { users, customers, tickets };
}
