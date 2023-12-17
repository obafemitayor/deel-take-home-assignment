const { Op } = require('sequelize')
const { sequelize } = require('./model')

const getPaymentJob = (req) => {
  const { Job, Profile } = req.app.get('models')

  const { jobId } = req.params

  const query = {
    include: [{
      model: Job,
      where: { id: jobId }
    },
    {
      model: Profile,
      as: 'Contractor'
    }]
  }

  return req.profile.getClient(query)
}

const makePaymentForJob = async (job, contractorProfile, clientProfile, amount) => {
  const transaction = await sequelize.transaction()

  try {
    const contractorBalance = contractorProfile.balance + amount

    const clientBalance = clientProfile.balance - amount

    const promises = []

    promises.push(contractorProfile.update({ balance: contractorBalance }))

    promises.push(clientProfile.update({ balance: clientBalance }))

    promises.push(job.update({ paid: true, paymentDate: new Date() }))

    await Promise.all(promises)

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()

    if (error instanceof sequelize.ConflictError) {
      throw new Error(JSON.stringify({ status: 409, message: '' }))
    } else {
      throw new Error(JSON.stringify({ status: 500, message: '' }))
    }
  }
}

const getMostEarningProfession = (req) => {
  const { Job, Contract, Profile } = req.app.get('models')

  const { start, end } = req.query

  return Job.findAll({
    attributes: {
      include: [
        'Contract.Contractor.profession',
        [sequelize.fn('SUM', sequelize.literal('price')), 'totalEarnings']
      ]
    },
    include: [
      {
        model: Contract,
        include: [
          {
            model: Profile,
            as: 'Contractor'
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
      [sequelize.fn('SUM', sequelize.literal('price')), 'totalPaid']
    ],
    include: [
      {
        model: Contract,
        include: [
          {
            model: Profile,
            as: 'Client'
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

const getModelsRequiredForPayment = async (req) => {
  const data = await getPaymentJob(req)

  const userData = data[0]

  if (!userData) throw new Error(JSON.stringify({ status: 404, message: 'Job not found' }))

  const job = userData.Jobs[0]

  if (job.paid) throw new Error(JSON.stringify({ status: 400, message: 'Job has already been paid for' }))

  const contractor = userData.Contractor

  return { job, contractor }
}

module.exports = {
  getModelsRequiredForPayment,
  makePaymentForJob,
  getMostEarningProfession,
  getHighestPayingClients
}
