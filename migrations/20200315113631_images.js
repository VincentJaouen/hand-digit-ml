
exports.up = function(knex) {
  return knex.schema
    .createTable('digits', function (table) {
      table.increments('id');
      table.integer('digit').notNullable();
      table.jsonb('image').notNullable();
    })
};

exports.down = function(knex) {
  return knex.schema.dropTable('digits');
};
