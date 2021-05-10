
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var Question = sequelize.define('question', {
    question: {
      type: DataTypes.STRING,
      allowNull: false
    },
    question_en: {
      type: DataTypes.STRING,
      allowNull: false
    },
    answer: {
      type: DataTypes.STRING(1000),
    },
    answer_en: {
      type: DataTypes.STRING(1000)
    }

  },{
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  });

 

  return Question;
}