'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tailor_requests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER
      },
      region: {
        type: Sequelize.STRING
      },
      naighborhood: {
        type: Sequelize.STRING
      },
      street: {
        type: Sequelize.STRING
      },
      details: {
        type: Sequelize.TEXT
      },
      milestone: {
        type: Sequelize.STRING
      },
      from: {
        type: Sequelize.TIME
      },
      to: {
        type: Sequelize.TIME
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
    await queryInterface.dropTable('tailor_requests');
  }
};