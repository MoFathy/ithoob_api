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
      'policies',
      'terms',
      {
        type: Sequelize.TEXT,
        defaultValue: 'الشروط والأحكام',
        after: 'id'
      },
    );
    queryInterface.addColumn(
      'policies',
      'terms_en',
      {
        type: Sequelize.TEXT,
        defaultValue: 'Terms And Conditions',
        after: 'terms'
      },
    );
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
