module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var Category = sequelize.define(
    "Category",
    {
      // name can't be null and length is between 3 and 50 characters
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      name_en: {
        type: DataTypes.STRING,
        allowNull: false,
        // unique: true
      },

      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      title_en: {
        type: DataTypes.STRING,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM,
        values: [
          "fabric",
          "yaka",
          "zarzour",
          "akmam",
          "others",
          "color",
          "betana",
          "accessory",
          "child",
          "general",
          "category"
        ],
        defaultValue: "child",
      },
      available:{
        type: DataTypes.BOOLEAN,
        defaultValue: true
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

  // add associations between category model and group model
  Category.associate = models => {
    Category.belongsToMany(models.Category, {
      as: "Parents",
      through: models.CategoryRelationship,
      foreignKey: "child_id"
      // constraints: false
    });
    Category.belongsToMany(models.Category, {
      as: "Children",
      through: models.CategoryRelationship,
      foreignKey: "parent_id"
      // constraints: false,
    });
    Category.belongsToMany(models.CategoryMeta, {
      as: "Metas",
      through: models.CategoryMetaRelationship,
      foreignKey: "category_id"
      // constraints: false
    });
    Category.hasMany(models.Product, {
      as: "Products",
      foreignKey: "category_id"
    });
    Category.hasOne(models.PromotionCategory, {
      as: "Promotion",
      foreignKey: "category_id"
      // constraints: false
    });
    // Category.hasOne(models.FabricStock, {
    //   as: "Stock",
    //   foreignKey: "category_id"
    // })
  };

  return Category;
};
