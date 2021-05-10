// // const moment = require("moment");

module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var GeneralEnum = sequelize.define('general_enum', {
    value: {
      type: DataTypes.STRING
    },
    name_en: {
      type: DataTypes.STRING
    },
    name: {
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

  // Enum.associate = (models) =>{
  

  
  // }

  return GeneralEnum;
}