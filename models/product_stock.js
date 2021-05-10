module.exports =  (sequelize, DataTypes) => {
  var ProductStock = sequelize.define('product_stock', {
    value: {
      type: DataTypes.INTEGER,
    }
  }, {
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  })
  ProductStock.associate = (models) => {
    ProductStock.belongsTo(models.Product, {
      as: "Product",
      foreignKey: "product_id"
    })
  }
  return ProductStock
}