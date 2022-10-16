
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var MeasurementGuide = sequelize.define('measurement_guide', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    measurement_opt: {
      type: DataTypes.ENUM,
      values: [
        "value_1",
        "value_2",
        "value_3",
        "value_4",
        "value_5",
        "value_6",
        "value_7",
        "value_8",
        "value_9",
        "value_10",
        "value_11",
        "value_12",
      ],
      defaultValue: "value_1",
    },
    name_en: {
      type: DataTypes.STRING,
      allowNull: false
    },
    min: {
      type: DataTypes.FLOAT
    },
    max: {
      type: DataTypes.FLOAT
    },
    help: {
      type: DataTypes.TEXT,
    },
    help_en: {
      type: DataTypes.TEXT,
    },
    image_title: {
      type: DataTypes.STRING
    },
    image_title_en: {
      type: DataTypes.STRING
  },
  image: {
	type: DataTypes.STRING
  },
  video: {
    type: DataTypes.STRING
    },
  },{
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  });

  // MeasurementProfile.associate = (models) =>{
  //   MeasurementProfile.belongsTo(models.User,
  //     {
  //       as: 'User',
  //       foreignKey: 'user_id',
  //       // constraints: false

  //     }
  //   )
  // }

  return MeasurementGuide;
}
