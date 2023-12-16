const express = require('express')
const bodyParser = require('body-parser')
const { sequelize } = require('./model')
const { getProfile } = require('./middleware/getProfile')
const { validateJobPaymentRequest, validateDepositBalanceRequest } = require('./validation-utils')
const app = express()
app.use(bodyParser.json())
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

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

const isCustomError = (error) => {
  try {
    JSON.parse(error)
    return true
  } catch (error) {
    return false
  }
}

/**
 * FIX ME!
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
  const { id } = req.params

  if (!id) return res.status(400).send('Id is required')

  if (!isNaN(id)) return res.status(400).send('Id must be a number')

  const contract = await req.profile.getContracts({
    where: { id }
  })

  if (!contract) return res.status(404).end()

  res.json(contract)
})

/**
 * @returns contracts
 */
app.get('/contracts', getProfile, async (req, res) => {
  const contracts = await req.profile.getContracts()

  if (!contracts) return res.status(404).end()

  res.json(contracts)
})

/**
 * @returns unpaid jobs
 */
app.get('/jobs/unpaid', getProfile, async (req, res) => {
  const unpaidJobs = await req.profile.getJobs({
    where: {
      paid: false
    }
  })

  if (!unpaidJobs) return res.status(404).end()

  res.json(unpaidJobs)
})

app.post('/jobs/:jobId/pay', getProfile, async (req, res) => {
  try {
    validateJobPaymentRequest(req, res)

    const job = await getJobForPayment(req)

    if (!job) return res.status(404).end()

    await makePaymentForJob(job, req.body.amount, res)

    res.status(200).end()
  } catch (error) {
    if (!isCustomError(error.message)) res.status(500).end()

    const errorMessage = JSON.parse(error.message)

    res.status(errorMessage.status).send(errorMessage.message)
  }
})

app.post('/balances/deposit/:userId', getProfile, async (req, res) => {
  try {
    validateDepositBalanceRequest(req, res)

    const newBalance = req.profile.balance + req.body.amount

    await req.profile.update({ balance: newBalance })

    res.status(200).end()
  } catch (error) {
    if (!isCustomError(error.message)) res.status(500).end()

    const errorMessage = JSON.parse(error.message)

    res.status(errorMessage.status).send(errorMessage.message)
  }
})

module.exports = app
