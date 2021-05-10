module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var PromotionCategories = sequelize.define(
    "Promotion_category",
    {
      discount: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      link: {
        type: DataTypes.STRING,
        allowNull: false
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

  PromotionCategories.associate = models => {
    PromotionCategories.belongsTo(models.Promotion, {
      as: "Promotion",
      foreignKey: "promotion_id"
      // constraints: false
    });
    PromotionCategories.belongsTo(models.Category, {
      as: "Category",
      foreignKey: "category_id" 
    })
  };

  return PromotionCategories;
};
