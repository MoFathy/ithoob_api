'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductStockVariation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  ProductStockVariation.init({
    size: DataTypes.STRING,
    color: DataTypes.STRING,
    sku: DataTypes.STRING,
    quantity: DataTypes.INTEGER,
    product_id: DataTypes.INTEGER,
    createdAt: {
        field: 'created_at',
        type: DataTypes.DATE,
    },
    updatedAt: {
        field: 'updated_at',
        type: DataTypes.DATE,
    },
  }, {
    sequelize,
    modelName: 'product_stock_variations',
    underscored: true,
  });
  return ProductStockVariation;
};