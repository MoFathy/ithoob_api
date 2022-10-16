'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn(
      'general_coupons',
      'discount_type',
      {
        type: Sequelize.DataTypes.ENUM(
          "percent",
          "money",
        ),
        defaultValue: "percent",
        after: 'code'
      }
    );

  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn(
      'general_coupons',
      'discount_type'
    );
  }
};
