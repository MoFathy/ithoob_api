module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var Promotion = sequelize.define(
    "Promotion",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      name_en: {
        type: DataTypes.STRING,
      },
      type: {
        type: DataTypes.ENUM,
        values: ["season", "permanent", "plus", "two_for_one", "general", "latest"],
        defaultValue: "general"
      },
      start_date: {
        type: DataTypes.DATE
      },
      end_date: {
        type: DataTypes.DATE
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

  Promotion.associate = models => {
    //old association
    // Promotion.belongsToMany(models.Product, {
    //   as: "Products",
    //   through: models.PromotionProductRelationship,
    //   foreignKey: "promotion_id"
    //   // constraints: false
    // });
    Promotion.hasMany(models.PromotionProductRelationship, {
      as: "PromotionProductRelations",
      // through: models.PromotionProductRelationship,
      foreignKey: "promotion_id"
      // constraints: false
    });

    // Promotion.hasMany(models.Category, {
    //   as: "Categories",
    //   foreignKey: "promo_id"
    //   // constraints: false
    // });
    Promotion.hasMany(models.PromotionCategory, {
      as: "Permanents",
      foreignKey: "promotion_id"
    })
  };

  return Promotion;
};
