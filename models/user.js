
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var User = sequelize.define('User', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      validate: {
        len: {
          args: [3,100],
          msg: "Password should be within the limits"
        }
      }
    },
    mobile: {
      type: DataTypes.STRING,
      unique: true
    },
    address: {
      type: DataTypes.STRING
    },
    discount: {
      type: DataTypes.FLOAT
    },
    social_id: {
      type: DataTypes.STRING
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  } ,{
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  });
  User.addHook('afterCreate','afterCreatingUser', (user, options) => {
    //console.log('creating cart...');
     

   
  //   sequelize.query('INSERT INTO `carts`( `user_id`) VALUES (:user_id) ',
  // { replacements: { user_id: user.id }, type: sequelize.QueryTypes.INSERT }
    // )
    sequelize.models.Cart.create({user_id: user.id}).then((cart) => {
      sequelize.models.Cart.findAll({where: {user_id: user.id} }).then(carts => {
        if(carts.length > 1) {
          //console.log('cart duplicate, destroying the excess')
          cart.destroy()
        }
      })
    })
    // sequelize.models.Cart.destroy({where: {user_id: user.id}})    
    // User.removeHook('afterCreatingUser')
  });
  User.associate = (models) =>{
    User.hasMany(models.UserMeta,
      {
        as: 'Metas',
        foreignKey: 'user_id',
        // constraints: false

      }
    )
    User.hasMany(models.MeasurementProfile,
      {
        as: 'Measurements',
        foreignKey: 'user_id',
        constraints: false

      }
    )

    User.belongsTo(models.Place,
      {
        as: 'Place',
        foreignKey: 'area_id',
        constraints: false

      }
    )

    // User.belongsTo(models.Partner,
    //   {
    //     as: 'Partner',
    //     foreignKey: 'partner_id',
    //     // constraints: false

    //   }
    // )
    User.hasOne(models.Cart, {
      as: 'Cart',
      foreignKey: 'user_id'
    })
    User.hasMany(models.Order, {
      as: 'Orders',
      foreignKey: 'user_id'
    })
    // OrderCategory.belongsToMany(models.User,
    //   {
    //     through: 'user_order_category',
    //     as: 'Categories',
    //     foreignKey: 'order_cat_id',       
    //   }
    // )

  }

  return User;
}
