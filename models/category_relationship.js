module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var CategoryRelationship = sequelize.define(
    "category_relationship",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: DataTypes.ENUM,
        values: [
          "fabric",
          "yaka",
          "zarzour",
          "akmam",
          "others",
          "betana",
          "accessory",
          "general"
        ]
      }
    },
    {
      //foreign keys are underscored
      underscored: true,
      timestamps: false
      // supports languages like arabic to be stored in db
      // charset: 'utf8',
      // collate: 'utf8_unicode_ci',
    }
  );
  CategoryRelationship.associate = models => {
    CategoryRelationship.belongsTo(models.Category, {
      as: "Children",
      // through: models.CategoryRelationship,
      foreignKey: "child_id"
      // constraints: false
    });
    CategoryRelationship.belongsTo(models.Category, {
      as: "Parents",
      // through: models.CategoryRelationship,
      foreignKey: "parent_id"
      // constraints: false,
    });
    CategoryRelationship.belongsToMany(models.Product, {
      as: "Products",
      through: models.ProductCategoryRelationship,
      foreignKey: "category_rel_id"
      // constraints: false
    });
    CategoryRelationship.hasMany(models.ProductCategoryRelationship,
      {
        as: 'ProductCategoryRelations',
        foreignKey: 'category_rel_id',
        // constraints: false      
        
      }
    )
    CategoryRelationship.belongsToMany(models.CartProductRelationship,
      {
        through: {model: models.CartCustomizeRelationship, unique: false },
        as: 'CartProductRelationships',
        foreignKey: 'category_rel_id',
        
        constraints: false      

      }
    )
    CategoryRelationship.belongsToMany(models.OrderProductRelationship,
      {
        through: {model: models.OrderCustomizeRelationship, unique: false },
        as: 'OrderProductRelationships',
        foreignKey: 'cat_rel_id',       
      }
    )
  };
  return CategoryRelationship;
};
