'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WinterCollectionSizes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  WinterCollectionSizes.init({
    name_ar: DataTypes.STRING,
    name_en: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'winter_collection_sizes',
  });
  return WinterCollectionSizes;
};