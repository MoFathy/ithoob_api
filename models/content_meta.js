
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var ContentMeta = sequelize.define('content_meta', {
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    key: {
      type: DataTypes.STRING,
    },
    value: {
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

 

  return ContentMeta;
}