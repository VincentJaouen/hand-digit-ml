
exports.up = function(knex) {
  knex.schema.table('digits', function (table) {
    table.timestamps(false, true);
  });

  return knex.schema
    .createTable('neuralNetwork', function (table) {
      table.increments('id');
      table.integer('layer').notNullable();
      table.jsonb('theta').notNullable();
      table.boolean('active').notNullable().defaultTo(false);
      table.timestamps(false, true);
    });
};

exports.down = function(knex) {
  knex.schema.table('digits', function (table) {
    table.dropTimestamps();
  });

  return knex.schema.dropTable('neuralNetwork');
};
