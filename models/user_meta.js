
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var UserMeta = sequelize.define('user_meta', {
    type: {
      type: DataTypes.STRING,
      allowNull: false
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

  // add associations between user model and group model
  UserMeta.associate = (models) =>{
    UserMeta.belongsTo(models.User,
      {
        foreignKey: 'user_id',
        as: 'User'
      }
    )
  }

  return UserMeta;
}