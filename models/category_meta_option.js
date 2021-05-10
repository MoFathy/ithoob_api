
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var CategoryMetaOption = sequelize.define('category_meta_option', {
    option: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
      //foreign keys are underscored
      underscored: true,
      timestamps: false,
      // supports languages like arabic to be stored in db
      charset: 'utf8',
      collate: 'utf8_unicode_ci',
    });

  return CategoryMetaOption;
}