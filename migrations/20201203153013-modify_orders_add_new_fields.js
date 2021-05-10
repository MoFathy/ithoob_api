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
      'orders',
      'coupon_discount',
      {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        after: 'user_discount'
      },
    );
    queryInterface.addColumn(
      'orders',
      'coupon_code',
      {
        type: Sequelize.STRING,
        allowNull: true,
        after: 'coupon_discount'
      },
    )
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    queryInterface.removeColumn('orders', 'coupon_discount');
    queryInterface.removeColumn('orders', 'coupon_code');
  }
};
