'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class size extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  size.init({
    name_ar: DataTypes.STRING,
    name_en: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'size',
  });
  return size;
};