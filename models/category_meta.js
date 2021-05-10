
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var CategoryMeta = sequelize.define('category_meta', {
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    value_type: {
      type: DataTypes.ENUM,
      values: ['text', 'file', 'options'],
      defaultValue: "text"
    }

  }, {
      //foreign keys are underscored
      underscored: true,
      timestamps: false,
      // supports languages like arabic to be stored in db
      charset: 'utf8',
      collate: 'utf8_unicode_ci',
    });

  // add associations between user model and group model
  CategoryMeta.associate = (models) => {
    CategoryMeta.belongsToMany(models.Category,
      {
        through: models.CategoryMetaRelationship,
        foreignKey: 'category_meta_id',
        as: 'Categories'
      }
    )
    CategoryMeta.hasMany(models.CategoryMetaOption,
      {
        foreignKey: 'category_meta_id',
      }
    )
    CategoryMeta.hasMany(models.CategoryMetaRelationship,
      {
        foreignKey: 'category_meta_id',
      }
    )
  }

  return CategoryMeta;
}