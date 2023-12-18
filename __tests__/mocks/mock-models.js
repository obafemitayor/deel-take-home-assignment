const { profileModelQueryHandler, contractModelQueryHandler, jobModelQueryHandler } = require('./query-handlers')

const SequelizeMock = require('sequelize-mock')

const sequelizeMock = new SequelizeMock()

const profileModel = sequelizeMock.define('Profile')

const contractModel = sequelizeMock.define('Contract')

const jobModel = sequelizeMock.define('Job')

contractModel.$queryInterface.$useHandler(function (query, queryOptions) {
  return contractModelQueryHandler[query](queryOptions, contractModel)
})

profileModel.$queryInterface.$useHandler(function (query, queryOptions) {
  return profileModelQueryHandler[query](queryOptions, profileModel)
})

jobModel.$queryInterface.$useHandler(function (query, queryOptions) {
  return jobModelQueryHandler[query](queryOptions, jobModel)
})

profileModel.hasMany(contractModel, { as: 'Contractor', foreignKey: 'ContractorId' })
contractModel.belongsTo(profileModel, { as: 'Contractor' })
profileModel.hasMany(contractModel, { as: 'Client', foreignKey: 'ClientId' })
contractModel.belongsTo(profileModel, { as: 'Client' })
contractModel.hasMany(jobModel)
jobModel.belongsTo(contractModel)

module.exports = { sequelizeMock }
