const express = require('express')
const bodyParser = require('body-parser')
const { sequelize } = require('./model')
const { getProfile } = require('./middleware/getProfile')
const {
  validateJobPaymentRequest,
  validateDepositBalanceRequest,
  validateMostEarningProfessionRequest,
  validateHighestPayingClientsRequest
} = require('./validation-utils')
const {
  getJobForPayment,
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
    validateJobPaymentRequest(req)

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
    validateDepositBalanceRequest(req)

    const newBalance = req.profile.balance + req.body.amount

    await req.profile.update({ balance: newBalance })

    res.status(200).end()
  } catch (error) {
    if (!isCustomError(error.message)) res.status(500).end()

    const errorMessage = JSON.parse(error.message)

    res.status(errorMessage.status).send(errorMessage.message)
  }
})

app.get('/admin/best-profession', async (req, res) => {
  try {
    validateMostEarningProfessionRequest(req)

    const mostEarningProfession = await getMostEarningProfession(req)

    if (!mostEarningProfession) return res.status(404).end()

    res.json(mostEarningProfession)
  } catch (error) {
    if (!isCustomError(error.message)) res.status(500).end()

    const errorMessage = JSON.parse(error.message)

    res.status(errorMessage.status).send(errorMessage.message)
  }
})

app.get('/admin/best-clients', async (req, res) => {
  try {
    validateHighestPayingClientsRequest(req)

    const highestPayingClients = await getHighestPayingClients(req)

    if (!highestPayingClients) return res.status(404).end()

    const highestPayingClientsResult = highestPayingClients.map((job) => ({
      id: job.dataValues.clientId,
      fullName: job.dataValues.fullName,
      totalPaid: job.dataValues.totalPaid
    }))

    res.json({ highestPayingClientsResult })
  } catch (error) {
    if (!isCustomError(error.message)) res.status(500).end()

    const errorMessage = JSON.parse(error.message)

    res.status(errorMessage.status).send(errorMessage.message)
  }
})

module.exports = app
