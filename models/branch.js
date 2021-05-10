module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var Branch = sequelize.define('Branch', {
    name: {
      type: DataTypes.STRING,
    },
    name_en: {
      type: DataTypes.STRING
    },
    address: {
     type: DataTypes.STRING
    },
    address_en: {
      type: DataTypes.STRING
     },
    hours: {
      type: DataTypes.STRING
    },
    hours_en: {
      type: DataTypes.STRING
    },
    number: {
      type: DataTypes.STRING,
      unique: true
    }
  },{
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  });


  return Branch;
}