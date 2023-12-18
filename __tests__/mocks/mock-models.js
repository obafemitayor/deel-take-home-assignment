const { registerHandlers } = require('./mock-factory')

const SequelizeMock = require('sequelize-mock')

const sequelizeMock = new SequelizeMock()

const profileModel = sequelizeMock.define('Profile')

const contractModel = sequelizeMock.define('Contract')

const jobModel = sequelizeMock.define('Job')

registerHandlers(contractModel, profileModel, jobModel)

profileModel.hasMany(contractModel, { as: 'Contractor', foreignKey: 'ContractorId' })
contractModel.belongsTo(profileModel, { as: 'Contractor' })
profileModel.hasMany(contractModel, { as: 'Client', foreignKey: 'ClientId' })
contractModel.belongsTo(profileModel, { as: 'Client' })
contractModel.hasMany(jobModel)
jobModel.belongsTo(contractModel)

module.exports = { sequelizeMock }
