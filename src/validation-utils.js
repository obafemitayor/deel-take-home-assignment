const validateJobPaymentRequest = (req, res) => {
  const { jobId } = req.params

  if (!jobId) throw new Error(JSON.stringify({ status: 400, message: 'job Id is required' }))

  if (!isNaN(jobId)) throw new Error(JSON.stringify({ status: 400, message: 'job Id must be a number' }))

  if (!req.body) throw new Error(JSON.stringify({ status: 400, message: 'request body is required' }))

  if (!req.body.amount) throw new Error(JSON.stringify({ status: 400, message: 'amount is required' }))

  if (!isNaN(req.body.amount)) throw new Error(JSON.stringify({ status: 400, message: 'amount must be a number' }))
}

const validateDepositBalanceRequest = (req, res) => {
  const { userId } = req.params

  if (!userId) throw new Error(JSON.stringify({ status: 400, message: 'userId is required' }))

  if (!isNaN(userId)) throw new Error(JSON.stringify({ status: 400, message: 'userId must be a number' }))

  if (userId !== req.profile.id) throw new Error(JSON.stringify({ status: 403, message: 'You can only deposit funds to your own account' }))

  if (!req.body.amount) throw new Error(JSON.stringify({ status: 400, message: 'amount is required' }))

  if (req.profile.type !== 'client') throw new Error(JSON.stringify({ status: 403, message: 'Only clients can deposit funds' }))

  const sumOfJobsToPay = req.profile.getJobs({ where: { paid: false } }).reduce((total, job) => total + job.price, 0)

  const depositLimit = 25 / 100 * sumOfJobsToPay

  if (req.body.amount > depositLimit) throw new Error(JSON.stringify({ status: 403, message: `You can only deposit up to ${depositLimit}` }))
}

module.exports = { validateJobPaymentRequest, validateDepositBalanceRequest }
