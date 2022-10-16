'use strict';

module.exports = {
  up: async function(queryInterface, Sequelize) {
    queryInterface.addColumn(
      'orders',
      'coupon_discount_type',
      {
        type: Sequelize.DataTypes.ENUM(
          "percent",
          "money",
        ),
        allowNull: true,
        after: 'user_discount'
      }
    );
    queryInterface.addColumn(
      'orders',
      'quantity_discount',
      {
        type: Sequelize.DataTypes.FLOAT,
        defaultValue: 0,
        after: 'coupon_discount_type'
      }
    );

  },

  down: async function(queryInterface, Sequelize) {
    queryInterface.removeColumn(
      'orders',
      'coupon_discount_type'
    );
    queryInterface.removeColumn(
      'orders',
      'quantity_discount'
    );
  }
};
