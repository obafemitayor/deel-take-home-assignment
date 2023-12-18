const { profileModelQueryHandler, contractModelQueryHandler, jobModelQueryHandler } = require('./query-handlers')

const registerHandlers = (contractModel, profileModel, jobModel) => {
  contractModel.$queryInterface.$useHandler(function (query, queryOptions) {
    return contractModelQueryHandler[query](queryOptions, contractModel)
  })

  profileModel.$queryInterface.$useHandler(function (query, queryOptions) {
    return profileModelQueryHandler[query](queryOptions, profileModel)
  })

  jobModel.$queryInterface.$useHandler(function (query, queryOptions) {
    return jobModelQueryHandler[query](queryOptions, jobModel)
  })
}

module.exports = { registerHandlers }
