
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var OrderProductRelationship = sequelize.define('order_product_relationship', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    cost: {
      type: DataTypes.INTEGER
    },
    order_id: {
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

  OrderProductRelationship.associate = (models) =>{
    OrderProductRelationship.belongsToMany(models.CategoryRelationship,
      {
        through: { model: models.OrderCustomizeRelationship,  unique: false },
        as: 'CategoryRelations',
        foreignKey: 'order_prod_id',       
      }
    )
    OrderProductRelationship.hasMany(models.OrderProductMeta,
      {
        as: 'Metas',
        foreignKey: 'order_prod_id',       
      }
    )
    OrderProductRelationship.belongsTo(models.MeasurementProfile,
      {
        as: 'Profile',
        foreignKey: 'profile_id',     
        constraints: false      
          
      }
    )
    OrderProductRelationship.belongsTo(models.Order,
      {
        as: 'Order',
        foreignKey: 'order_id',       
        constraints: false,
        unique: false    

      }
    )
    OrderProductRelationship.belongsTo(models.Product,
      {
        // through: models.OrderProductProfile, 
        as: 'Product',
        foreignKey: 'product_id', 
        constraints: false,
        unique: false    

      }
    )
  }
  

  return OrderProductRelationship;
}