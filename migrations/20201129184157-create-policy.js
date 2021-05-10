'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('policies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      privacy_policy: {
        type: Sequelize.TEXT
      },
      privacy_policy_en: {
        type: Sequelize.TEXT
      },
      pull_back_policy: {
        type: Sequelize.TEXT
      },
      pull_back_policy_en: {
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('policies');
  }
};