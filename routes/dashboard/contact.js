const express = require("express");
const router = express.Router();
const passport = require("passport");
const {GeneralOption, Branch, Bank} = require("../../models");
const ResponseSender = require("./ResponseSender");
/// branches crud
router.get(
  "/branches",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    Branch.findAll()
      .then(branches => {
        res.status(200).json({
          status: true,
          branches
        });
      })
      .catch(err => {
        //console.log(err);
        res.status(200).json({
          status: false,
          message: "couldn't find list of branches"
        });
      });
  }
);

router.post(
  "/add-branch",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    const {
      name,
      name_en,
      address,
      address_en,
      hours,
      hours_en,
      number
    } = req.body;
    if (
      !name ||
      !name_en ||
      !address ||
      !address_en ||
      !hours ||
      !hours_en ||
      !number
    ) {
      return res.status(200).json({
        status: false,
        message: "please complete parameters to add new branch"
      });
    }
    Branch.create({
      name,
      name_en,
      address,
      address_en,
      hours,
      hours_en,
      number
    })
      .then(branch => {
        res.status(200).json({
          status: true,
          id: branch.id
        });
      })
      .catch(err => {
        //console.log(err);
        res.status(200).json({
          status: false,
          message: "error in adding new branch"
        });
      });
  }
);

router.delete(
  "/delete-branch",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    const {branchId} = req.body;
    if (!branchId) {
      return res.status(200).json({
        status: false,
        message: "please add branchId to delete branch"
      });
    }
    Branch.destroy({
      where: {
        id: branchId
      }
    })
      .then(() => {
        res.status(200).json({
          status: true
        });
      })
      .catch(err => {
        //console.log(err);
        res.status(200).json({
          status: false,
          message: "error in deleting branch"
        });
      });
  }
);

router.put(
  "/update-branch",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    const {
      name,
      name_en,
      address,
      address_en,
      hours,
      hours_en,
      number,
      branchId
    } = req.body;
    if (!branchId) {
      return res.status(200).json({
        status: false,
        message: "please add branchId to update branch"
      });
    }

    Branch.findOne({
      where: {
        id: branchId
      }
    })
      .then(branch => {
        if (!branch) {
          return res.status(200).json({
            status: false,
            message: "no branch with this branchId"
          });
        }
        return branch.update({
          name,
          name_en,
          address,
          address_en,
          hours,
          hours_en,
          number
        });
      })
      .then(() => {
        res.status(200).json({
          status: true,
          message: "updated successfully"
        });
      })
      .catch(err => {
        //console.log(err);
        res.status(200).json({
          status: false,
          message: "error in updating branch"
        });
      });
  }
);

//// banks crud

router.get(
  "/banks",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    Bank.findAll()
      .then(banks => {
        res.status(200).json({
          status: true,
          banks
        });
      })
      .catch(err => {
        //console.log(err);
        res.status(200).json({
          status: false,
          message: "couldn't find list of banks"
        });
      });
  }
);

router.post(
  "/add-bank",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    const {name, name_en, number} = req.body;
    if (!name || !name_en || !number) {
      return res.status(200).json({
        status: false,
        message: "please complete parameters to add new bank"
      });
    }
    Bank.create({
      name,
      name_en,
      number
    })
      .then(bank => {
        res.status(200).json({
          status: true,
          id: bank.id
        });
      })
      .catch(err => {
        //console.log(err);
        res.status(200).json({
          status: false,
          message: "error in adding new bank"
        });
      });
  }
);



router.delete(
  "/delete-bank",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    const {bankId} = req.body;
    if (!bankId) {
      return res.status(200).json({
        status: false,
        message: "please add bankId to delete bank"
      });
    }
    Bank.destroy({
      where: {
        id: bankId
      }
    })
      .then(() => {
        res.status(200).json({
          status: true
        });
      })
      .catch(err => {
        //console.log(err);
        res.status(200).json({
          status: false,
          message: "error in deleting bank"
        });
      });
  }
);

router.put(
  "/update-bank",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    const {
      name,
      name_en,
      number,
      bankId
    } = req.body;
    if (!bankId) {
      return res.status(200).json({
        status: false,
        message: "please add bankId to update bank"
      });
    }

    Bank.findOne({
      where: {
        id: bankId
      }
    })
      .then(bank => {
        if (!bank) {
          return res.status(200).json({
            status: false,
            message: "no bank with this bankId"
          });
        }
        return bank.update({
          name,
          name_en,
          number
        });
      })
      .then(() => {
        res.status(200).json({
          status: true,
          message: "updated successfully"
        });
      })
      .catch(err => {
        //console.log(err);
        res.status(200).json({
          status: false,
          message: "error in updating bank"
        });
      });
  }
);

router.put(
  "/updateMapsIframeSource",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    if (!req.body.value) {
      return ResponseSender.sendInvalidRequest(res, "value is required", undefined)
    }
    GeneralOption.update({value: req.body.value}, {where: {key: "maps_iframe"}})
      .then((updated) => {
        ResponseSender.sendSuccess(res, "Updated iframe successfully", "updated", updated);
      })
      .catch(err => {
        //console.log(err);
        ResponseSender.sendDBError(res, "Failed to update maps iframe", err);
      });
  }
);
router.get(
  "/mapsIframe",
  (req, res) => {
    GeneralOption.findOrCreate({where: {key: "maps_iframe"}})
      .then((genOpt) => {
        ResponseSender.sendSuccess(res, "Retrieved iframe successfully", "value", genOpt);
      })
      .catch(err => {
        //console.log(err);
        ResponseSender.sendDBError(res, "Failed to update maps iframe", err);
      });
  }
);

module.exports = router;