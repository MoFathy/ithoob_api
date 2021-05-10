
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var Cart = sequelize.define('Cart', {
    
  },{
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  });

  Cart.associate = (models) =>{
    Cart.belongsTo(models.User,
      {
        as: 'User',
        foreignKey: 'user_id',       
      }
    )
    // Cart.belongsToMany(models.Product, {
    //   through: models.CartProductRelationship,
    //   foreignKey: 'cart_id',
    //   as: 'Products',
    //   constraints: false,
    //   unique: false   
    // })
    Cart.hasMany(models.CartProductRelationship, {
      // through: models.CartProductRelationship,
      foreignKey: 'cart_id',
      as: 'CartProductRelationships',
      constraints: false,
      unique: false
    })
    Cart.belongsTo(models.PartnerCode, {
      foreignKey: 'partner_code_id',
      as: 'Code',
      constraints: false     

    })
    

  
  }

  return Cart;
}