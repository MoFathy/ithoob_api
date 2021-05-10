
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var CartMetaImage = sequelize.define('cart_meta_image', {
    src: {
      type: DataTypes.STRING
    }
  },{
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  });

  CartMetaImage.associate = (models) =>{
    CartMetaImage.belongsTo(models.CartProductMeta,
      {
        as: 'CartProduct',
        foreignKey: 'cart_meta_id'       
      }
    )
  
  }

  return CartMetaImage;
}