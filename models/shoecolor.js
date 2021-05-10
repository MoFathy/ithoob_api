'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class shoeColor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  shoeColor.init({
    name_ar: DataTypes.STRING,
    name_en: DataTypes.STRING,
    image: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'shoeColor',
  });
  return shoeColor;
};