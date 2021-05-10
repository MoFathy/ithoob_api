
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var CategoryMetaRelationship = sequelize.define('category_meta_relationship', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      primaryKey: true
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false
    }

  },{
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    // charset: 'utf8',
    // collate: 'utf8_unicode_ci',
  });

  CategoryMetaRelationship.associate = models => {
    CategoryMetaRelationship.belongsTo(models.Category, {
      as: "Category",
      foreignKey: "category_id"
      // constraints: false
    });
    CategoryMetaRelationship.belongsTo(models.CategoryMeta, {
      as: "Meta",
      foreignKey: "category_meta_id"
      // constraints: false
    });
   
  };
  return CategoryMetaRelationship;
}