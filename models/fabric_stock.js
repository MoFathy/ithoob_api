module.exports = (sequelize, DataTypes) => {
  var FabricStock = sequelize.define("fabric_stock", {
    code: {
      type: DataTypes.STRING
    },
    type: {
      type: DataTypes.ENUM,
      values: ["normal", "double"],
      defaultValue: "normal"
    },
    amount: {
      type: DataTypes.INTEGER
    }
  }, {
    underscored: true,
    timestamps: false
  })

  FabricStock.associate = (models) => {
    FabricStock.belongsTo(models.Category, {
      as: "Category",
      foreignKey: "category_id"
    })
    FabricStock.hasMany(models.Product, {
      as: "Product",
      foreignKey: "fabric_id"
    })   
  }
  return FabricStock
}