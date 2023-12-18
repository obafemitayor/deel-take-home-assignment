const { Op } = require('sequelize')
const { profiles, contracts, jobs } = require('./mock-data')

const associatedModelPropertyNameMapping = {
  Job: 'Jobs'
}

const executeContractQuery = (queryHandler, query, queryModel) => {
  return queryHandler(query, [queryModel])
}

const buildContractQueryParams = (include, contract) => {
  let associatedPropertyName

  let query

  let queryModel
  if (include.where) {
    associatedPropertyName = associatedModelPropertyNameMapping[include.model.name]

    query = 'findAll'

    queryModel = { where: { ...include.where, contractId: contract.id } }
  } else if (include.as) {
    const profileId = include.as === 'Contractor' ? contract.contractorId : contract.clientId

    associatedPropertyName = include.as

    query = 'findOne'

    queryModel = { where: { id: profileId } }
  }

  return { associatedPropertyName, query, queryModel }
}

const buildAssociatedModelInstance = (allAssociatedModels, modelInstance) => {
  allAssociatedModels.forEach((value, key) => {
    modelInstance[key] = value
    modelInstance.dataValues[key] = value
  })
}

const getAssociatedModelsForContract = (includeFilter, contract) => {
  const allAssociatedModels = new Map()

  for (const include of includeFilter) {
    const queryHandler = include.model.$queryInterface._handlers[0]

    const { associatedPropertyName, query, queryModel } = buildContractQueryParams(include, contract)

    const associatedModel = executeContractQuery(queryHandler, query, queryModel)

    if (!associatedModel) break

    if (Array.isArray(associatedModel) && associatedModel.length === 0) break

    if (associatedModel) {
      allAssociatedModels.set(associatedPropertyName, associatedModel)
    }
  }

  return allAssociatedModels
}

const getModelInstanceForInclude = (include, contract, contractModel) => {
  const allAssociatedModels = getAssociatedModelsForContract(include, contract)

  if (allAssociatedModels.size === 0) return null

  const modelInstance = contractModel.build(contract)

  buildAssociatedModelInstance(allAssociatedModels, modelInstance)

  return modelInstance
}

const filterContracts = (where) => {
  let filteredContracts = contracts

  if (where.id) {
    filteredContracts = filteredContracts.filter((contract) => contract.id === parseInt(where.id))
  }

  if (where.status) {
    const opValue = where.status[Op.ne]
    filteredContracts = filteredContracts.filter((contract) => contract.status !== opValue)
  }

  return filteredContracts
}

const filterJobs = (where) => {
  let filteredJobs = jobs
  if (where.id) {
    filteredJobs = filteredJobs.filter((job) => job.id === parseInt(where.id))
  }

  if (where.contractId) {
    filteredJobs = filteredJobs.filter((job) => job.contractId === parseInt(where.contractId))
  }

  if (where.paid) {
    const opValue = where.paid[Op.or]
    filteredJobs = filteredJobs.filter((job) => job.paid === opValue[0] || job.paid === opValue[1])
  }

  return filteredJobs
}

const profileModelQueryHandler = {
  findOne: (queryOptions, profileModel) => {
    const profile = profiles.find((profile) => profile.id === parseInt(queryOptions[0].where.id))
    return profile ? profileModel.build(profile) : null
  }
}

const contractModelQueryHandler = {
  findAll: (queryOptions, contractModel) => {
    const filteredContracts = queryOptions[0].where ? filterContracts(queryOptions[0].where) : contracts

    const result = filteredContracts.reduce((acc, contract) => {
      let modelInstance = contractModel.build(contract)

      if (queryOptions[0].include) modelInstance = getModelInstanceForInclude(queryOptions[0].include, contract, contractModel)

      if (modelInstance && queryOptions[0].attributes) {
        if (queryOptions[0].attributes.include.find((attribute) => attribute.find(x => x === 'totalPrice'))) {
          modelInstance.dataValues.totalPrice = modelInstance.Jobs.reduce((sum, current) => sum + current.price, 0)
        }
      }

      if (modelInstance) acc.push(modelInstance)
      return acc
    }, [])

    return result || null
  }
}

const jobModelQueryHandler = {
  findAll: (queryOptions, jobModel) => {
    const filteredJobs = queryOptions[0].where ? filterJobs(queryOptions[0].where) : jobs

    const result = filteredJobs.reduce((acc, contract) => {
      const modelInstance = jobModel.build(contract)
      acc.push(modelInstance)
      return acc
    }, [])

    return result || null
  }
}

module.exports = { profileModelQueryHandler, contractModelQueryHandler, jobModelQueryHandler }
