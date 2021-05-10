
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var CartProductMeta = sequelize.define('cart_product_meta', {
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

  CartProductMeta.associate = (models) =>{
    CartProductMeta.belongsTo(models.CartProductRelationship,
      {
        as: 'CartProduct',
        foreignKey: 'cart_prod_id',       
      }
    )
    CartProductMeta.hasMany(models.CartMetaImage, {
      as: 'Images',
      foreignKey: 'cart_meta_id'
    })
  
  }

  return CartProductMeta;
}