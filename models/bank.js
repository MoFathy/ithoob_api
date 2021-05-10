module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var Bank = sequelize.define('Bank', {
    name: {
      type: DataTypes.STRING,
    },
    name_en: {
     type: DataTypes.STRING
    },
    number: {
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


  return Bank;
}