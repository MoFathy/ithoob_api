'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    queryInterface.addColumn(
      'tailor_requests',
      'pieces_number',
      {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        after: 'to'
      }
    )
    queryInterface.addColumn(
      'tailor_requests',
      'status',
      {
        type: Sequelize.DataTypes.ENUM(
          "new",
          "in_progress",
          "production",
          "delivered",
          "cancelled"
        ),
        defaultValue: "new",
        after: 'pieces_number'
      }
    )
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     queryInterface.removeColumn('tailor_requests', 'pieces_number');
     queryInterface.removeColumn('tailor_requests', 'status');

  }
};
