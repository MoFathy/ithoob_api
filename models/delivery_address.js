'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class delivery_address extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  delivery_address.init({
    user_id: DataTypes.INTEGER,
    region: DataTypes.STRING,
    naighborhood: DataTypes.STRING,
    street: DataTypes.STRING,
    details: DataTypes.TEXT,
    milestone: DataTypes.STRING,
    from: DataTypes.DATE,
    to: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'delivery_address',
  });
  return delivery_address;
};