const express = require('express')
const bodyParser = require('body-parser')
const { Op } = require('sequelize')
const { sequelize } = require('./model')
const { getProfile } = require('./middleware/getProfile')

const {
  validateJobPaymentRequest,
  validateDepositBalanceRequest,
  validateMostEarningProfessionRequest,
  validateHighestPayingClientsRequest
} = require('./validation-utils')

const {
  getModelsRequiredForPayment,
  makePaymentForJob,
  getMostEarningProfession,
  getHighestPayingClients
} = require('./utils')

const app = express()
app.use(bodyParser.json())
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

const isCustomError = (error) => {
  try {
    JSON.parse(error)
    return true
  } catch (error) {
    return false
  }
}

/**
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
  const { id } = req.params

  const parseId = parseInt(id, 10)

  if (isNaN(parseId)) return res.status(400).send('Id must be a number')

  const query = { where: { id: parseId } }

  const contract = req.profile.type === 'client' ? await req.profile.getClient(query) : await req.profile.getContractor(query)

  if (!contract) return res.status(404).end()

  res.json(contract)
})

/**
 * @returns contracts
 */
app.get('/contracts', getProfile, async (req, res) => {
  const query = { where: { status: { [Op.ne]: 'terminated' } } }

  const contracts = req.profile.type === 'client' ? await req.profile.getClient(query) : await req.profile.getContractor(query)

  if (!contracts || contracts.length === 0) return res.status(404).end()

  res.json(contracts)
})

/**
 * @returns unpaid jobs
 */
app.get('/jobs/unpaid', getProfile, async (req, res) => {
  const { Job } = req.app.get('models')

  const query = {
    where: { status: { [Op.ne]: 'terminated' } },
    include: [{
      model: Job,
      where: {
        paid: {
          [Op.or]: [null, false]
        }
      }
    }]
  }

  const userData = req.profile.type === 'client' ? await req.profile.getClient(query) : await req.profile.getContractor(query)

  if (!userData || userData.length === 0) return res.status(404).end()

  const unpaidJobs = userData.reduce((acc, user) => {
    return [...acc, ...user.dataValues.Jobs]
  }, [])

  res.json(unpaidJobs)
})

/**
 * @makes payment for job
 */
app.post('/jobs/:jobId/pay', getProfile, async (req, res) => {
  try {
    await validateJobPaymentRequest(req)

    const { job, contractor } = await getModelsRequiredForPayment(req)

    await makePaymentForJob(job, contractor, req.profile, req.body.amount)

    res.status(200).end()
  } catch (error) {
    if (!isCustomError(error.message)) res.status(500).end()

    const errorMessage = JSON.parse(error.message)

    res.status(errorMessage.status).send(errorMessage.message)
  }
})

/**
 * @makes deposit for user
 */
app.post('/balances/deposit/:userId', getProfile, async (req, res) => {
  try {
    await validateDepositBalanceRequest(req)

    const newBalance = req.profile.balance + req.body.amount

    await req.profile.update({ balance: newBalance })

    res.status(200).end()
  } catch (error) {
    if (!isCustomError(error.message)) res.status(500).end()

    const errorMessage = JSON.parse(error.message)

    res.status(errorMessage.status).send(errorMessage.message)
  }
})

/**
 * @returns best profession
 */
app.get('/admin/best-profession', async (req, res) => {
  try {
    validateMostEarningProfessionRequest(req)

    const sequelizeResult = await getMostEarningProfession(req)

    const data = sequelizeResult[0]

    if (!data) return res.status(404).end()

    const mostEarningProfession = data.Contract.Contractor.profession

    res.json(mostEarningProfession)
  } catch (error) {
    if (!isCustomError(error.message)) res.status(500).end()

    const errorMessage = JSON.parse(error.message)

    res.status(errorMessage.status).send(errorMessage.message)
  }
})

/**
 * @returns best clients
 */
app.get('/admin/best-clients', async (req, res) => {
  try {
    validateHighestPayingClientsRequest(req)

    const highestPayingClients = await getHighestPayingClients(req)

    if (!highestPayingClients) return res.status(404).end()

    const highestPayingClientsResult = highestPayingClients.map((job) => ({
      id: job.Contract.Client.id,
      fullName: `${job.Contract.Client.firstName} ${job.Contract.Client.lastName}`,
      paid: job.dataValues.totalPaid
    }))

    res.json({ highestPayingClientsResult })
  } catch (error) {
    if (!isCustomError(error.message)) res.status(500).end()

    const errorMessage = JSON.parse(error.message)

    res.status(errorMessage.status).send(errorMessage.message)
  }
})

module.exports = app
