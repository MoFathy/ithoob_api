'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tailor_request extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  tailor_request.init({
    user_id: DataTypes.INTEGER,
    region: DataTypes.STRING,
    naighborhood: DataTypes.STRING,
    street: DataTypes.STRING,
    details: DataTypes.TEXT,
    milestone: DataTypes.STRING,
    from: DataTypes.TIME,
    to: DataTypes.TIME,
    pieces_number: DataTypes.INTEGER,
    status : DataTypes.ENUM(
      "new",
      "in_progress",
      "production",
      "delivered",
      "cancelled"
    )
  }, {
    sequelize,
    modelName: 'tailor_request',
  });

  tailor_request.associate = models => {
    tailor_request.belongsTo(models.User, {
      as: "User",
      foreignKey: "user_id"
    });
  }
  return tailor_request;
};