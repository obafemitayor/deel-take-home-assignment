const express = require('express')
const bodyParser = require('body-parser')
const { sequelize } = require('./model')
const { getProfile } = require('./middleware/getProfile')
const app = express()
app.use(bodyParser.json())
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

/**
 * FIX ME!
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models')

  const { id } = req.params

  if (!id) return res.status(400).send('Id is required')

  if (!isNaN(id)) return res.status(400).send('Id must be a number')

  const query = { id }

  if (req.profile.type === 'client') {
    query.ClientId = req.profile.id
  } else {
    query.ContractorId = req.profile.id
  }

  const contract = await Contract.findOne({ where: query })

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

module.exports = app
