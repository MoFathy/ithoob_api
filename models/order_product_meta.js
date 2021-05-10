
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var OrderProductMeta = sequelize.define('order_product_meta', {
    property: {
      type: DataTypes.STRING
    },
    value: {
      type: DataTypes.STRING
    },
    quantity_id: {
      type: DataTypes.INTEGER
    }
  },{
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  });

  OrderProductMeta.associate = (models) =>{
    OrderProductMeta.belongsTo(models.OrderProductRelationship,
      {
        as: 'OrderProduct',
        foreignKey: 'order_prod_id',       
      }
    )
    OrderProductMeta.belongsTo(models.Quantity,
      {
        as: 'quantities',
        foreignKey: 'quantity_id',       
      }
    )
  
  }

  return OrderProductMeta;
}