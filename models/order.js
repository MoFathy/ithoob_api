const moment = require("moment");

module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var Order = sequelize.define(
    "Order",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      status: {
        type: DataTypes.ENUM,
        values: [
          "new",
          "pending_payment",
          "production",
          "charged",
          "delivered",
          "pickable",
          "cancelled",
        ],
        defaultValue: "new"
      },
      // expected: {
      //   type: DataTypes.INTEGER,
      //   defaultValue: 3
      // },
      partner_discount: {
        type: DataTypes.FLOAT,
        defaultValue: 0
      },
      user_discount: {
        type: DataTypes.FLOAT,
        defaultValue: 0
      },
      coupon_discount: {
        type: DataTypes.FLOAT,
        defaultValue: 0
      },
      coupon_code: {
        type: DataTypes.STRING,
      },
      payment_id: {
        type: DataTypes.STRING,
      }, 
      size_man: {
        type: DataTypes.FLOAT,
        defaultValue: 0
      },
      delivery_cost: {
        type: DataTypes.FLOAT,
        defaultValue: 0
      },
      total: {
        type: DataTypes.FLOAT
      },
      expected_total: {
        type: DataTypes.FLOAT
      },
      tax: {
        type: DataTypes.FLOAT,
        defaultValue: 0
      },
      ordering_date: {
        type: DataTypes.DATE
      },
      delivery_date: {
        type: DataTypes.DATE
      },
      pickable_date: {
        type: DataTypes.DATE
      },
      production_date: {
        type: DataTypes.DATE
      },
      cancellation_date: {
        type: DataTypes.DATE
      },
      payment_method: {
        type: DataTypes.STRING
      },
      delivery_address_id: {
        type: DataTypes.INTEGER
      },
      delivery_type: {
        type: DataTypes.ENUM,
        values: ["home", "branch"],
        defaultValue: "home"
      },
      address: {
        type: DataTypes.STRING
      }
    },
    {
      hooks: {
        afterCreate: function (order, options) {
          order.update({
            ordering_date: moment(),
            // delivery_date: moment().add(3, "days")
          });
        }
      }
    },
    {
      //foreign keys are underscored
      underscored: true,
      timestamps: false,
      // supports languages like arabic to be stored in db
      charset: "utf8",
      collate: "utf8_unicode_ci"
    }
  );

  Order.associate = models => {
    Order.belongsTo(models.User, {
      as: "User",
      foreignKey: "user_id"
    });
    Order.hasMany(models.OrderProductRelationship, {
      // through: models.OrderProductRelationship,
      foreignKey: "order_id",
      as: "OrderProductRelationships",
      constraints: false
      // unique: false
    });
    Order.belongsTo(models.PartnerCode, {
      foreignKey: "partner_code_id",
      as: "Code",
      constraints: false
    });
    Order.belongsTo(models.DeliveryAddress, {
      foreignKey: "delivery_address_id",
      as: "delivery_address",
      constraints: false
    });
  };

  return Order;
};
