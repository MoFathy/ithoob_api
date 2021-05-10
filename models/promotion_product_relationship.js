module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var PromotionProductRelationship = sequelize.define(
    "promotion_product_relationship",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      discount_value: {
        type: DataTypes.INTEGER
      }
    },
    
    {
      //foreign keys are underscored
      underscored: true,
      timestamps: false,
      // supports languages like arabic to be stored in db
      charset: "utf8",
      collate: "utf8_unicode_ci"
    }
  );

  PromotionProductRelationship.associate = models => {
    PromotionProductRelationship.hasMany(models.Content, {
      foreignKey: 'promo_id',
      as: 'Banners'
    })
    PromotionProductRelationship.belongsTo(models.Promotion,  {
      foreignKey: "promotion_id",
      as: "Promotion"
    })
    PromotionProductRelationship.belongsTo(models.Product, {
      foreignKey: "product_id",
      as: "Product"
    })    
  };
  return PromotionProductRelationship;
};
