
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var Content = sequelize.define('content', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    title_en: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.STRING,
    },
    content_en: {
      type: DataTypes.STRING,
    },
    image: {
      type: DataTypes.STRING
    },
    type: {
      type: DataTypes.ENUM,
      values: ["why","about","section","steps","banner","mobile_top_banner","mobile_home_banner"]
    },
    btn_text: {
      type: DataTypes.STRING
    },
    btn_text_en: {
      type: DataTypes.STRING
    },
    btn_url: {
      type: DataTypes.STRING
    }
  },{
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  });

  Content.associate = (models) =>{
    Content.hasMany(models.Content,
      {
        foreignKey: 'section_id',
        as: 'Steps'
      }
    )
    Content.belongsTo(models.Content,
      {
        foreignKey: 'section_id',
        as: 'Section'
      }
    )
    Content.hasOne(models.ContentLink, {
      foreignKey: 'content_id',
      as: 'Link'
    })
    Content.belongsTo(models.PromotionProductRelationship, {
      foreignKey: 'promo_id',
      as: 'Promotion'
    })
    // Content.belongsTo(models.PromotionCategoryRelationship, {
    //   foreignKey: 'cat_promo_id',
    //   as: 'CategoryPromotion'
    // })
  } 

  return Content;
}