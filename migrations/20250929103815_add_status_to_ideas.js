/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('ideas', function(table) {
    table.enum('status', ['draft', 'reviewed', 'approved', 'implemented', 'rejected']).defaultTo('draft');
    table.index(['status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('ideas', function(table) {
    table.dropColumn('status');
  });
};
