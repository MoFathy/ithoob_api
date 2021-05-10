
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var ContentLink = sequelize.define('content_link', {
    
    title: {
      type: DataTypes.STRING,
    },
    title_en: {
      type: DataTypes.STRING
    },
    path: {
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

  ContentLink.associate = models => {
    ContentLink.belongsTo(models.Content, {
      foreignKey: 'content_id',
      as: 'Content'
    })
  }

  return ContentLink;
}