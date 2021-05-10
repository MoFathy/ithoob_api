module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var ProductCategoryRelationshipImage = sequelize.define(
    "product_category_relationship_image",
    {
      image: {
        type: DataTypes.STRING
      },
      large_image: {
        type: DataTypes.STRING
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

  ProductCategoryRelationshipImage.associate = models => {
    ProductCategoryRelationshipImage.belongsTo(models.ProductCategoryRelationship, {
      as: "ProductCatRelation",
      foreignKey: "product_cat_rel_id"
      // constraints: false
    });
  };
  return ProductCategoryRelationshipImage;
};
