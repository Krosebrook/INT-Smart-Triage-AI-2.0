/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('reports', function(table) {
    table.bigIncrements('id').primary();
    table.string('report_id', 50).notNullable().unique();
    
    // Ticket Information
    table.string('customer_name', 100).notNullable();
    table.string('ticket_subject', 200).notNullable();
    table.text('issue_description').notNullable();
    table.enum('customer_tone', ['calm', 'frustrated', 'angry', 'confused', 'urgent']).notNullable();
    
    // Triage Results
    table.enum('priority', ['low', 'medium', 'high']).notNullable();
    table.decimal('confidence_score', 5, 2).checkBetween([0, 100]);
    table.text('response_approach');
    table.jsonb('talking_points');
    table.jsonb('knowledge_base_articles');
    
    // Audit and Security Fields
    table.string('csr_agent', 50).notNullable();
    table.specificType('ip_address', 'INET');
    table.text('user_agent');
    table.string('session_id', 100);
    
    // Timestamps
    table.timestamptz('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamptz('processed_at').notNullable();
    table.timestamptz('updated_at').defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index(['report_id']);
    table.index(['created_at']);
    table.index(['priority']);
    table.index(['csr_agent']);
  })
  .then(() => {
    // Enable Row Level Security (RLS)
    return knex.raw('ALTER TABLE reports ENABLE ROW LEVEL SECURITY');
  })
  .then(() => {
    // Create security policies
    return knex.raw(`
      CREATE POLICY "Deny all public access" ON reports
          FOR ALL 
          TO public
          USING (false)
          WITH CHECK (false)
    `);
  })
  .then(() => {
    return knex.raw(`
      CREATE POLICY "Allow service role access" ON reports
          FOR ALL 
          TO service_role
          USING (true)
          WITH CHECK (true)
    `);
  })
  .then(() => {
    // Create updated_at trigger function
    return knex.raw(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
  })
  .then(() => {
    // Create trigger for updated_at
    return knex.raw(`
      CREATE TRIGGER update_reports_updated_at 
          BEFORE UPDATE ON reports
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column()
    `);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.raw('DROP TRIGGER IF EXISTS update_reports_updated_at ON reports')
    .then(() => knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column()'))
    .then(() => knex.schema.dropTableIfExists('reports'));
};
