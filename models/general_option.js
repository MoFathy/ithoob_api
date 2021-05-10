
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var GeneralOption = sequelize.define('general_option', {
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    value: {
      type: DataTypes.STRING,
    }
  },{
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  });
  return GeneralOption;
}
