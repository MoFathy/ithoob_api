'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class policy extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  policy.init({
    privacy_policy: DataTypes.TEXT,
    privacy_policy_en: DataTypes.TEXT,
    pull_back_policy: DataTypes.TEXT,
    pull_back_policy_en: DataTypes.TEXT,
    terms: DataTypes.TEXT,
    terms_en: DataTypes.TEXT,
    delivery: DataTypes.TEXT,
    delivery_en: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'policy',
  });
  return policy;
};