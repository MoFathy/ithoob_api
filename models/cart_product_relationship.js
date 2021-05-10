
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var CartProductRelationship = sequelize.define('cart_product_relationship', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      primaryKey: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    cart_id: {
      type: DataTypes.INTEGER,
      // unique: false
    },
    product_id: {
      type: DataTypes.INTEGER,
      // unique: false
    }
  },{
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  });

  CartProductRelationship.associate = (models) =>{
    CartProductRelationship.belongsToMany(models.CategoryRelationship,
      {
        through: {model: models.CartCustomizeRelationship, unique: false },
        as: 'CategoryRelations',
        foreignKey: 'cart_prod_id',       
        unique: false,
        constraints: false      
      }
    )
    CartProductRelationship.hasMany(models.CartProductMeta,
      {
        as: 'Metas',
        foreignKey: 'cart_prod_id',       
      }
    )
    CartProductRelationship.belongsTo(models.MeasurementProfile,
      {
        // through: models.CartProductProfile, 
        as: 'Profile',
        foreignKey: 'profile_id',     
        constraints: false      
          
      }
    )
    CartProductRelationship.belongsTo(models.Cart,
      {
        // through: models.CartProductProfile, 
        as: 'Cart',
        foreignKey: 'cart_id',       
        constraints: false,
        unique: false    

      }
    )
    CartProductRelationship.belongsTo(models.Product,
      {
        // through: models.CartProductProfile, 
        as: 'Product',
        foreignKey: 'product_id', 
        constraints: false,
        unique: false    

      }
    )
  }
  

  return CartProductRelationship;
}