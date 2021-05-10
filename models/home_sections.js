'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class homeSections extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  homeSections.init({
    section_name: DataTypes.STRING,
    section_order: DataTypes.INTEGER,
    isVisiable: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'home_sections',
  });
  return homeSections;
};