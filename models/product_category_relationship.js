module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var ProductCategoryRelationship = sequelize.define(
    "product_category_relationship",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
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

  ProductCategoryRelationship.associate = models => {
    ProductCategoryRelationship.hasOne(
      models.ProductCategoryRelationshipImage,
      {
        as: "Image",
        foreignKey: "product_cat_rel_id"
        // constraints: false
      }
    );
  };
  return ProductCategoryRelationship;
};
