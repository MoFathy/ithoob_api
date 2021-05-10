'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class quantity extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  quantity.init({
    product_id: DataTypes.INTEGER,
    size_id: DataTypes.INTEGER,
    color_id: DataTypes.INTEGER,
    fabric_id: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'quantity',
  });

  quantity.associate = (models) =>{
    quantity.belongsTo(models.Size,
      {
        as: 'size',
        foreignKey: 'size_id',       
      }
    )
    quantity.belongsTo(models.Fabric,
      {
        as: 'fabric',
        foreignKey: 'fabric_id',    
      }
    )
    quantity.belongsTo(models.ShoeColor,
      {
        as: 'shoeColor',
        foreignKey: 'color_id',       
      }
    )
    quantity.belongsTo(models.CategoryRelationship,
      {
        as: 'color',
        foreignKey: 'color_id',       
      }
    )
  }
  return quantity;
};