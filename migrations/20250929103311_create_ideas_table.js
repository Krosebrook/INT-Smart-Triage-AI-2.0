/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('ideas', function(table) {
    table.bigIncrements('id').primary();
    table.string('title', 200).notNullable();
    table.text('description').notNullable();
    table.timestamps(true, true); // adds created_at and updated_at with defaults
    
    // Add indexes for performance
    table.index(['created_at']);
    table.index(['title']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('ideas');
};
