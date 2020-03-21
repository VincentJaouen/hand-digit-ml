
exports.up = function(knex) {
  return knex.schema
    .createTable('digits', function (table) {
      table.increments('id');
      table.integer('digit').notNullable();
      table.jsonb('image').notNullable();
      table.boolean('confirmed').notNullable().defaultTo(false);
    })
};

exports.down = function(knex) {
  return knex.schema.dropTable('digits');
};
