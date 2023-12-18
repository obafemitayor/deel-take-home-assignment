const request = require('supertest')
const { sequelizeMock } = require('./mocks/mock-models')
const app = require('../src/app')

let server

beforeAll(() => {
  app.set('sequelize', sequelizeMock)
  app.set('models', sequelizeMock.models)
  server = app.listen(4000)
})

afterAll((done) => {
  server.close(done)
})

describe('/contracts/:id endpoint should:', () => {
  it('return 401 when profile_id is not present in request', async () => {
    const response = await request(app).get('/contracts/1')
    expect(response.status).toBe(401)
  })

  it('return 200 when profile_id is present in request', async () => {
    const response = await request(app).get('/contracts/1').set('profile_id', '1')

    expect(response.status).toBe(200)

    expect(response.body).toHaveLength(1)
  })
})

describe('/contracts endpoint should:', () => {
  it('return all non terminated contracts', async () => {
    const response = await request(app).get('/contracts').set('profile_id', '1')

    expect(response.status).toBe(200)

    expect(response.body).toHaveLength(2)
  })
})

describe('/jobs/unpaid: endpoint should', () => {
  it('return all unpaid jobs', async () => {
    const response = await request(app).get('/jobs/unpaid').set('profile_id', '1')

    expect(response.status).toBe(200)

    expect(response.body).toHaveLength(2)
  })
})

describe('/jobs/:jobId/pay endpoint should', () => {
  it('return 400 when amount is missing in request', async () => {
    const response = await request(app)
      .post('/jobs/1/pay')
      .set('profile_id', '1')
      .send({})

    expect(response.status).toBe(400)
    expect(response.text).toBe('amount is required')
  })

  it('return 400 when jobId is not a valid number', async () => {
    const response = await request(app)
      .post('/jobs/xxx/pay')
      .set('profile_id', '1')
      .send({})

    expect(response.status).toBe(400)
    expect(response.text).toBe('job Id must be a number')
  })

  it('return 400 when endpoint is called with a contractor profile', async () => {
    const response = await request(app)
      .post('/jobs/1/pay')
      .set('profile_id', '2')
      .send({})

    expect(response.status).toBe(403)
    expect(response.text).toBe('Only clients are allowed to pay for jobs')
  })

  it('return 400 when amount is not a valid number', async () => {
    const response = await request(app)
      .post('/jobs/1/pay')
      .set('profile_id', '1')
      .send({ amount: 'xxx' })

    expect(response.status).toBe(400)
    expect(response.text).toBe('amount must be a number')
  })

  it('return 200 when request is valid', async () => {
    const response = await request(app)
      .post('/jobs/1/pay')
      .set('profile_id', '1')
      .send({ amount: 10 })

    expect(response.status).toBe(200)
  })
})

describe('/balances/deposit/:userId endpoint should', () => {
  it('return 400 when amount is missing in request', async () => {
    const response = await request(app)
      .post('/balances/deposit/2')
      .set('profile_id', '2')
      .send({ amount: 10 })

    expect(response.status).toBe(403)
    expect(response.text).toBe('Only clients can deposit funds')
  })

  it('return 400 when deposit is more than 25% of total jobs to pay', async () => {
    const response = await request(app)
      .post('/balances/deposit/1')
      .set('profile_id', '1')
      .send({ amount: 5000 })

    expect(response.status).toBe(403)
    expect(response.text).toBe('Limit exceeded, You can only deposit up to $25')
  })

  it('return 200 when request is valid', async () => {
    const response = await request(app)
      .post('/balances/deposit/1')
      .set('profile_id', '1')
      .send({ amount: 10 })

    expect(response.status).toBe(200)
  })
})
