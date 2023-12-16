const { Op } = require('sequelize')
const { sequelize } = require('./model')

const getJobForPayment = (req) => {
  const { Contract, Profile } = req.app.get('models')

  const { jobId } = req.params

  return req.profile.getJobs({
    include: [
      {
        model: Contract,
        include: [
          {
            model: Profile,
            as: 'Contractor',
            attributes: ['id', 'balance']
          },
          {
            model: Profile,
            as: 'Client',
            attributes: ['id', 'balance']
          }
        ]
      }
    ],
    where: {
      id: jobId
    }
  })
}

const makePaymentForJob = async (job, amount, res) => {
  const contractorProfile = job.Contract.Contractor

  const clientProfile = job.Contract.Client

  const transaction = await sequelize.transaction()

  try {
    const contractorBalance = contractorProfile.balance - amount

    const clientBalance = clientProfile.balance + amount

    const promises = []

    promises.add(contractorProfile.update({ balance: contractorBalance }))

    promises.add(clientProfile.update({ balance: clientBalance }))

    await Promise.all(promises)

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()

    if (error instanceof sequelize.ConflictError) {
      res.status(409).end()
    } else {
      res.status(500).end()
    }
  }
}

const getMostEarningProfession = (req) => {
  const { Job, Contract, Profile } = req.app.get('models')

  const { start, end } = req.query

  return Job.findAll({
    attributes: [
      'Contract.Contractor.profession',
      [sequelize.fn('SUM', sequelize.literal('price')), 'totalEarnings']
    ],
    include: [
      {
        model: Contract,
        attributes: [],
        include: [
          {
            model: Profile,
            as: 'Contractor',
            attributes: []
          }
        ]
      }
    ],
    where: {
      paid: true,
      paymentDate: {
        [Op.between]: [new Date(start), new Date(end)]
      }
    },
    group: ['Contract.Contractor.profession'],
    order: [[sequelize.literal('totalEarnings'), 'DESC']],
    limit: 1
  })
}

const getHighestPayingClients = (req) => {
  const { Job, Contract, Profile } = req.app.get('models')

  const { start, end, limit } = req.query

  return Job.findAll({
    attributes: [
      [sequelize.fn('SUM', sequelize.literal('price')), 'totalPaid'],
      [sequelize.fn('CONCAT', sequelize.literal('Contract.Client.firstName'), ' ', sequelize.literal('Contract.Client.lastName')), 'fullName'],
      [sequelize.literal('Contract.Client.id'), 'clientId']
    ],
    include: [
      {
        model: Contract,
        attributes: [],
        include: [
          {
            model: Profile,
            as: 'Client',
            attributes: ['firstName', 'lastName', 'id']
          }
        ]
      }
    ],
    where: {
      paid: true,
      paymentDate: {
        [Op.between]: [start, end]
      }
    },
    group: ['Contract.Client.id'],
    order: [[sequelize.literal('totalPaid'), 'DESC']],
    limit: limit || 2
  })
}

module.exports = {
  getJobForPayment,
  makePaymentForJob,
  getMostEarningProfession,
  getHighestPayingClients
}
