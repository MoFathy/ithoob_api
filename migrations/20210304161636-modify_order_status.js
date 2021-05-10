'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
      await queryInterface.changeColumn('orders', 'status', {
        type: Sequelize.DataTypes.ENUM(
          "new",
          "pending_payment",
          "production",
          "charged",
          "delivered",
          "pickable",
          "cancelled"
        ),
        defaultValue: "new"
      });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
